import type { SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { hostnameResolvesToPrivateIp } from '@/lib/utils/ip-utils';

const BUCKET = 'recipe-images';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
};

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;
const MAX_ASPECT = 2.8;
const MIN_ASPECT = 0.45; // supporte les formats verticaux (Reels 9:16 = 0.56)

const SKIP_PATTERNS = /(logo|favicon|sprite|avatar|icon|placeholder|default[-_]?image|blank|pixel|banner|ads?\/)/i;

/** Indique si l'URL pointe déjà vers notre bucket Supabase (image stockée). */
export function isStoredImageUrl(url: string | null | undefined): boolean {
  return !!url && url.includes(`/storage/v1/object/public/${BUCKET}/`);
}

async function safeFetch(
  url: string,
  extraHeaders: Record<string, string> = {},
  timeoutMs = 12000
): Promise<Response | null> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (await hostnameResolvesToPrivateIp(parsed.hostname)) return null;
    const res = await fetch(url, {
      headers: { ...BROWSER_HEADERS, ...extraHeaders },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

/** Télécharge une image distante (avec/sans Referer) et vérifie qu'elle est exploitable. */
export async function downloadValidImage(
  sourceUrl: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (SKIP_PATTERNS.test(sourceUrl)) return null;

  let origin = '';
  try {
    origin = new URL(sourceUrl).origin + '/';
  } catch {
    return null;
  }

  let res = await safeFetch(sourceUrl, { Referer: origin });
  if (!res) res = await safeFetch(sourceUrl);
  if (!res) return null;

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/') || contentType.includes('svg')) return null;

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 5_000) return null; // pixel de tracking ou icône minuscule

  try {
    const sharp = (await import('sharp')).default;
    const meta = await sharp(buffer).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (w < MIN_WIDTH || h < MIN_HEIGHT) return null;
    const ratio = w / h;
    if (ratio > MAX_ASPECT || ratio < MIN_ASPECT) return null;
  } catch {
    return null; // format corrompu ou illisible
  }

  return { buffer, contentType };
}

/** Télécharge une image déjà stockée sur Supabase ou accessible publiquement. */
export async function fetchStoredImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Extrait les images candidates d'une page web (JSON-LD Recipe, og:image, twitter:image). */
export async function fetchPageImageCandidates(pageUrl: string): Promise<string[]> {
  const res = await safeFetch(
    pageUrl,
    { Accept: 'text/html,application/xhtml+xml', 'Sec-Fetch-Dest': 'document' },
    12000
  );
  if (!res) return [];

  const html = (await res.text()).slice(0, 1_500_000);
  const candidates: string[] = [];

  // JSON-LD (le plus fiable pour les sites culinaires)
  const ldBlocks = html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of ldBlocks) {
    try {
      const json = JSON.parse(block[1].trim());
      const stack: unknown[] = Array.isArray(json) ? [...json] : [json];
      while (stack.length) {
        const node = stack.shift() as Record<string, unknown> | undefined;
        if (!node || typeof node !== 'object') continue;
        if (Array.isArray(node['@graph'])) stack.push(...(node['@graph'] as unknown[]));
        const type = node['@type'];
        const isRecipe = Array.isArray(type) ? type.includes('Recipe') : type === 'Recipe';
        if (isRecipe && node.image) {
          const img = node.image as unknown;
          const list = Array.isArray(img) ? img : [img];
          for (const entry of list) {
            if (typeof entry === 'string') candidates.push(entry);
            else if (entry && typeof (entry as { url?: unknown }).url === 'string') {
              candidates.push((entry as { url: string }).url);
            }
          }
        }
      }
    } catch {
      // JSON-LD invalide
    }
  }

  const metaRegexes = [
    /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image(?::secure_url)?["']/gi,
    /<meta[^>]+(?:property|name)=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']twitter:image(?::src)?["']/gi,
  ];
  for (const re of metaRegexes) {
    for (const m of html.matchAll(re)) candidates.push(m[1]);
  }

  const resolved: string[] = [];
  for (const c of candidates) {
    try {
      const abs = new URL(c.replace(/&amp;/g, '&'), pageUrl);
      if (abs.protocol === 'http:') abs.protocol = 'https:';
      const s = abs.toString();
      if (!resolved.includes(s) && !SKIP_PATTERNS.test(s)) resolved.push(s);
    } catch {
      // URL invalide
    }
  }
  return resolved;
}

/**
 * Vérifie par vision IA (Gemini 2.5 Flash) si une image est une authentique photo de plat ou aliment.
 * Retourne :
 * - true  : c'est un plat / nourriture / préparation culinaire.
 * - false : c'est un visage, une personne, du texte, un logo, un motif, une capture d'écran, etc.
 * - null  : impossible à déterminer (ex: pas de clé API ou erreur réseau).
 */
export async function checkDishPhoto(buffer: Buffer, title: string): Promise<boolean | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  let jpegBase64: string;
  try {
    const sharp = (await import('sharp')).default;
    const resized = await sharp(buffer)
      .rotate()
      .resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 65 })
      .toBuffer();
    jpegBase64 = resized.toString('base64');
  } catch {
    return false; // image corrompue / non lisible
  }

  const prompt = `Tu es un contrôleur culinaire strict. On te présente une image qui est censée illustrer la recette de cuisine suivante : "${title}".
Détermine si cette image montre réellement de la nourriture, un plat préparé, des ingrédients ou une recette.
Réponds UNIQUEMENT avec un objet JSON strict :
{
  "is_dish_photo": boolean,
  "reason": "courte explication en français"
}

Règles de validation :
- "is_dish_photo" doit être TRUE si l'image montre principalement de la nourriture, un plat cuisiné, une pâtisserie, un dessert, une boisson ou des ingrédients.
- "is_dish_photo" doit être FALSE si :
  1. L'image montre une ou plusieurs personnes, un visage, un selfie, un buste (ex: créateur de contenu ou cuisinier qui parle).
  2. L'image est une capture d'écran de smartphone ou d'ordinateur.
  3. L'image est couverte de gros texte promotionnel, d'accroches ou de graphismes prédominants.
  4. L'image est un motif décoratif, un dessin, un schéma, un logo ou un fond abstrait.
  5. L'image montre un objet ou paysage sans rapport direct avec un plat préparé.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: jpegBase64,
          mimeType: 'image/jpeg',
        },
      },
    ]);

    const text = result.response.text().trim();
    const parsed = JSON.parse(text);
    if (typeof parsed.is_dish_photo === 'boolean') {
      return parsed.is_dish_photo;
    }
  } catch (err) {
    console.warn('[checkDishPhoto] Échec vérification vision:', err);
  }
  return null;
}

/** Génère une photo du plat via Gemini Image. Retourne null si indisponible. */
export async function generateDishImage(
  title: string,
  ingredients: { text: string }[] = []
): Promise<Buffer | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Modèles par ordre de coût/disponibilité (gemini-3.1-flash-lite-image en priorité, puis repli)
  const models = [
    process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-lite-image',
    'gemini-2.5-flash-image',
  ];
  const keyIngredients = ingredients
    .slice(0, 8)
    .map((i) => i.text)
    .join(', ');

  const prompt =
    `Photographie culinaire professionnelle du plat fini : "${title}". ` +
    (keyIngredients ? `Ingrédients principaux : ${keyIngredients}. ` : '') +
    `Plat appétissant dressé dans une assiette ou un plat de service, vue de dessus à 45 degrés, ` +
    `lumière naturelle douce, arrière-plan de cuisine simple et flou, tons chauds, haute définition. ` +
    `Aucun texte, aucun logo, aucune main, aucune personne, aucun visage.`;

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['IMAGE'] },
          }),
          signal: AbortSignal.timeout(60000),
        }
      );
      if (!res.ok) {
        console.warn(`[recipe-image] modèle ${model} indisponible (${res.status})`);
        continue;
      }
      const json = await res.json();
      const parts: Array<{ inlineData?: { data?: string }; inline_data?: { data?: string } }> =
        json?.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const data = part.inlineData?.data ?? part.inline_data?.data;
        if (data) return Buffer.from(data, 'base64');
      }
    } catch (err) {
      console.warn(`[recipe-image] échec génération IA (${model}):`, err);
    }
  }
  return null;
}

/** Optimise (1200px, WebP) et stocke dans le bucket Supabase. Retourne l'URL publique. */
export async function storeImageBuffer(
  supabase: SupabaseClient,
  userId: string,
  buffer: Buffer,
  fallbackContentType = 'image/jpeg'
): Promise<string | null> {
  let body: Buffer = buffer;
  let contentType = fallbackContentType;
  let ext = fallbackContentType.split('/')[1]?.split(';')[0] ?? 'jpg';

  try {
    const sharp = (await import('sharp')).default;
    body = await sharp(buffer)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    contentType = 'image/webp';
    ext = 'webp';
  } catch {
    // on garde l'original
  }

  const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, body, { contentType, upsert: false });
  if (error) return null;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl ?? null;
}

export interface ResolveImageInput {
  candidates?: (string | null | undefined)[];
  sourceUrl?: string | null;
  title: string;
  ingredients?: { text: string }[];
  allowGeneration?: boolean;
}

export type ResolvedImage = { url: string; origin: 'source' | 'page' | 'generated' };

/**
 * Pipeline complet :
 * 1. Teste et audite les images candidates avec Gemini Vision (rejette visages, personnes, texte).
 * 2. Si rejetée ou absente, cherche des images sur la page source (`fetchPageImageCandidates`) et les audite.
 * 3. Si aucune photo valide trouvée, génère une photo réaliste du plat par IA.
 */
export async function resolveRecipeImage(
  supabase: SupabaseClient,
  userId: string,
  input: ResolveImageInput
): Promise<ResolvedImage | null> {
  const tried = new Set<string>();

  const verifyAndStore = async (
    url: string,
    origin: ResolvedImage['origin']
  ): Promise<ResolvedImage | null> => {
    if (tried.has(url)) return null;
    tried.add(url);

    // Téléchargement du buffer (qu'il soit externe ou sur notre bucket Supabase)
    const isStored = isStoredImageUrl(url);
    let buffer: Buffer | null = null;
    let contentType = 'image/jpeg';

    if (isStored) {
      buffer = await fetchStoredImage(url);
      contentType = 'image/webp';
    } else {
      const downloaded = await downloadValidImage(url);
      if (downloaded) {
        buffer = downloaded.buffer;
        contentType = downloaded.contentType;
      }
    }

    if (!buffer) return null;

    // Validation par Vision IA : l'image doit montrer un plat/nourriture, pas un visage, du texte ou un motif !
    const isDish = await checkDishPhoto(buffer, input.title);
    if (isDish === false) {
      console.log(`[resolveRecipeImage] Image rejetée (non culinaire / visage / texte) pour "${input.title}": ${url}`);
      return null;
    }

    // Si elle est déjà sur Supabase et valide, pas besoin de la ré-uploader
    if (isStored) {
      return { url, origin };
    }

    // Sinon, on la stocke chez nous
    const stored = await storeImageBuffer(supabase, userId, buffer, contentType);
    return stored ? { url: stored, origin } : null;
  };

  // 1. Tester les candidates fournies (ex: image extraite à l'import)
  for (const c of input.candidates ?? []) {
    if (!c) continue;
    const hit = await verifyAndStore(c, 'source');
    if (hit) return hit;
  }

  // 2. Chercher sur la page d'origine
  if (input.sourceUrl) {
    const pageCandidates = await fetchPageImageCandidates(input.sourceUrl);
    for (const c of pageCandidates.slice(0, 5)) {
      const hit = await verifyAndStore(c, 'page');
      if (hit) return hit;
    }
  }

  // 3. Génération IA d'une vraie photo du plat
  if (input.allowGeneration !== false) {
    const generated = await generateDishImage(input.title, input.ingredients ?? []);
    if (generated) {
      const stored = await storeImageBuffer(supabase, userId, generated, 'image/png');
      if (stored) return { url: stored, origin: 'generated' };
    }
  }

  return null;
}

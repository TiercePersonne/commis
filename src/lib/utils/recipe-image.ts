import type { SupabaseClient } from '@supabase/supabase-js';
import { hostnameResolvesToPrivateIp } from '@/lib/utils/ip-utils';

const BUCKET = 'recipe-images';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
};

const MIN_WIDTH = 400;
const MIN_HEIGHT = 250;
const MAX_ASPECT = 2.6; // bannières/logos très larges
const MIN_ASPECT = 0.45; // images très hautes

const SKIP_PATTERNS = /(logo|favicon|sprite|avatar|icon|placeholder|default[-_]?image|blank|pixel|banner|ads?\/)/i;

/** Indique si l'URL pointe déjà vers notre bucket Supabase (image stable). */
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
  if (buffer.length < 8_000) return null; // pixel de tracking / vignette

  try {
    const sharp = (await import('sharp')).default;
    const meta = await sharp(buffer).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (w < MIN_WIDTH || h < MIN_HEIGHT) return null;
    const ratio = w / h;
    if (ratio > MAX_ASPECT || ratio < MIN_ASPECT) return null;
  } catch {
    return null; // format illisible = image "étrange"
  }

  return { buffer, contentType };
}

/** Extrait les images candidates d'une page (JSON-LD Recipe, og:image, twitter:image). */
export async function fetchPageImageCandidates(pageUrl: string): Promise<string[]> {
  const res = await safeFetch(
    pageUrl,
    { Accept: 'text/html,application/xhtml+xml', 'Sec-Fetch-Dest': 'document' },
    12000
  );
  if (!res) return [];

  const html = (await res.text()).slice(0, 1_500_000);
  const candidates: string[] = [];

  // JSON-LD (le plus fiable pour les sites de recettes)
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
      // JSON-LD invalide : on ignore
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
      if (!resolved.includes(s)) resolved.push(s);
    } catch {
      // ignore
    }
  }
  return resolved;
}

/** Génère une photo du plat via Gemini (modèle image). Retourne null si indisponible. */
export async function generateDishImage(
  title: string,
  ingredients: { text: string }[] = []
): Promise<Buffer | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const keyIngredients = ingredients
    .slice(0, 8)
    .map((i) => i.text)
    .join(', ');

  const prompt =
    `Photographie culinaire professionnelle du plat fini : "${title}". ` +
    (keyIngredients ? `Ingrédients principaux : ${keyIngredients}. ` : '') +
    `Plat appétissant dressé dans une assiette ou un plat de service, vue de dessus à 45 degrés, ` +
    `lumière naturelle douce, arrière-plan de cuisine simple et flou, tons chauds, haute définition. ` +
    `Aucun texte, aucun logo, aucune main, aucune personne.`;

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
      console.warn(`[recipe-image] génération IA indisponible (${res.status})`);
      return null;
    }
    const json = await res.json();
    const parts: Array<{ inlineData?: { data?: string }; inline_data?: { data?: string } }> =
      json?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const data = part.inlineData?.data ?? part.inline_data?.data;
      if (data) return Buffer.from(data, 'base64');
    }
    return null;
  } catch (err) {
    console.warn('[recipe-image] échec génération IA:', err);
    return null;
  }
}

/** Optimise (1200px, WebP) et stocke dans le bucket. Retourne l'URL publique. */
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
  /** Autorise la génération IA en dernier recours (défaut : true). */
  allowGeneration?: boolean;
}

export type ResolvedImage = { url: string; origin: 'source' | 'page' | 'generated' };

/**
 * Pipeline complet : images candidates → image de la page source (JSON-LD/og) →
 * génération IA d'une photo du plat. Retourne toujours une image stockée chez nous.
 */
export async function resolveRecipeImage(
  supabase: SupabaseClient,
  userId: string,
  input: ResolveImageInput
): Promise<ResolvedImage | null> {
  const tried = new Set<string>();

  const tryUrl = async (url: string, origin: ResolvedImage['origin']) => {
    if (tried.has(url)) return null;
    tried.add(url);
    const img = await downloadValidImage(url);
    if (!img) return null;
    const stored = await storeImageBuffer(supabase, userId, img.buffer, img.contentType);
    return stored ? ({ url: stored, origin } as ResolvedImage) : null;
  };

  for (const c of input.candidates ?? []) {
    if (!c) continue;
    if (isStoredImageUrl(c)) return { url: c, origin: 'source' };
    const hit = await tryUrl(c, 'source');
    if (hit) return hit;
  }

  if (input.sourceUrl) {
    const pageCandidates = await fetchPageImageCandidates(input.sourceUrl);
    for (const c of pageCandidates.slice(0, 5)) {
      const hit = await tryUrl(c, 'page');
      if (hit) return hit;
    }
  }

  if (input.allowGeneration !== false) {
    const generated = await generateDishImage(input.title, input.ingredients ?? []);
    if (generated) {
      const stored = await storeImageBuffer(supabase, userId, generated, 'image/png');
      if (stored) return { url: stored, origin: 'generated' };
    }
  }

  return null;
}

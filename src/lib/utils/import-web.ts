import type { ExtractedRecipe } from '@/lib/schemas/import-job';

export class ImportError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_URL' | 'SITE_UNREACHABLE' | 'EXTRACTION_FAILED' | 'LLM_UNAVAILABLE'
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

export const IMPORT_ERROR_MESSAGES: Record<ImportError['code'], string> = {
  INVALID_URL: "URL invalide. Vérifiez que l'adresse commence par http:// ou https://",
  SITE_UNREACHABLE: "Impossible d'accéder à ce site. Il est peut-être privé ou temporairement indisponible.",
  EXTRACTION_FAILED: "Impossible d'extraire la recette depuis cette page. Essayez de la saisir manuellement.",
  LLM_UNAVAILABLE: "Le service d'extraction par IA est temporairement indisponible. Une extraction partielle a été tentée.",
};

async function fetchPageViaJina(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'markdown',
      },
    });

    if (!response.ok) {
      console.error(`[import-web] Jina failed: HTTP ${response.status} for ${url}`);
      throw new ImportError(IMPORT_ERROR_MESSAGES.SITE_UNREACHABLE, 'SITE_UNREACHABLE');
    }

    const text = await response.text();
    if (!text || text.length < 100) {
      throw new ImportError(IMPORT_ERROR_MESSAGES.SITE_UNREACHABLE, 'SITE_UNREACHABLE');
    }

    return text;
  } catch (error) {
    if (error instanceof ImportError) throw error;
    console.error(`[import-web] fetchPageViaJina error for ${url}:`, error);
    throw new ImportError(IMPORT_ERROR_MESSAGES.SITE_UNREACHABLE, 'SITE_UNREACHABLE');
  } finally {
    clearTimeout(timeoutId);
  }
}

export function extractFromJsonLd(html: string): Omit<ExtractedRecipe, 'confidence'> | null {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      const items = Array.isArray(json) ? json : json['@graph'] ? json['@graph'] : [json];

      for (const item of items) {
        if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
          const title: string = item.name || '';
          if (!title) continue;

          const rawIngredients: string[] = item.recipeIngredient || [];
          const ingredients = rawIngredients.map((text, order) => ({ text, order }));

          const rawInstructions = item.recipeInstructions || [];
          const steps = (Array.isArray(rawInstructions) ? rawInstructions : [rawInstructions])
            .map((step: unknown, order: number) => ({
              text: typeof step === 'string' ? step : (step as { text?: string })?.text || '',
              order,
            }))
            .filter((s) => s.text.trim().length > 0);

          const imageRaw = item.image;
          let image_url: string | null = null;
          if (typeof imageRaw === 'string') image_url = imageRaw;
          else if (Array.isArray(imageRaw) && imageRaw.length > 0) image_url = typeof imageRaw[0] === 'string' ? imageRaw[0] : imageRaw[0]?.url || null;
          else if (imageRaw?.url) image_url = imageRaw.url;

          const suggested_tags: string[] = [
            ...(item.keywords ? String(item.keywords).split(',').map((s: string) => s.trim()).filter(Boolean) : []),
            ...(item.recipeCategory ? [String(item.recipeCategory).trim()] : []),
            ...(item.recipeCuisine ? [String(item.recipeCuisine).trim()] : []),
          ].slice(0, 8);

          return { title, ingredients, steps, image_url, suggested_tags };
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function extractFromHtml(html: string): Omit<ExtractedRecipe, 'confidence'> | null {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  if (!title) return null;

  const listRegex = /<ul[^>]*>([\s\S]*?)<\/ul>|<ol[^>]*>([\s\S]*?)<\/ol>/gi;
  const lists: string[][] = [];
  let listMatch;
  while ((listMatch = listRegex.exec(html)) !== null) {
    const listHtml = listMatch[1] || listMatch[2];
    const items = [...listHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      .filter((t) => t.length > 3);
    if (items.length > 0) lists.push(items);
  }

  const ingredients = lists[0]?.map((text, order) => ({ text, order })) || [];
  const steps = lists[1]?.map((text, order) => ({ text, order })) || [];

  if (!ingredients.length && !steps.length) return null;

  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  const image_url = imgMatch ? imgMatch[1] : null;

  return { title, ingredients, steps, image_url };
}

async function extractWithLlm(html: string, url: string): Promise<Omit<ExtractedRecipe, 'confidence'> | null> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000);

    const prompt = `Extrait la recette depuis ce contenu de page web et retourne un JSON avec exactement ces champs :
{
  "title": "nom de la recette",
  "ingredients": ["ingrédient 1", "ingrédient 2"],
  "steps": ["étape 1", "étape 2"],
  "image_url": "url de l'image ou null",
  "suggested_tags": ["tag1", "tag2"]
}

Réponds UNIQUEMENT avec le JSON valide, rien d'autre.

URL source : ${url}

Contenu :
${textContent}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    const title: string = parsed.title || '';
    if (!title) return null;

    const ingredients = (parsed.ingredients || []).map((text: string, order: number) => ({ text, order }));
    const steps = (parsed.steps || []).map((text: string, order: number) => ({ text, order }));
    const image_url: string | null = parsed.image_url || null;
    const suggested_tags: string[] = (parsed.suggested_tags || []).slice(0, 8);

    return { title, ingredients, steps, image_url, suggested_tags };
  } catch (error) {
    console.error('[import-web] LLM fallback failed:', error);
    return null;
  }
}

export async function extractFromText(text: string): Promise<ExtractedRecipe> {
  if (!process.env.GEMINI_API_KEY) {
    throw new ImportError(IMPORT_ERROR_MESSAGES.LLM_UNAVAILABLE, 'LLM_UNAVAILABLE');
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const truncated = text.trim().slice(0, 15000);

    const prompt = `Extrait la recette depuis ce texte et retourne un JSON avec exactement ces champs :
{
  "title": "nom de la recette",
  "ingredients": ["ingrédient 1", "ingrédient 2"],
  "steps": ["étape 1", "étape 2"],
  "suggested_tags": ["tag1", "tag2"]
}

Réponds UNIQUEMENT avec le JSON valide, rien d'autre.

Texte :
${truncated}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse JSON invalide');

    const parsed = JSON.parse(jsonMatch[0]);
    const title: string = parsed.title || '';
    if (!title) throw new Error('Titre manquant');

    const ingredients = (parsed.ingredients || []).map((t: string, order: number) => ({ text: t, order }));
    const steps = (parsed.steps || []).map((t: string, order: number) => ({ text: t, order }));
    const suggested_tags: string[] = (parsed.suggested_tags || []).slice(0, 8);

    const confidence: 'complete' | 'partial' =
      ingredients.length > 0 && steps.length > 0 ? 'complete' : 'partial';

    return { title, ingredients, steps, image_url: null, confidence, suggested_tags };
  } catch (error) {
    if (error instanceof ImportError) throw error;
    console.error('[import-web] extractFromText failed:', error);
    throw new ImportError(IMPORT_ERROR_MESSAGES.EXTRACTION_FAILED, 'EXTRACTION_FAILED');
  }
}

function isComplete(result: Omit<ExtractedRecipe, 'confidence'>): boolean {
  return result.ingredients.length > 0 && result.steps.length > 0;
}

export async function extractRecipeFromUrl(
  url: string,
  onStatusUpdate: (status: string) => Promise<void>
): Promise<ExtractedRecipe> {
  await onStatusUpdate('downloading');

  const pageContent = await fetchPageViaJina(url);

  await onStatusUpdate('structuring');

  if (process.env.GEMINI_API_KEY) {
    const llmResult = await extractWithLlm(pageContent, url);
    if (llmResult && isComplete(llmResult)) {
      return { ...llmResult, source_url: url, confidence: 'complete' };
    }
    if (llmResult) {
      return { ...llmResult, source_url: url, confidence: 'partial' };
    }
  }

  throw new ImportError(IMPORT_ERROR_MESSAGES.EXTRACTION_FAILED, 'EXTRACTION_FAILED');
}

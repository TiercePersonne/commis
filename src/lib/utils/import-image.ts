import type { ExtractedRecipe } from '@/lib/schemas/import-job';
import { ImportError, IMPORT_ERROR_MESSAGES } from './import-web';

export async function extractFromImage(base64Image: string, mimeType: string): Promise<ExtractedRecipe> {
  if (!process.env.GEMINI_API_KEY) {
    throw new ImportError(IMPORT_ERROR_MESSAGES.LLM_UNAVAILABLE, 'LLM_UNAVAILABLE');
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Extrait la recette présente sur cette image et retourne un JSON avec exactement ces champs :
{
  "title": "nom de la recette",
  "ingredients": ["ingrédient complet avec quantité 1", "ingrédient complet avec quantité 2"],
  "steps": ["étape 1 complète", "étape 2 complète"],
  "suggested_tags": ["tag1", "tag2"]
}

Règles :
- Essaie de déduire les quantités si elles sont présentes.
- Réponds UNIQUEMENT avec le JSON valide, sans formatage markdown additionnel.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const content = result.response.text().trim();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse JSON invalide ou illisible');

    const parsed = JSON.parse(jsonMatch[0]);
    const title: string = parsed.title || 'Nouvelle recette (depuis image)';

    const ingredients = (parsed.ingredients || []).map((t: string, order: number) => ({ text: t, order }));
    const steps = (parsed.steps || []).map((t: string, order: number) => ({ text: t, order }));
    const suggested_tags: string[] = (parsed.suggested_tags || []).slice(0, 8);

    const confidence: 'complete' | 'partial' =
      ingredients.length > 0 && steps.length > 0 ? 'complete' : 'partial';

    return { title, ingredients, steps, image_url: null, confidence, suggested_tags };
  } catch (error) {
    if (error instanceof ImportError) throw error;
    console.error('[import-image] extractFromImage failed:', error);
    throw new ImportError("Impossible d'extraire la recette depuis cette image.", 'EXTRACTION_FAILED');
  }
}

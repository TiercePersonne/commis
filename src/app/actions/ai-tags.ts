'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { normalizeTagName, buildTagPromptInstructions } from '@/lib/utils/tag-prompt';
import {
  analyzeCollectionLocally,
  classifyRecipeLocally,
  type RecipeInputForClassification,
} from '@/lib/utils/local-recipe-classifier';
import type { Tag } from '@/lib/schemas/tag';

export type ProposedTagItem = {
  name: string;
  isExisting: boolean;
  estimatedCount: number;
};

export type ProposedTagCategory = {
  category: string;
  tags: ProposedTagItem[];
};

export type CollectionAnalysisResult = {
  totalRecipes: number;
  untaggedRecipes: number;
  allRecipeIds: string[];
  untaggedRecipeIds: string[];
  categories: ProposedTagCategory[];
  usedLocalFallback?: boolean;
};

export async function getAiTaggingStats(): Promise<{
  data?: {
    totalRecipes: number;
    untaggedRecipes: number;
    existingTagsCount: number;
  };
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const [{ data: recipes, error: recipesError }, { data: tags, error: tagsError }] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, recipe_tags(tag_id)')
      .eq('user_id', user.id),
    supabase
      .from('tags')
      .select('id')
      .eq('user_id', user.id),
  ]);

  if (recipesError || tagsError) {
    return { error: 'Erreur lors de la lecture de la bibliothèque' };
  }

  const allRecipes = recipes ?? [];
  const untagged = allRecipes.filter((r) => {
    const rt = (r as { recipe_tags?: unknown[] }).recipe_tags;
    return !rt || rt.length === 0;
  });

  return {
    data: {
      totalRecipes: allRecipes.length,
      untaggedRecipes: untagged.length,
      existingTagsCount: (tags ?? []).length,
    },
  };
}

export async function analyzeCollectionForTags(): Promise<{
  data?: CollectionAnalysisResult;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const [{ data: recipes, error: recipesError }, { data: existingTagsData, error: tagsError }] =
    await Promise.all([
      supabase
        .from('recipes')
        .select('id, title, ingredients, recipe_tags(tag_id)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true }),
    ]);

  if (recipesError || tagsError || !recipes) {
    return { error: 'Impossible de récupérer les recettes pour l’analyse' };
  }

  if (recipes.length === 0) {
    return { error: 'Aucune recette trouvée dans votre collection' };
  }

  const existingTags = (existingTagsData ?? []) as Tag[];
  const existingNames = existingTags.map((t) => t.name);
  const existingNormMap = new Map(existingNames.map((n) => [normalizeTagName(n), n]));

  const allRecipeIds = recipes.map((r) => r.id as string);
  const untaggedRecipeIds = recipes
    .filter((r) => {
      const rt = (r as { recipe_tags?: unknown[] }).recipe_tags;
      return !rt || rt.length === 0;
    })
    .map((r) => r.id as string);

  const normalizedRecipes: RecipeInputForClassification[] = recipes.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    ingredients: Array.isArray(r.ingredients) ? (r.ingredients as Array<{ text?: string }>) : [],
  }));

  if (process.env.GEMINI_API_KEY) {
    try {
      const compactList = recipes
        .map((r, i) => {
          const ings = Array.isArray(r.ingredients)
            ? (r.ingredients as Array<{ text?: string }>)
                .slice(0, 6)
                .map((ing) => ing.text ?? '')
                .filter(Boolean)
                .join(', ')
            : '';
          return `${i + 1}. ${r.title}${ings ? ` (${ings.slice(0, 120)})` : ''}`;
        })
        .join('\n');

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Tu es un chef cuisinier et expert en organisation de bibliothèque culinaire.
Voici la collection de ${recipes.length} recettes d'un utilisateur, ainsi que ses tags déjà existants :
Tags existants : ${existingNames.length > 0 ? JSON.stringify(existingNames) : 'Aucun'}

Analyse l'ensemble de ces recettes et propose une liste idéale, claire et équilibrée de tags (entre 15 et 30 tags au total) pour organiser toute sa collection.

Organise tes propositions dans ces 3 catégories :
1. "Protéines & Régimes" (ex: Poulet, Bœuf, Porc, Poisson, Fruits de mer, Œufs, Végétarien, Tofu...)
2. "Types de plats" (ex: Soupe, Tarte, Pâtes, Salade, Plat cuisiné, Gratin, Bowl, Sandwich, Dessert, Apéro...)
3. "Styles & Inspirations" (ex: Asiatique, Italien, Mexicain, Méditerranéen, Rapide, Comfort food...)

Règles importantes :
- Conserve et réutilise TOUS les tags existants pertinents avec leur orthographe exacte.
- Ajoute de nouveaux tags pertinents au vu des recettes réellement présentes dans la liste (ne propose pas un tag s'il n'y a aucune recette correspondante).
- Les noms de tags doivent être courts (1 à 3 mots max), en français, avec une majuscule initiale.
- Pour chaque tag, estime approximativement combien de recettes de la liste sont concernées ("estimatedCount").

Retourne UNIQUEMENT un JSON valide au format suivant, sans backticks ni texte autour :
{
  "categories": [
    {
      "category": "Protéines & Régimes",
      "tags": [
        { "name": "Poulet", "estimatedCount": 42 },
        { "name": "Végétarien", "estimatedCount": 85 }
      ]
    },
    {
      "category": "Types de plats",
      "tags": [
        { "name": "Pâtes", "estimatedCount": 35 },
        { "name": "Soupe", "estimatedCount": 18 }
      ]
    },
    {
      "category": "Styles & Inspirations",
      "tags": [
        { "name": "Asiatique", "estimatedCount": 24 }
      ]
    }
  ]
}

Liste des recettes :
${compactList.slice(0, 90000)}`;

      const result = await model.generateContent(prompt);
      const content = result.response.text().trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          categories?: Array<{
            category: string;
            tags: Array<{ name: string; estimatedCount?: number }>;
          }>;
        };

        const seenNorm = new Set<string>();
        const categories: ProposedTagCategory[] = (parsed.categories ?? []).map((cat) => {
          const items: ProposedTagItem[] = [];
          for (const rawTag of cat.tags ?? []) {
            const trimmed = (rawTag.name ?? '').trim();
            if (!trimmed) continue;
            const norm = normalizeTagName(trimmed);
            if (seenNorm.has(norm)) continue;
            seenNorm.add(norm);

            const existingExact = existingNormMap.get(norm);
            const displayName =
              existingExact ?? trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

            items.push({
              name: displayName,
              isExisting: Boolean(existingExact),
              estimatedCount: Math.max(1, Number(rawTag.estimatedCount) || 1),
            });
          }
          return {
            category: cat.category,
            tags: items,
          };
        });

        const missingExisting = existingNames.filter((n) => !seenNorm.has(normalizeTagName(n)));
        if (missingExisting.length > 0) {
          categories.push({
            category: 'Vos tags existants',
            tags: missingExisting.map((name) => ({
              name,
              isExisting: true,
              estimatedCount: 1,
            })),
          });
        }

        return {
          data: {
            totalRecipes: recipes.length,
            untaggedRecipes: untaggedRecipeIds.length,
            allRecipeIds,
            untaggedRecipeIds,
            categories: categories.filter((c) => c.tags.length > 0),
          },
        };
      }
    } catch (err) {
      console.warn('[ai-tags] Gemini API unavailable (e.g. 402/429), using local culinary analyzer:', err);
    }
  }

  // Fallback automatique : moteur d'analyse culinaire local (instantané et sans coût API)
  const localCategories = analyzeCollectionLocally(normalizedRecipes, existingNames);
  return {
    data: {
      totalRecipes: recipes.length,
      untaggedRecipes: untaggedRecipeIds.length,
      allRecipeIds,
      untaggedRecipeIds,
      categories: localCategories,
      usedLocalFallback: true,
    },
  };
}

export async function prepareApprovedTags(
  approvedTagNames: string[]
): Promise<{ data?: { tags: Tag[]; createdCount: number }; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data: existingData, error: fetchErr } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id);

  if (fetchErr) {
    return { error: 'Erreur lors de la récupération des tags existants' };
  }

  const existingTags = (existingData ?? []) as Tag[];
  const existingByNorm = new Map(existingTags.map((t) => [normalizeTagName(t.name), t]));

  const toCreate: string[] = [];
  for (const rawName of approvedTagNames) {
    const clean = rawName.trim();
    if (!clean) continue;
    const norm = normalizeTagName(clean);
    if (!existingByNorm.has(norm)) {
      existingByNorm.set(norm, { id: '', user_id: user.id, name: clean, created_at: '' });
      toCreate.push(clean.slice(0, 50));
    }
  }

  let createdCount = 0;
  if (toCreate.length > 0) {
    const { data: inserted, error: insertErr } = await supabase
      .from('tags')
      .insert(toCreate.map((name) => ({ user_id: user.id, name })))
      .select('*');

    if (insertErr) {
      console.error('[ai-tags] prepareApprovedTags insert error:', insertErr);
    } else if (inserted) {
      createdCount = inserted.length;
    }
  }

  const { data: finalTags } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  return {
    data: {
      tags: (finalTags ?? []) as Tag[],
      createdCount,
    },
  };
}

export async function autoTagRecipesBatch(
  recipeIds: string[],
  allowedTagNames: string[]
): Promise<{
  data?: { processedCount: number; taggedRecipesCount: number; associationsAdded: number };
  error?: string;
}> {
  if (recipeIds.length === 0 || allowedTagNames.length === 0) {
    return { data: { processedCount: 0, taggedRecipesCount: 0, associationsAdded: 0 } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const [
    { data: recipes, error: recipesErr },
    { data: userTags, error: tagsErr },
    { data: existingLinks },
  ] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, title, ingredients')
      .eq('user_id', user.id)
      .in('id', recipeIds),
    supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id),
    supabase
      .from('recipe_tags')
      .select('recipe_id, tag_id')
      .in('recipe_id', recipeIds),
  ]);

  if (recipesErr || tagsErr || !recipes || !userTags) {
    return { error: 'Erreur lors de la lecture du lot de recettes' };
  }

  const tagByNorm = new Map<string, Tag>();
  for (const t of userTags as Tag[]) {
    tagByNorm.set(normalizeTagName(t.name), t);
  }

  const existingLinkSet = new Set(
    (existingLinks ?? []).map(
      (l: { recipe_id: string; tag_id: string }) => `${l.recipe_id}:${l.tag_id}`
    )
  );

  let assignments: Array<{ id: string; tags: string[] }> | null = null;

  if (process.env.GEMINI_API_KEY) {
    try {
      const recipesPayload = recipes.map((r) => ({
        id: r.id as string,
        title: r.title as string,
        ingredients: Array.isArray(r.ingredients)
          ? (r.ingredients as Array<{ text?: string }>)
              .slice(0, 10)
              .map((i) => i.text ?? '')
              .filter(Boolean)
          : [],
      }));

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Tu es un assistant culinaire chargé de classer des recettes avec précision.
Voici la liste STRICTE des tags autorisés :
${JSON.stringify(allowedTagNames)}

Pour chacune des recettes ci-dessous, sélectionne entre 1 et 4 tags pertinents UNIQUEMENT parmi la liste des tags autorisés ci-dessus (en fonction de la protéine, du type de plat : soupe, tarte, pâtes, salade, plat cuisiné, etc., et du style).

Retourne UNIQUEMENT un JSON valide au format suivant, sans backticks ni texte autour :
{
  "assignments": [
    { "id": "uuid-de-la-recette", "tags": ["Tag 1", "Tag 2"] }
  ]
}

Recettes à classer :
${JSON.stringify(recipesPayload)}`;

      const result = await model.generateContent(prompt);
      const content = result.response.text().trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          assignments?: Array<{ id: string; tags: string[] }>;
        };
        if (parsed.assignments) {
          assignments = parsed.assignments;
        }
      }
    } catch (err) {
      console.warn('[ai-tags] Gemini batch failed (e.g. 402/429), falling back to local classifier:', err);
    }
  }

  // Fallback local si l'API Gemini est indisponible ou sans crédit
  if (!assignments) {
    assignments = recipes.map((r) => ({
      id: r.id as string,
      tags: classifyRecipeLocally(
        {
          id: r.id as string,
          title: r.title as string,
          ingredients: Array.isArray(r.ingredients) ? (r.ingredients as Array<{ text?: string }>) : [],
        },
        allowedTagNames
      ),
    }));
  }

  const validRecipeIds = new Set(recipes.map((r) => r.id as string));
  const rowsToInsert: Array<{ recipe_id: string; tag_id: string }> = [];
  let taggedRecipesCount = 0;

  for (const item of assignments) {
    if (!item.id || !validRecipeIds.has(item.id) || !Array.isArray(item.tags)) continue;
    let matchedForRecipe = 0;

    for (const rawTagName of item.tags) {
      const tagObj = tagByNorm.get(normalizeTagName(rawTagName));
      if (!tagObj) continue;
      const key = `${item.id}:${tagObj.id}`;
      if (!existingLinkSet.has(key)) {
        existingLinkSet.add(key);
        rowsToInsert.push({ recipe_id: item.id, tag_id: tagObj.id });
      }
      matchedForRecipe++;
    }

    if (matchedForRecipe > 0) {
      taggedRecipesCount++;
    }
  }

  if (rowsToInsert.length > 0) {
    const { error: insertErr } = await supabase
      .from('recipe_tags')
      .insert(rowsToInsert);

    if (insertErr) {
      console.error('[ai-tags] recipe_tags insert error:', insertErr);
      return { error: "Erreur lors de l'enregistrement des tags en base" };
    }
  }

  revalidatePath('/');
  return {
    data: {
      processedCount: recipes.length,
      taggedRecipesCount,
      associationsAdded: rowsToInsert.length,
    },
  };
}

export async function suggestTagsForRecipe(
  title: string,
  ingredients: string[]
): Promise<{ data?: string[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data: existingTagsData } = await supabase
    .from('tags')
    .select('name')
    .eq('user_id', user.id);

  const existingTags = (existingTagsData ?? []).map((t: { name: string }) => t.name);

  if (process.env.GEMINI_API_KEY) {
    try {
      const tagInstructions = buildTagPromptInstructions(existingTags);
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Analyse cette recette et suggère les tags les plus pertinents.
Titre : ${title}
Ingrédients : ${ingredients.join(', ')}

${tagInstructions}

Retourne UNIQUEMENT un JSON valide de la forme :
{ "suggested_tags": ["Tag 1", "Tag 2"] }`;

      const result = await model.generateContent(prompt);
      const content = result.response.text().trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { suggested_tags?: string[] };
        if (parsed.suggested_tags?.length) {
          return { data: parsed.suggested_tags.slice(0, 6) };
        }
      }
    } catch (err) {
      console.warn('[ai-tags] suggestTagsForRecipe Gemini fallback to local:', err);
    }
  }

  const localTags = classifyRecipeLocally({
    id: 'temp',
    title,
    ingredients: ingredients.map((text) => ({ text })),
  });
  return { data: localTags };
}

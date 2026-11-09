'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createRecipeSchema, type Recipe } from '@/lib/schemas/recipe';
import type { Tag } from '@/lib/schemas/tag';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';
import { toSentenceCase } from '@/lib/utils/text';
import { resolveRecipeImage, isStoredImageUrl } from '@/lib/utils/recipe-image';

export type RecipeWithTags = Recipe & { tags: Tag[] };

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

export async function createRecipe(
  prevState: { error: string } | null,
  formData: FormData
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const rawIngredients = formData.get('ingredients');
  const rawSteps = formData.get('steps');
  const rawTags = formData.get('tags');

  let ingredients;
  let steps;
  let tags: string[] = [];
  try {
    ingredients = rawIngredients ? JSON.parse(rawIngredients as string) : [];
    steps = rawSteps ? JSON.parse(rawSteps as string) : [];
    tags = rawTags ? JSON.parse(rawTags as string) : [];
  } catch {
    return { error: 'Format de données invalide' };
  }

  const validationResult = createRecipeSchema.safeParse({
    title: formData.get('title'),
    ingredients,
    steps,
  });

  if (!validationResult.success) {
    return { error: validationResult.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      title: toSentenceCase(validationResult.data.title),
      ingredients: validationResult.data.ingredients,
      steps: validationResult.data.steps,
    })
    .select()
    .single();

  if (error) {
    return { error: 'Erreur lors de la création de la recette' };
  }

  if (tags.length > 0) {
    const tagInserts = tags.map(tagId => ({
      recipe_id: data.id,
      tag_id: tagId,
    }));

    await supabase.from('recipe_tags').insert(tagInserts);
  }

  revalidatePath('/');
  // Recette manuelle : photo du plat générée par IA (best effort, ne bloque jamais la création)
  try {
    const generated = await resolveRecipeImage(supabase, user.id, {
      title: data.title,
      ingredients: validationResult.data.ingredients,
    });
    if (generated) {
      await supabase.from('recipes').update({ image_url: generated.url }).eq('id', data.id);
      revalidatePath('/');
    }
  } catch {
    // pas d'image : le fallback visuel prend le relais
  }

  redirect(`/recipes/${data.id}`);
}

export async function getRecipe(id: string): Promise<{ recipe?: Recipe; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return { error: 'Recette introuvable' };
  }

  return { recipe: data as Recipe };
}

export async function getUserRecipes(
  limit: number = 50,
  cursor?: { created_at: string; id: string }
): Promise<{ recipes?: Recipe[]; error?: string; hasMore?: boolean }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  let query = supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  }

  const { data, error } = await query;

  if (error) {
    return { error: 'Erreur lors de la récupération des recettes' };
  }

  const hasMore = data.length > limit;
  const recipes = hasMore ? data.slice(0, limit) : data;

  return { recipes: recipes as Recipe[], hasMore };
}

export async function getUserRecipesWithTags(
  limit: number = 50,
  cursor?: { created_at: string; id: string }
): Promise<{ recipes?: RecipeWithTags[]; error?: string; hasMore?: boolean }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  let query = supabase
    .from('recipes')
    .select('*, recipe_tags(tag_id, tags(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  }

  const { data, error } = await query;

  if (error) {
    return { error: 'Erreur lors de la récupération des recettes' };
  }

  const hasMore = data.length > limit;
  const rawRecipes = hasMore ? data.slice(0, limit) : data;

  const recipes: RecipeWithTags[] = rawRecipes.map((row) => {
    const { recipe_tags, ...recipe } = row as typeof row & { recipe_tags: Array<{ tags: unknown }> };
    const tags = (recipe_tags ?? []).flatMap((rt: { tags: unknown }) => {
      const t = rt.tags;
      if (!t || typeof t !== 'object' || Array.isArray(t)) return [];
      return [t as Tag];
    });
    return { ...(recipe as Recipe), tags };
  });

  return { recipes, hasMore };
}

export async function updateRecipe(
  prevState: { error: string } | null,
  formData: FormData
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const id = formData.get('id') as string;
  if (!id) {
    return { error: 'ID de recette manquant' };
  }

  const rawIngredients = formData.get('ingredients');
  const rawSteps = formData.get('steps');
  const rawTags = formData.get('tags');
  // B7 — Ne mettre à jour image_url que si le champ est explicitement présent dans le formData
  const imageUrlField = formData.has('image_url') ? (formData.get('image_url') as string | null)?.trim() || null : undefined;

  let ingredients;
  let steps;
  let tags: string[] = [];
  try {
    ingredients = rawIngredients ? JSON.parse(rawIngredients as string) : [];
    steps = rawSteps ? JSON.parse(rawSteps as string) : [];
    tags = rawTags ? JSON.parse(rawTags as string) : [];
  } catch {
    return { error: 'Format de données invalide' };
  }

  const validationResult = createRecipeSchema.safeParse({
    title: formData.get('title'),
    ingredients,
    steps,
  });

  if (!validationResult.success) {
    return { error: validationResult.error.issues[0].message };
  }

  const updatePayload: Record<string, unknown> = {
    title: toSentenceCase(validationResult.data.title),
    ingredients: validationResult.data.ingredients,
    steps: validationResult.data.steps,
  };
  // B7 — Inclure image_url seulement si explicitement présent
  if (imageUrlField !== undefined) {
    updatePayload.image_url = imageUrlField;
  }

  const { data, error } = await supabase
    .from('recipes')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !data) {
    return { error: 'Erreur lors de la modification de la recette' };
  }

  await supabase.from('recipe_tags').delete().eq('recipe_id', id);

  if (tags.length > 0) {
    const tagInserts = tags.map(tagId => ({
      recipe_id: id,
      tag_id: tagId,
    }));

    await supabase.from('recipe_tags').insert(tagInserts);
  }

  revalidatePath('/');
  revalidatePath(`/recipes/${id}`);
  redirect(`/recipes/${id}`);
}

export async function updateNotes(
  recipeId: string,
  notes: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { error } = await supabase
    .from('recipes')
    .update({ notes })
    .eq('id', recipeId)
    .eq('user_id', user.id);

  if (error) {
    return { error: 'Erreur lors de la sauvegarde de la note' };
  }

  revalidatePath(`/recipes/${recipeId}`);
  return {};
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: 'Erreur lors de la suppression de la recette' };
  }

  revalidatePath('/');
  redirect('/');
}


export async function saveImportedRecipe(
  recipe: ExtractedRecipe,
  tagIds: string[]
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  // Pipeline image : image extraite -> image de la page source (JSON-LD/og) -> photo generee par IA
  let finalImageUrl: string | null = null;
  try {
    const resolved = await resolveRecipeImage(supabase, user.id, {
      candidates: [recipe.image_url],
      sourceUrl: recipe.source_url,
      title: recipe.title,
      ingredients: recipe.ingredients,
    });
    finalImageUrl = resolved?.url ?? null;
  } catch (err) {
    console.warn('[saveImportedRecipe] resolution image impossible:', err);
  }
  // Dernier recours : conserver l'URL d'origine (affichee via le proxy si possible)
  if (!finalImageUrl) finalImageUrl = recipe.image_url ?? null;

  // B1 — source_type déduit de la source_url ou passé explicitement via ExtractedRecipe
  const sourceType = recipe.source_type ?? 'web';

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      title: toSentenceCase(recipe.title),
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      source_url: recipe.source_url ?? null,
      source_type: sourceType,
      image_url: finalImageUrl,
      confidence: recipe.confidence,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { data: null, error: 'Erreur lors de la sauvegarde de la recette' };
  }

  if (tagIds.length > 0) {
    const tagInserts = tagIds.map((tagId) => ({
      recipe_id: data.id,
      tag_id: tagId,
    }));
    await supabase.from('recipe_tags').insert(tagInserts);
  }

  revalidatePath('/');
  return { data: { id: data.id }, error: null };
}

export async function updateRecipeRating(
  recipeId: string,
  rating: number | null
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Vérifier la limite
  if (rating !== null && (rating < 0 || rating > 5)) {
    return { error: 'La note doit être comprise entre 0 et 5' };
  }

  const { error } = await supabase
    .from('recipes')
    .update({ rating })
    .eq('id', recipeId)
    .eq('user_id', user.id);

  if (error) {
    return { error: 'Erreur lors de la sauvegarde de la note' };
  }

  revalidatePath('/');
  revalidatePath(`/recipes/${recipeId}`);
  return {};
}

/** Liste des recettes dont l'image est absente ou non stockée chez nous (hotlink fragile / étrange). */
export async function getRecipesNeedingImages(): Promise<{
  ids?: string[];
  total?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('recipes')
    .select('id, image_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { error: 'Erreur lors de la lecture des recettes' };

  const rows = data ?? [];
  const ids = rows.filter((r) => !isStoredImageUrl(r.image_url)).map((r) => r.id as string);
  return { ids, total: rows.length };
}

/**
 * Répare l'image d'une recette :
 * - mode 'repair'  : retélécharge l'image existante, sinon cherche sur la page source, sinon génère par IA ;
 * - mode 'generate': génère directement une nouvelle photo du plat par IA.
 */
export async function repairRecipeImage(
  recipeId: string,
  mode: 'repair' | 'generate' = 'repair'
): Promise<{ imageUrl?: string; origin?: 'source' | 'page' | 'generated'; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('id, title, ingredients, source_url, image_url')
    .eq('id', recipeId)
    .eq('user_id', user.id)
    .single();

  if (error || !recipe) return { error: 'Recette introuvable' };

  const resolved = await resolveRecipeImage(supabase, user.id, {
    candidates: mode === 'generate' ? [] : [recipe.image_url],
    sourceUrl: mode === 'generate' ? null : recipe.source_url,
    title: recipe.title,
    ingredients: recipe.ingredients ?? [],
  });

  if (!resolved) {
    return {
      error:
        "Impossible de récupérer ou de générer une image pour cette recette (clé IA indisponible ?).",
    };
  }

  if (resolved.url !== recipe.image_url) {
    const { error: updateError } = await supabase
      .from('recipes')
      .update({ image_url: resolved.url })
      .eq('id', recipeId)
      .eq('user_id', user.id);
    if (updateError) return { error: "Impossible d'enregistrer la nouvelle image" };
  }

  revalidatePath('/');
  revalidatePath(`/recipes/${recipeId}`);
  return { imageUrl: resolved.url, origin: resolved.origin };
}

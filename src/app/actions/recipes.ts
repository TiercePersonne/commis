'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createRecipeSchema, type Recipe } from '@/lib/schemas/recipe';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';

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
      title: validationResult.data.title,
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
    .update({
      title: validationResult.data.title,
      ingredients: validationResult.data.ingredients,
      steps: validationResult.data.steps,
    })
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

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      source_url: recipe.source_url ?? null,
      source_type: 'web',
      image_url: recipe.image_url ?? null,
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

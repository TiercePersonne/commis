'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createTagSchema, type Tag } from '@/lib/schemas/tag';

export async function getUserTags(): Promise<{ tags?: Tag[]; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    return { error: 'Erreur lors de la récupération des tags' };
  }

  return { tags: data as Tag[] };
}

export async function createTag(name: string): Promise<{ tag?: Tag; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const validationResult = createTagSchema.safeParse({ name });
  if (!validationResult.success) {
    return { error: validationResult.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from('tags')
    .insert({
      user_id: user.id,
      name: validationResult.data.name,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ce tag existe déjà' };
    }
    return { error: 'Erreur lors de la création du tag' };
  }

  return { tag: data as Tag };
}

export async function deleteTag(tagId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', user.id);

  if (error) {
    return { error: 'Erreur lors de la suppression du tag' };
  }

  revalidatePath('/');
  return {};
}

export async function getRecipeTags(recipeId: string): Promise<{ tags?: Tag[]; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('recipe_tags')
    .select('tag_id, tags(*)')
    .eq('recipe_id', recipeId);

  if (error) {
    return { error: 'Erreur lors de la récupération des tags' };
  }

  const tags = (data ?? []).flatMap((row) => {
    const maybeTag = (row as { tags?: unknown }).tags;
    if (!maybeTag || typeof maybeTag !== 'object' || Array.isArray(maybeTag)) {
      return [];
    }
    return [maybeTag as Tag];
  });
  return { tags };
}

export async function addTagToRecipe(recipeId: string, tagId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { error } = await supabase
    .from('recipe_tags')
    .insert({
      recipe_id: recipeId,
      tag_id: tagId,
    });

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ce tag est déjà associé à cette recette' };
    }
    return { error: 'Erreur lors de l\'ajout du tag' };
  }

  revalidatePath('/');
  revalidatePath(`/recipes/${recipeId}`);
  return {};
}

export async function removeTagFromRecipe(recipeId: string, tagId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { error } = await supabase
    .from('recipe_tags')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('tag_id', tagId);

  if (error) {
    return { error: 'Erreur lors du retrait du tag' };
  }

  revalidatePath('/');
  revalidatePath(`/recipes/${recipeId}`);
  return {};
}

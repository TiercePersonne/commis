'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createRecipeSchema, type Recipe } from '@/lib/schemas/recipe';
import type { Tag } from '@/lib/schemas/tag';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';
import { toSentenceCase } from '@/lib/utils/text';
import { hostnameResolvesToPrivateIp } from '@/lib/utils/ip-utils';

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

async function uploadImageFromUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sourceUrl: string
): Promise<string | null> {
  const HEADERS_BASE = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  async function tryDownload(withReferer: boolean): Promise<Response | null> {
    try {
      const headers: Record<string, string> = { ...HEADERS_BASE };
      if (withReferer) headers['Referer'] = new URL(sourceUrl).origin + '/';
      const res = await fetch(sourceUrl, { headers, signal: AbortSignal.timeout(10000) });
      if (res.ok) return res;
      return null;
    } catch {
      return null;
    }
  }

  try {
    // A2 — Bloquer les IP privées (SSRF) avant d'effectuer la requête
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      return null;
    }
    if (await hostnameResolvesToPrivateIp(parsedUrl.hostname)) {
      console.warn(`[uploadImageFromUrl] Blocked SSRF attempt to: ${parsedUrl.hostname}`);
      return null;
    }

    // Tentative 1 : avec Referer
    let response = await tryDownload(true);
    // Tentative 2 : sans Referer (contourne certaines protections anti-hotlink)
    if (!response) response = await tryDownload(false);
    if (!response) return null;

    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    const rawBuffer = Buffer.from(await response.arrayBuffer());

    // Optimisation : redimensionnement (max 1200px) + conversion WebP
    // B2 — Tracker le contentType/extension réels selon le succès de sharp
    let processedBuffer: Buffer;
    let effectiveContentType = contentType;
    let effectiveExtension = contentType.split('/')[1]?.split(';')[0] ?? 'jpg';

    try {
      const sharp = (await import('sharp')).default;
      processedBuffer = await sharp(rawBuffer)
        .resize({ width: 1200, withoutEnlargement: true }) // max 1200px, ne pas agrandir les petites images
        .webp({ quality: 82 })                             // WebP, qualité 82% (~70-90% plus léger)
        .toBuffer();
      effectiveContentType = 'image/webp';
      effectiveExtension = 'webp';
    } catch {
      // Si sharp échoue (format non supporté), on upload l'image originale sans changer le type
      processedBuffer = rawBuffer;
    }

    const filename = `${userId}/${Date.now()}.${effectiveExtension}`;

    const { error } = await supabase.storage
      .from('recipe-images')
      .upload(filename, processedBuffer, { contentType: effectiveContentType, upsert: false });

    if (error) return null;

    const { data: urlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(filename);

    return urlData.publicUrl ?? null;
  } catch {
    return null;
  }
}


export async function saveImportedRecipe(
  recipe: ExtractedRecipe,
  tagIds: string[]
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  let finalImageUrl: string | null = recipe.image_url ?? null;
  if (finalImageUrl) {
    const uploaded = await uploadImageFromUrl(supabase, user.id, finalImageUrl);
    if (uploaded) finalImageUrl = uploaded;
  }

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

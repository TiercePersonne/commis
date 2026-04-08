'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { encrypt, decrypt } from '@/lib/utils/crypto';

type ActionResult<T = void> = { data: T; error: null } | { data: null; error: string };

export async function getInstagramCookies(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_settings')
    .select('instagram_cookies')
    .eq('user_id', user.id)
    .single();

  const raw = data?.instagram_cookies ?? null;
  if (!raw) return null;
  try {
    return decrypt(raw);
  } catch {
    return null;
  }
}

export async function hasSharedInstagramCookies(): Promise<boolean> {
  return !!process.env.INSTAGRAM_SHARED_COOKIES;
}

export async function saveInstagramCookies(
  cookiesContent: string | null
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  const encrypted = cookiesContent ? encrypt(cookiesContent) : null;

  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: user.id, instagram_cookies: encrypted, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) return { data: null, error: 'Erreur lors de la sauvegarde' };
  return { data: undefined, error: null };
}

export async function exportUserData(): Promise<{ data?: string; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id);

  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id);

  const { data: recipeTags } = await supabase
    .from('recipe_tags')
    .select('recipe_id, tag_id');

  const { data: mealPlans } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', user.id);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    recipes: recipes || [],
    tags: tags || [],
    recipe_tags: recipeTags || [],
    meal_plans: mealPlans || [],
  };

  return { data: JSON.stringify(exportData, null, 2) };
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { error: mealPlansError } = await supabase
    .from('meal_plans')
    .delete()
    .eq('user_id', user.id);

  if (mealPlansError) {
    return { error: 'Erreur lors de la suppression des plans de repas' };
  }

  const { error: recipeTagsError } = await supabase
    .from('recipe_tags')
    .delete()
    .in('recipe_id', 
      (await supabase.from('recipes').select('id').eq('user_id', user.id)).data?.map(r => r.id) || []
    );

  if (recipeTagsError) {
    return { error: 'Erreur lors de la suppression des tags de recettes' };
  }

  const { error: recipesError } = await supabase
    .from('recipes')
    .delete()
    .eq('user_id', user.id);

  if (recipesError) {
    return { error: 'Erreur lors de la suppression des recettes' };
  }

  const { error: tagsError } = await supabase
    .from('tags')
    .delete()
    .eq('user_id', user.id);

  if (tagsError) {
    return { error: 'Erreur lors de la suppression des tags' };
  }

  await supabase.auth.signOut();
  redirect('/login');
}

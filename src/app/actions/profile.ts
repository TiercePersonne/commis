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
  // A7 — Ne pas exposer la config à des utilisateurs non authentifiés
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
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
    .select('id')
    .eq('user_id', user.id);

  const userRecipeIds = (recipes ?? []).map((r) => r.id);

  const { data: allRecipes } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id);

  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id);

  // B4 — Filtrer recipe_tags par les recettes de l'utilisateur (défense en profondeur)
  const { data: recipeTags } = userRecipeIds.length > 0
    ? await supabase
        .from('recipe_tags')
        .select('recipe_id, tag_id')
        .in('recipe_id', userRecipeIds)
    : { data: [] };

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
    recipes: allRecipes || [],
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

  // Récupérer les IDs de recettes avant suppression
  const { data: userRecipes, error: recipesQueryError } = await supabase
    .from('recipes')
    .select('id')
    .eq('user_id', user.id);

  if (recipesQueryError) {
    return { error: 'Erreur lors de la récupération des recettes' };
  }

  const userRecipeIds = (userRecipes ?? []).map((r) => r.id);

  // 1 — Supprimer les plans de repas
  const { error: mealPlansError } = await supabase
    .from('meal_plans')
    .delete()
    .eq('user_id', user.id);

  if (mealPlansError) {
    return { error: 'Erreur lors de la suppression des plans de repas' };
  }

  // 2 — Supprimer les import_jobs (B3)
  const { error: importJobsError } = await supabase
    .from('import_jobs')
    .delete()
    .eq('user_id', user.id);

  if (importJobsError) {
    return { error: "Erreur lors de la suppression des jobs d'import" };
  }

  // 3 — Supprimer recipe_tags (vérification préalable, Code #16)
  if (userRecipeIds.length > 0) {
    const { error: recipeTagsError } = await supabase
      .from('recipe_tags')
      .delete()
      .in('recipe_id', userRecipeIds);

    if (recipeTagsError) {
      return { error: 'Erreur lors de la suppression des tags de recettes' };
    }
  }

  // 4 — Supprimer les recettes
  const { error: recipesError } = await supabase
    .from('recipes')
    .delete()
    .eq('user_id', user.id);

  if (recipesError) {
    return { error: 'Erreur lors de la suppression des recettes' };
  }

  // 5 — Supprimer les tags
  const { error: tagsError } = await supabase
    .from('tags')
    .delete()
    .eq('user_id', user.id);

  if (tagsError) {
    return { error: 'Erreur lors de la suppression des tags' };
  }

  // 6 — Supprimer les paramètres utilisateur (cookies Instagram chiffrés) (B3)
  const { error: settingsError } = await supabase
    .from('user_settings')
    .delete()
    .eq('user_id', user.id);

  if (settingsError) {
    return { error: 'Erreur lors de la suppression des paramètres' };
  }

  // 7 — Supprimer les fichiers Storage du dossier de l'utilisateur (B3)
  const { data: storageFiles } = await supabase.storage
    .from('recipe-images')
    .list(user.id);

  if (storageFiles && storageFiles.length > 0) {
    const filePaths = storageFiles.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from('recipe-images').remove(filePaths);
  }

  // 8 — Supprimer le compte dans Supabase Auth (B3)
  // Nécessite la variable SUPABASE_SERVICE_ROLE_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serviceKey && supabaseUrl) {
    try {
      const { createClient: createAdminClient } = await import('@supabase/supabase-js');
      const adminClient = createAdminClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await adminClient.auth.admin.deleteUser(user.id);
    } catch (e) {
      console.error('[deleteAccount] Failed to delete auth user:', e);
      // Ne pas bloquer — le compte est déjà vidé
    }
  }

  await supabase.auth.signOut();
  redirect('/login');
}


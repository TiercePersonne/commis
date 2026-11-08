'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isSupportedVideoUrl } from '@/lib/utils/url-utils';
import {
  createInboxToken,
  extractFirstUrl,
  consumeLocalInboxForUser,
} from '@/lib/utils/inbox-store';
import { normalizeTagName } from '@/lib/utils/tag-prompt';
import { classifyRecipeLocally } from '@/lib/utils/local-recipe-classifier';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';

export interface QueuedLinkItem {
  id: string;
  source_url: string;
  source_type: 'web' | 'reel';
  created_at: string;
}

export async function getMyInboxToken(): Promise<{
  token?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  try {
    const token = createInboxToken(user.id);
    return { token };
  } catch {
    return { error: 'Impossible de générer le jeton (ENCRYPTION_SECRET manquant)' };
  }
}

export async function getQueuedLinks(): Promise<{
  items?: QueuedLinkItem[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  // 1. Synchroniser les éventuels liens reçus par /api/inbox dans le tampon local
  const buffered = await consumeLocalInboxForUser(user.id);
  if (buffered.length > 0) {
    const { data: existingRows } = await supabase
      .from('import_jobs')
      .select('source_url')
      .eq('user_id', user.id)
      .eq('status', 'queued');

    const existingUrls = new Set(
      (existingRows ?? []).map((r: { source_url: string }) => r.source_url)
    );

    const toInsert = buffered
      .filter((b) => !existingUrls.has(b.source_url))
      .map((b) => ({
        user_id: user.id,
        status: 'queued',
        source_url: b.source_url,
        source_type: b.source_type,
      }));

    if (toInsert.length > 0) {
      await supabase.from('import_jobs').insert(toInsert);
    }
  }

  // 2. Récupérer tous les liens en attente depuis Supabase
  const { data, error } = await supabase
    .from('import_jobs')
    .select('id, source_url, source_type, created_at')
    .eq('user_id', user.id)
    .eq('status', 'queued')
    .order('created_at', { ascending: true });

  if (error) {
    return { error: "Erreur lors de la lecture de la file d'attente" };
  }

  return {
    items: (data ?? []) as QueuedLinkItem[],
  };
}

export async function enqueueSharedLink(
  rawTextOrUrl: string
): Promise<{ item?: QueuedLinkItem; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const cleanUrl = extractFirstUrl(rawTextOrUrl);
  if (!cleanUrl) {
    return { error: 'Aucun lien valide trouvé' };
  }

  const sourceType: 'web' | 'reel' = isSupportedVideoUrl(cleanUrl) ? 'reel' : 'web';

  const { data: existing } = await supabase
    .from('import_jobs')
    .select('id, source_url, source_type, created_at')
    .eq('user_id', user.id)
    .eq('status', 'queued')
    .eq('source_url', cleanUrl)
    .maybeSingle();

  if (existing) {
    return { item: existing as QueuedLinkItem };
  }

  const { data, error } = await supabase
    .from('import_jobs')
    .insert({
      user_id: user.id,
      status: 'queued',
      source_url: cleanUrl,
      source_type: sourceType,
    })
    .select('id, source_url, source_type, created_at')
    .single();

  if (error || !data) {
    return { error: "Erreur lors de l'ajout à la file d'attente" };
  }

  revalidatePath('/import');
  return { item: data as QueuedLinkItem };
}

export async function removeQueuedLinkByUrl(
  url: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  await supabase
    .from('import_jobs')
    .delete()
    .eq('user_id', user.id)
    .eq('status', 'queued')
    .eq('source_url', url);

  return {};
}

export async function clearAllQueuedLinks(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  await supabase
    .from('import_jobs')
    .delete()
    .eq('user_id', user.id)
    .eq('status', 'queued');

  revalidatePath('/import');
  return {};
}

export async function resolveMatchingTagIdsForRecipe(
  recipe: ExtractedRecipe
): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: tags } = await supabase
    .from('tags')
    .select('id, name')
    .eq('user_id', user.id);

  if (!tags || tags.length === 0) return [];

  const existingTagNames = tags.map((t: { name: string }) => t.name);
  const localSuggested = classifyRecipeLocally(
    {
      id: 'temp',
      title: recipe.title,
      ingredients: recipe.ingredients,
    },
    existingTagNames
  );

  const combinedSuggestions = [
    ...(recipe.suggested_tags ?? []),
    ...localSuggested,
  ];
  const suggestedNormSet = new Set(combinedSuggestions.map(normalizeTagName));

  return tags
    .filter((t: { id: string; name: string }) =>
      suggestedNormSet.has(normalizeTagName(t.name))
    )
    .map((t: { id: string }) => t.id);
}

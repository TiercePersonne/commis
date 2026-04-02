'use server';

import { createClient } from '@/lib/supabase/server';
import { extractRecipeFromUrl, extractFromText, ImportError, IMPORT_ERROR_MESSAGES } from '@/lib/utils/import-web';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

export async function startImport(
  url: string
): Promise<ActionResult<{ recipe: ExtractedRecipe }>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  const { data: job, error: createError } = await supabase
    .from('import_jobs')
    .insert({
      user_id: user.id,
      status: 'pending',
      source_url: url,
      source_type: 'web',
    })
    .select('id')
    .single();

  if (createError || !job) {
    return { data: null, error: "Erreur lors du démarrage de l'import" };
  }

  try {
    const extracted = await extractRecipeFromUrl(url, async (status) => {
      await supabase
        .from('import_jobs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', job.id);
    });

    await supabase
      .from('import_jobs')
      .update({ status: 'done', result: extracted, updated_at: new Date().toISOString() })
      .eq('id', job.id);

    return { data: { recipe: extracted }, error: null };
  } catch (error) {
    const message =
      error instanceof ImportError
        ? IMPORT_ERROR_MESSAGES[error.code]
        : "Une erreur inattendue s'est produite lors de l'import.";

    await supabase
      .from('import_jobs')
      .update({ status: 'error', error_message: message, updated_at: new Date().toISOString() })
      .eq('id', job.id);

    return { data: null, error: message };
  }
}

export async function getImportStatus(
  jobId: string
): Promise<ActionResult<{ status: string; errorMessage?: string }>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('import_jobs')
    .select('status, error_message')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return { data: null, error: 'Import introuvable' };
  }

  return {
    data: {
      status: data.status,
      errorMessage: data.error_message ?? undefined,
    },
    error: null,
  };
}

export async function getImportResult(
  jobId: string
): Promise<ActionResult<ExtractedRecipe>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('import_jobs')
    .select('status, result')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return { data: null, error: 'Import introuvable' };
  }

  if (data.status !== 'done' || !data.result) {
    return { data: null, error: "L'import n'est pas encore terminé" };
  }

  return { data: data.result as ExtractedRecipe, error: null };
}

export async function startImportFromText(
  text: string
): Promise<ActionResult<{ recipe: ExtractedRecipe }>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  try {
    const extracted = await extractFromText(text);
    return { data: { recipe: extracted }, error: null };
  } catch (error) {
    const message =
      error instanceof ImportError
        ? IMPORT_ERROR_MESSAGES[error.code]
        : "Une erreur inattendue s'est produite lors de l'extraction.";
    return { data: null, error: message };
  }
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { extractRecipeFromUrl, extractFromText, ImportError, IMPORT_ERROR_MESSAGES } from '@/lib/utils/import-web';
import { extractRecipeFromReel, isSupportedVideoUrl } from '@/lib/utils/import-reel';
import { extractFromImage } from '@/lib/utils/import-image';
import { getInstagramCookies } from '@/app/actions/profile';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

export async function startImport(
  url: string
): Promise<ActionResult<{ recipe: ExtractedRecipe }>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  // D6 — Valider que l'URL utilise un protocole sûr
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { data: null, error: "URL invalide. Seuls les liens http:// et https:// sont acceptés." };
    }
  } catch {
    return { data: null, error: "URL invalide." };
  }

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

export async function startImportFromReel(
  url: string
): Promise<ActionResult<{ recipe: ExtractedRecipe }>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  if (!isSupportedVideoUrl(url)) {
    return { data: null, error: "URL invalide. Collez un lien Instagram, TikTok ou YouTube." };
  }

  const { data: job, error: createError } = await supabase
    .from('import_jobs')
    .insert({
      user_id: user.id,
      status: 'pending',
      source_url: url,
      source_type: 'reel',
    })
    .select('id')
    .single();

  if (createError || !job) {
    return { data: null, error: "Erreur lors du démarrage de l'import" };
  }

  const cookiesContent = await getInstagramCookies();

  try {
    const extracted = await extractRecipeFromReel(url, async (status) => {
      await supabase
        .from('import_jobs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', job.id);
    }, cookiesContent);

    await supabase
      .from('import_jobs')
      .update({ status: 'done', result: extracted, updated_at: new Date().toISOString() })
      .eq('id', job.id);

    return { data: { recipe: extracted }, error: null };
  } catch (error) {
    // B8 — Uniformiser : utiliser IMPORT_ERROR_MESSAGES pour les ImportError
    const message =
      error instanceof ImportError
        ? IMPORT_ERROR_MESSAGES[error.code]
        : "Une erreur inattendue s'est produite lors de l'import de la vidéo.";

    await supabase
      .from('import_jobs')
      .update({ status: 'error', error_message: message, updated_at: new Date().toISOString() })
      .eq('id', job.id);

    return { data: null, error: message };
  }
}

export async function startImportFromImage(
  formData: FormData
): Promise<ActionResult<{ recipe: ExtractedRecipe }>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  try {
    const file = formData.get('image');

    // A4 — Valider que le champ est bien un File (pas un string)
    if (!file || !(file instanceof File)) {
      return { data: null, error: "Aucune image fournie" };
    }

    // A4 — Limiter la taille à 10 Mo (10 * 1024 * 1024 bytes)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return { data: null, error: "L'image est trop volumineuse (max 10 Mo)." };
    }

    // A4 — Valider le type MIME côté serveur
    if (!file.type.startsWith('image/')) {
      return { data: null, error: "Le fichier doit être une image." };
    }

    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = file.type;

    const extracted = await extractFromImage(base64Image, mimeType);
    // B1 — Marquer le source_type correctement
    return { data: { recipe: { ...extracted, source_type: 'image' as const } }, error: null };
  } catch (error) {
    // B8 — Uniformiser le handling des ImportError
    const message =
      error instanceof ImportError
        ? IMPORT_ERROR_MESSAGES[error.code]
        : "Une erreur inattendue s'est produite lors de l'analyse de l'image.";
    return { data: null, error: message };
  }
}


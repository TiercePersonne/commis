'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Bot, X } from 'lucide-react';
import { AppLayout } from '@/app/components/app-layout';
import { ImportSourceSelector } from '@/app/components/import-source-selector';
import { RecipePreview } from '@/app/components/recipe-preview';
import {
  startImport,
  startImportFromText,
  startImportFromReel,
  startImportFromImage,
} from '@/app/actions/import';
import {
  getQueuedLinks,
  enqueueSharedLink,
  removeQueuedLinkByUrl,
  clearAllQueuedLinks,
  type QueuedLinkItem,
} from '@/app/actions/inbox';
import { saveImportedRecipe } from '@/app/actions/recipes';
import { loadDraft, clearDraft } from '@/lib/utils/draft';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';

type PageState =
  | 'idle'
  | 'loading'
  | 'loading-reel'
  | 'loading-image'
  | 'preview'
  | 'saving'
  | 'error';

export default function ImportPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('idle');
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [draftBanner, setDraftBanner] = useState(false);
  const [draftRecipe, setDraftRecipe] = useState<Partial<ExtractedRecipe> | null>(null);
  const [queuedLinks, setQueuedLinks] = useState<QueuedLinkItem[]>([]);
  const [sharedToast, setSharedToast] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadDraft();
    if (draft?.title) {
      setDraftBanner(true);
      setDraftRecipe(draft);
    }

    const initInbox = async () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const sharedParam =
          params.get('shared') || params.get('url') || params.get('text');

        if (sharedParam) {
          const enq = await enqueueSharedLink(sharedParam);
          if (enq.item) {
            setSharedToast(
              'Recette ajoutée à ta file d’attente ! Tu peux lancer l’import ou retourner sur Instagram.'
            );
          }
          window.history.replaceState({}, '', '/import');
        }
      }

      const res = await getQueuedLinks();
      if (res.items) {
        setQueuedLinks(res.items);
      }
    };

    initInbox();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        getQueuedLinks().then((res) => {
          if (res.items) setQueuedLinks(res.items);
        });
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  const handleRemoveQueuedLink = async (url: string) => {
    setQueuedLinks((prev) => prev.filter((item) => item.source_url !== url));
    await removeQueuedLinkByUrl(url);
  };

  const handleClearQueuedLinks = async () => {
    setQueuedLinks([]);
    await clearAllQueuedLinks();
  };

  const handleImportStart = async (_jobId: string, url: string) => {
    setImportError(null);

    const result = await startImport(url);
    if (result.error) {
      setImportError(result.error);
      setPageState('error');
      return;
    }

    setExtractedRecipe(result.data!.recipe);
    setPageState('preview');
  };

  const handleReelImport = async (url: string) => {
    setImportError(null);

    const result = await startImportFromReel(url);
    if (result.error) {
      setImportError(result.error);
      setPageState('error');
      return;
    }

    setExtractedRecipe(result.data!.recipe);
    setPageState('preview');
  };

  const handleTextImport = async (text: string) => {
    setImportError(null);

    const result = await startImportFromText(text);
    if (result.error) {
      setImportError(result.error);
      setPageState('error');
      return;
    }

    setExtractedRecipe(result.data!.recipe);
    setPageState('preview');
  };

  const handleImageImport = async (formData: FormData) => {
    setImportError(null);

    const result = await startImportFromImage(formData);
    if (result.error) {
      setImportError(result.error);
      setPageState('error');
      return;
    }

    setExtractedRecipe(result.data!.recipe);
    setPageState('preview');
  };

  const handleSaveRecipe = async (recipe: ExtractedRecipe, tagIds: string[]) => {
    setPageState('saving');
    const result = await saveImportedRecipe(recipe, tagIds);
    if (result.error) {
      setImportError(result.error);
      setPageState('preview');
      return;
    }
    clearDraft();
    router.push(`/recipes/${result.data!.id}`);
  };

  const handleCancel = () => {
    clearDraft();
    setExtractedRecipe(null);
    setImportError(null);
    setPageState('idle');
  };

  const handleRetry = () => {
    setImportError(null);
    setPageState('idle');
  };

  const handleBulkDone = () => {
    router.push('/');
  };

  const handleResumeDraft = () => {
    if (draftRecipe?.title) {
      setExtractedRecipe({
        title: draftRecipe.title ?? '',
        ingredients: draftRecipe.ingredients ?? [],
        steps: draftRecipe.steps ?? [],
        image_url: draftRecipe.image_url ?? null,
        source_url: draftRecipe.source_url,
        confidence: draftRecipe.confidence ?? 'partial',
        suggested_tags: draftRecipe.suggested_tags,
      });
      setPageState('preview');
    }
    setDraftBanner(false);
  };

  const handleDismissDraft = () => {
    clearDraft();
    setDraftBanner(false);
    setDraftRecipe(null);
  };

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 md:px-10 pb-12">
        {sharedToast && (
          <div className="mt-4 max-w-2xl mx-auto p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium text-emerald-300">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} strokeWidth={1.8} className="shrink-0" />
              <span>{sharedToast}</span>
            </span>
            <button
              type="button"
              onClick={() => setSharedToast(null)}
              className="text-emerald-300 hover:text-white p-1"
              aria-label="Fermer la notification"
            >
              <X size={15} strokeWidth={1.8} />
            </button>
          </div>
        )}

        {/* Banner brouillon */}
        {draftBanner && pageState === 'idle' && (
          <div className="mt-4 max-w-2xl mx-auto p-4 glass-panel rounded-2xl flex items-center justify-between gap-4">
            <p className="text-[13.5px] text-[var(--color-text-primary)]">
              Vous avez un brouillon non sauvegardé. Voulez-vous le reprendre ?
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleResumeDraft}
                className="px-3.5 py-1.5 bg-[var(--color-accent)] text-white text-xs font-medium rounded-xl hover:bg-[var(--accent-primary-hover)] transition-colors"
              >
                Reprendre
              </button>
              <button
                onClick={handleDismissDraft}
                className="px-3.5 py-1.5 glass-pill text-[var(--color-text-secondary)] text-xs rounded-xl hover:text-white transition-colors"
              >
                Ignorer
              </button>
            </div>
          </div>
        )}

        {/* Sélecteur de source */}
        {pageState === 'idle' && (
          <ImportSourceSelector
            onImportStart={handleImportStart}
            onTextImport={handleTextImport}
            onReelImport={handleReelImport}
            onImageImport={handleImageImport}
            onBulkDone={handleBulkDone}
            queuedLinks={queuedLinks}
            onRemoveQueuedLink={handleRemoveQueuedLink}
            onClearQueuedLinks={handleClearQueuedLinks}
          />
        )}

        {/* Aperçu + correction */}
        {(pageState === 'preview' || pageState === 'saving') && extractedRecipe && (
          <RecipePreview
            initialRecipe={extractedRecipe}
            onSave={handleSaveRecipe}
            onCancel={handleCancel}
            isSaving={pageState === 'saving'}
          />
        )}

        {/* Erreur d'import */}
        {pageState === 'error' && (
          <div className="mt-8 max-w-xl mx-auto p-8 glass-panel border-red-500/30 rounded-3xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/30 mb-4">
              <AlertCircle size={30} strokeWidth={1.5} />
            </div>
            <h3 className="text-[18px] font-serif font-medium text-[var(--color-text-primary)] mb-2">
              Aïe, l&apos;import a échoué
            </h3>
            <p className="text-[14px] text-[var(--color-text-secondary)] mb-8 px-4">
              {importError}
            </p>

            {importError?.includes("Impossible d'extraire la recette depuis cette page") && (
              <div className="mb-6 p-5 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-left max-w-md mx-auto">
                <p className="text-[14px] text-amber-300 font-semibold mb-1 flex items-center gap-2">
                  <Bot size={16} strokeWidth={1.6} />
                  <span>Astuce : Le site bloque notre robot</span>
                </p>
                <p className="text-[13px] text-[var(--color-text-secondary)] mb-4">
                  Prenez simplement la recette en photo ou faites une capture d&apos;écran, et utilisez notre outil de reconnaissance visuelle.
                </p>
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--accent-primary-hover)] text-white rounded-xl text-[13px] font-semibold transition-colors w-full"
                >
                  Essayer l&apos;import Photo
                </button>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] text-[14px] font-semibold transition-all"
              >
                Réessayer
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 glass-pill text-[var(--color-text-primary)] rounded-xl hover:bg-white/10 text-[14px] font-medium transition-all"
              >
                Nouvelle extraction
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

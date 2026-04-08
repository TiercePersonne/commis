'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { AppLayout } from '@/app/components/app-layout';
import { ImportSourceSelector } from '@/app/components/import-source-selector';
import { RecipePreview } from '@/app/components/recipe-preview';
import { startImport, startImportFromText, startImportFromReel } from '@/app/actions/import';
import { saveImportedRecipe } from '@/app/actions/recipes';
import { BulkImportView } from '@/app/components/bulk-import-view';
import { loadDraft, clearDraft } from '@/lib/utils/draft';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';

type PageState = 'idle' | 'loading' | 'loading-reel' | 'preview' | 'saving' | 'error' | 'bulk';

function SkeletonReel() {
  return (
    <div className="mt-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="text-2xl">🎬</div>
        <p className="text-[14px] text-[var(--color-text-secondary)] animate-pulse">
          Transcription du Reel en cours… (peut prendre 30–60 secondes)
        </p>
      </div>
      <div className="space-y-3">
        {["Téléchargement de l'audio", 'Transcription par IA', 'Structuration de la recette'].map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-[13px] text-[var(--color-text-muted)]">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border)] animate-pulse" />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonImport() {
  return (
    <div className="mt-8 max-w-2xl">
      <p className="text-[14px] text-[var(--color-text-secondary)] mb-4 animate-pulse">
        Extraction de la recette en cours…
      </p>
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[var(--color-border)] rounded-[var(--radius-md)] w-2/3" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-[var(--color-border-light)] rounded w-full" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-[var(--color-border-light)] rounded w-5/6" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ImportPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('idle');
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [draftBanner, setDraftBanner] = useState(false);
  const [draftRecipe, setDraftRecipe] = useState<Partial<ExtractedRecipe> | null>(null);

  useEffect(() => {
    const draft = loadDraft();
    if (draft?.title) {
      setDraftBanner(true);
      setDraftRecipe(draft);
    }
  }, []);

  const handleImportStart = async (_jobId: string, url: string) => {
    setImportError(null);
    setPageState('loading');

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
    setPageState('loading-reel');

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
    setPageState('loading');

    const result = await startImportFromText(text);
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
      <div className="px-10 pb-10">
        <h1 className="text-[28px] font-serif font-bold text-[var(--color-text-primary)] pt-8 pb-2">
          Importer une recette
        </h1>
        <p className="text-[14px] text-[var(--color-text-muted)] pb-2">
          Importez une recette depuis un site web
        </p>

        {/* Banner brouillon */}
        {draftBanner && pageState === 'idle' && (
          <div className="mt-4 max-w-2xl p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] flex items-center justify-between gap-4">
            <p className="text-[14px] text-[var(--color-text-primary)]">
              Vous avez un brouillon non sauvegardé. Voulez-vous le reprendre ?
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleResumeDraft}
                className="px-3 py-1.5 bg-[var(--color-accent)] text-white text-[13px] font-medium rounded-[var(--radius-sm)] hover:bg-[var(--accent-primary-hover)] transition-colors"
              >
                Reprendre
              </button>
              <button
                onClick={handleDismissDraft}
                className="px-3 py-1.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[13px] rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-primary)] transition-colors"
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
            onBulkImport={() => setPageState('bulk')}
          />
        )}

        {/* Import en masse */}
        {pageState === 'bulk' && (
          <BulkImportView onDone={handleBulkDone} />
        )}

        {/* Skeleton loading */}
        {pageState === 'loading' && <SkeletonImport />}
        {pageState === 'loading-reel' && <SkeletonReel />}

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
          <div className="mt-8 max-w-2xl p-6 bg-red-50 border border-red-200 rounded-[var(--radius-lg)]">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
              <div className="flex-1">
                <p className="font-medium text-red-800">Import échoué</p>
                <p className="text-sm text-red-700 mt-1">{importError}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--accent-primary-hover)] text-sm font-medium transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-primary)] text-sm transition-colors"
              >
                Nouvelle URL
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

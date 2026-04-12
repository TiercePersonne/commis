'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { AppLayout } from '@/app/components/app-layout';
import { ImportSourceSelector } from '@/app/components/import-source-selector';
import { RecipePreview } from '@/app/components/recipe-preview';
import { startImport, startImportFromText, startImportFromReel, startImportFromImage } from '@/app/actions/import';
import { saveImportedRecipe } from '@/app/actions/recipes';
import { loadDraft, clearDraft } from '@/lib/utils/draft';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';

type PageState = 'idle' | 'loading' | 'loading-reel' | 'loading-image' | 'preview' | 'saving' | 'error';

function SmartLoader({ source }: { source: 'web' | 'reel' | 'image' | 'text' }) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const icons = {
    web: '🌐',
    reel: '🎬',
    image: '📸',
    text: '📋'
  };

  const steps = {
    web: ['Connexion au site...', 'Téléchargement de la page...', "Analyse par l'IA...", "Dressage de l'assiette..."],
    reel: ['Téléchargement du Reel...', "Transcription par l'IA...", 'Analyse des instructions...', "Dressage de l'assiette..."],
    image: ['Lecture de l\'image...', "Extraction des textes par l'IA...", 'Structuration des ingrédients...', "Dressage de l'assiette..."],
    text: ['Lecture du texte...', 'Tri des informations...', 'Structuration des étapes...', "Dressage de l'assiette..."]
  }[source];

  useEffect(() => {
    const duration = source === 'reel' ? 30000 : source === 'web' ? 12000 : 5000;
    const intervalMs = 100;
    const increment = (100 / (duration / intervalMs));

    const progressTimer = setInterval(() => {
      setProgress(p => {
        const next = p + increment;
        return next > 90 ? 90 + (next - 90) * 0.1 : next;
      });
    }, intervalMs);

    const stepDuration = duration / steps.length;
    const stepTimer = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, steps.length - 1));
    }, stepDuration);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, [source, steps.length]);

  return (
    <div className="mt-12 max-w-lg mx-auto bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-sm p-8 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-3xl mb-6 shadow-sm animate-bounce">
        {icons[source]}
      </div>
      <h3 className="text-[17px] font-bold text-[var(--color-text-primary)] mb-2 transition-all">
        {steps[stepIndex]}
      </h3>
      <p className="text-[13px] text-[var(--color-text-muted)] mb-8 h-4">
        Veuillez patienter quelques instants...
      </p>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[var(--color-accent)] transition-all ease-linear"
          style={{ width: `${progress}%`, transitionDuration: '100ms' }}
        />
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

  const handleImageImport = async (formData: FormData) => {
    setImportError(null);
    setPageState('loading-image');

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
      <div className="px-4 md:px-10 pb-10">
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
            onImageImport={handleImageImport}
            onBulkDone={handleBulkDone}
          />
        )}

        {/* Smart loading states */}
        {pageState === 'loading' && <SmartLoader source="web" />}
        {pageState === 'loading-reel' && <SmartLoader source="reel" />}
        {pageState === 'loading-image' && <SmartLoader source="image" />}

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
          <div className="mt-8 max-w-xl mx-auto p-8 bg-[var(--color-bg-card)] border-2 border-red-100 rounded-[var(--radius-xl)] shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-[18px] font-bold text-[var(--color-text-primary)] mb-2">Aïe, l&apos;import a échoué</h3>
            <p className="text-[14px] text-[var(--color-text-secondary)] mb-8 px-4">{importError}</p>

            {importError?.includes('Impossible d\'extraire la recette depuis cette page') && (
              <div className="mb-6 p-5 bg-orange-50 rounded-[var(--radius-lg)] border border-orange-100 text-left max-w-md mx-auto">
                <p className="text-[14px] text-orange-900 font-bold mb-1">Astuce : Le site bloque notre robot 🤖</p>
                <p className="text-[13px] text-orange-800 mb-4">
                  Prenez simplement la recette en photo ou faites une capture d&apos;écran, et utilisez notre outil de reconnaissance visuelle.
                </p>
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-[var(--radius-md)] text-[13px] font-bold shadow-sm transition-colors w-full"
                >
                  Essayer l&apos;import Photo
                </button>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-[var(--radius-md)] hover:bg-black/80 text-[14px] font-bold transition-all shadow-sm"
              >
                Réessayer
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] hover:bg-[var(--color-border)] text-[14px] font-bold transition-all shadow-sm"
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

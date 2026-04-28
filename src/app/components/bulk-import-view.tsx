'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Copy, Check } from 'lucide-react';
import { isSupportedVideoUrl } from '@/lib/utils/url-utils';
import { startImport, startImportFromReel } from '@/app/actions/import';
import { saveImportedRecipe } from '@/app/actions/recipes';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';

type UrlStatus = 'pending' | 'importing' | 'saving' | 'done' | 'error';

interface UrlEntry {
  url: string;
  type: 'web' | 'reel';
  status: UrlStatus;
  error?: string;
  recipeTitle?: string;
  recipeId?: string;
  progress?: number;
}

interface BulkImportViewProps {
  onDone: () => void;
}

const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export function BulkImportView({ onDone }: BulkImportViewProps) {
  const [rawText, setRawText] = useState('');
  const [entries, setEntries] = useState<UrlEntry[] | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const [progressTimer, setProgressTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setEntries((prev) => {
        if (!prev) return prev;
        let changed = false;
        const next = prev.map((entry) => {
          if (entry.status === 'importing' || entry.status === 'saving') {
            changed = true;
            const currentProgress = entry.progress ?? 0;
            const max = entry.status === 'saving' ? 98 : 95;
            
            // Progression décélérée
            const speedFactor = entry.type === 'reel' ? 0.04 : 0.15;
            
            if (currentProgress < max) {
              const increment = (max - currentProgress) * speedFactor;
              return { ...entry, progress: Math.min(currentProgress + increment, max) };
            }
          }
          return entry;
        });
        return changed ? next : prev;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [running]);

  const parseUrls = (): UrlEntry[] => {
    return rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http'))
      .map((url) => ({
        url,
        type: isSupportedVideoUrl(url) ? 'reel' : 'web',
        status: 'pending' as UrlStatus,
        progress: 0,
      }));
  };

  const updateEntry = (index: number, patch: Partial<UrlEntry>) => {
    setEntries((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleStart = async () => {
    const parsed = parseUrls();
    if (!parsed.length) return;
    setEntries(parsed);
    setRunning(true);

    for (let i = 0; i < parsed.length; i++) {
      const entry = parsed[i];
      updateEntry(i, { status: 'importing', progress: 5 });

      try {
        let recipe: ExtractedRecipe;

        if (entry.type === 'reel') {
          // Limite à 90 secondes pour une vidéo
          const result = await withTimeout(startImportFromReel(entry.url), 90000, "Délai d'attente dépassé (90s max)");
          if (result.error || !result.data) throw new Error(result.error ?? 'Échec import vidéo');
          recipe = result.data.recipe;
        } else {
          // Limite à 45 secondes pour un lien web
          const result = await withTimeout(startImport(entry.url), 45000, "Délai d'attente dépassé (45s max)");
          if (result.error || !result.data) throw new Error(result.error ?? 'Échec import web');
          recipe = result.data.recipe;
        }

        updateEntry(i, { status: 'saving', progress: 90 });
        // Limite à 15 secondes pour la sauvegarde
        const saveResult = await withTimeout(saveImportedRecipe(recipe, []), 15000, "Délai de sauvegarde dépassé");
        if (saveResult.error || !saveResult.data) throw new Error(saveResult.error ?? 'Échec sauvegarde');

        updateEntry(i, {
          status: 'done',
          recipeTitle: recipe.title,
          recipeId: saveResult.data.id,
          progress: 100,
        });
      } catch (err) {
        updateEntry(i, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        });
      }
    }

    setRunning(false);
  };

  const urlCount = rawText.split('\n').filter((l) => l.trim().startsWith('http')).length;
  const errorEntries = entries?.filter((e) => e.status === 'error') || [];
  const doneCount = entries?.filter((e) => e.status === 'done').length ?? 0;
  const allDone = entries !== null && !running;
  
  const totalProgress = entries?.reduce((acc, entry) => acc + (entry.progress ?? 0), 0) ?? 0;
  const globalProgressPercent = entries?.length ? totalProgress / entries.length : 0;

  const handleCopyErrors = () => {
    const errorUrls = errorEntries.map((e) => e.url).join('\n');
    navigator.clipboard.writeText(errorUrls);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full">
      {!entries ? (
        <div className="space-y-4">
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            Collez plusieurs URLs (une par ligne) — liens de sites web, Reels Instagram, vidéos TikTok ou YouTube acceptés.
          </p>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`https://exemple.com/recette-1\nhttps://www.instagram.com/reel/ABC123/\nhttps://exemple.com/recette-2`}
            className="w-full px-3 py-2.5 text-[13px] font-mono border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] outline-none resize-none h-32 md:h-48"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleStart}
              disabled={urlCount === 0}
              className="px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-xl font-medium text-[14px] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Importer {urlCount > 0 ? `${urlCount} recette${urlCount > 1 ? 's' : ''}` : ''}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
              {running
                ? `Import en cours… (${doneCount}/${entries.length})`
                : `Import terminé — ${doneCount}/${entries.length} recettes importées`}
            </p>
            {allDone && (
              <button
                onClick={onDone}
                className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl text-[13px] font-medium hover:bg-[var(--accent-primary-hover)] transition-colors"
              >
                Voir mes recettes
              </button>
            )}
          </div>

          {allDone && errorEntries.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3 dark:bg-red-950/20 dark:border-red-900/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[14px] font-medium text-red-800 dark:text-red-400">
                    {errorEntries.length} lien{errorEntries.length > 1 ? 's' : ''} en erreur
                  </h4>
                  <p className="text-[13px] text-red-600 dark:text-red-500 mt-1">
                    Certains liens n'ont pas pu être importés. Vous pouvez les copier pour réessayer plus tard.
                  </p>
                </div>
                <button
                  onClick={handleCopyErrors}
                  className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-[13px] font-medium hover:bg-red-200 transition-colors dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copier
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Barre de progression Globale */}
          <div className="w-full h-2 bg-[var(--color-border-light)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${globalProgressPercent}%` }}
            />
          </div>

          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl"
              >
                <div className="mt-0.5 shrink-0">
                  {entry.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border)]" />}
                  {(entry.status === 'importing' || entry.status === 'saving') && (
                    <Loader2 size={20} className="animate-spin text-[var(--color-accent)]" />
                  )}
                  {entry.status === 'done' && <CheckCircle size={20} className="text-green-600" />}
                  {entry.status === 'error' && <XCircle size={20} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--color-text-muted)] truncate">{entry.url}</p>
                  {entry.status === 'importing' && (
                    <p className="text-[12px] text-[var(--color-accent)] mt-0.5">
                      {entry.type === 'reel' ? 'Transcription vidéo…' : 'Extraction web…'}
                    </p>
                  )}
                  {entry.status === 'saving' && (
                    <p className="text-[12px] text-[var(--color-accent)] mt-0.5">Sauvegarde…</p>
                  )}
                  
                  {/* Barre de progression individuelle */}
                  {(entry.status === 'importing' || entry.status === 'saving') && (
                    <div className="w-full h-1 mt-2 bg-[var(--color-border-light)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-accent)] transition-all duration-300"
                        style={{ width: `${entry.progress ?? 0}%` }}
                      />
                    </div>
                  )}

                  {entry.status === 'done' && entry.recipeTitle && (
                    <a
                      href={`/recipes/${entry.recipeId}`}
                      className="text-[12px] text-green-700 font-medium mt-0.5 hover:underline block"
                    >
                      {entry.recipeTitle}
                    </a>
                  )}
                  {entry.status === 'error' && (
                    <p className="text-[12px] text-red-600 mt-0.5">{entry.error}</p>
                  )}
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)] shrink-0 mt-0.5">
                  {entry.type === 'reel' ? '🎬' : '🌐'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

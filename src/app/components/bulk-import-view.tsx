'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
}

interface BulkImportViewProps {
  onDone: () => void;
}

export function BulkImportView({ onDone }: BulkImportViewProps) {
  const [rawText, setRawText] = useState('');
  const [entries, setEntries] = useState<UrlEntry[] | null>(null);
  const [running, setRunning] = useState(false);

  const parseUrls = (): UrlEntry[] => {
    return rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http'))
      .map((url) => ({
        url,
        type: isSupportedVideoUrl(url) ? 'reel' : 'web',
        status: 'pending' as UrlStatus,
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
      updateEntry(i, { status: 'importing' });

      try {
        let recipe: ExtractedRecipe;

        if (entry.type === 'reel') {
          const result = await startImportFromReel(entry.url);
          if (result.error || !result.data) throw new Error(result.error ?? 'Échec import vidéo');
          recipe = result.data.recipe;
        } else {
          const result = await startImport(entry.url);
          if (result.error || !result.data) throw new Error(result.error ?? 'Échec import web');
          recipe = result.data.recipe;
        }

        updateEntry(i, { status: 'saving' });
        const saveResult = await saveImportedRecipe(recipe, []);
        if (saveResult.error || !saveResult.data) throw new Error(saveResult.error ?? 'Échec sauvegarde');

        updateEntry(i, {
          status: 'done',
          recipeTitle: recipe.title,
          recipeId: saveResult.data.id,
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
  const doneCount = entries?.filter((e) => e.status === 'done').length ?? 0;
  const allDone = entries !== null && !running;

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
            rows={8}
            className="w-full px-3 py-2.5 text-[13px] font-mono border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] outline-none resize-none"
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

          {/* Barre de progression */}
          <div className="w-full h-2 bg-[var(--color-border-light)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${entries.length ? (doneCount / entries.length) * 100 : 0}%` }}
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

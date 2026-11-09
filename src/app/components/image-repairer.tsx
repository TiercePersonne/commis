'use client';

import { useState } from 'react';
import { ImageIcon, CheckCircle2, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import {
  getAllRecipesForImageAudit,
  auditAndRepairRecipeImage,
  type AuditRepairResult,
} from '@/app/actions/recipes';

type Step = 'idle' | 'scanning' | 'running' | 'done';

type LogEntry = {
  id: string;
  title: string;
  status: AuditRepairResult['status'];
  message?: string;
};

export function ImageRepairer() {
  const [step, setStep] = useState<Step>('idle');
  const [total, setTotal] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [currentRecipeTitle, setCurrentRecipeTitle] = useState('');
  const [stats, setStats] = useState({ valid: 0, replaced: 0, generated: 0, failed: 0 });
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setError(null);
    setStep('scanning');
    setStats({ valid: 0, replaced: 0, generated: 0, failed: 0 });
    setProcessed(0);
    setRecentLogs([]);
    setCurrentRecipeTitle('');

    const res = await getAllRecipesForImageAudit();
    if (res.error || !res.recipes) {
      setError(res.error ?? 'Erreur lors du chargement des recettes');
      setStep('idle');
      return;
    }

    const recipes = res.recipes;
    setTotal(recipes.length);

    if (recipes.length === 0) {
      setStep('done');
      return;
    }

    setStep('running');
    let valid = 0;
    let replaced = 0;
    let generated = 0;
    let failed = 0;

    for (let i = 0; i < recipes.length; i++) {
      const item = recipes[i];
      setCurrentRecipeTitle(item.title);

      const r = await auditAndRepairRecipeImage(item.id);

      if (r.status === 'valid') valid++;
      else if (r.status === 'replaced') replaced++;
      else if (r.status === 'generated') generated++;
      else failed++;

      setStats({ valid, replaced, generated, failed });
      setProcessed(i + 1);

      setRecentLogs((prev) => [
        {
          id: item.id,
          title: item.title,
          status: r.status,
          message: r.message ?? r.error,
        },
        ...prev.slice(0, 4),
      ]);
    }

    setCurrentRecipeTitle('');
    setStep('done');
  };

  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="glass-panel rounded-3xl p-6 space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-serif font-medium text-[var(--color-text-primary)] flex items-center gap-2">
          <ImageIcon size={18} strokeWidth={1.6} className="text-[var(--color-accent)]" />
          <span>Auditer et réparer les images des recettes</span>
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
          Analyse par vision IA chaque image pour détecter les personnes, selfies, textes, logos ou motifs non culinaires, et les remplace automatiquement par de vraies photos du plat.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm text-red-300">
          {error}
        </div>
      )}

      {(step === 'idle' || step === 'done') && (
        <button
          type="button"
          onClick={handleStart}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] font-medium text-xs sm:text-sm transition-colors shadow-sm"
        >
          {step === 'done' ? (
            <>
              <RefreshCw size={15} strokeWidth={1.7} />
              <span>Relancer un audit complet</span>
            </>
          ) : (
            <>
              <Sparkles size={15} strokeWidth={1.7} />
              <span>Analyser et réparer ma bibliothèque</span>
            </>
          )}
        </button>
      )}

      {step === 'scanning' && (
        <p className="text-xs text-[var(--color-text-muted)] animate-pulse">
          Chargement de votre bibliothèque de recettes…
        </p>
      )}

      {step === 'running' && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <RefreshCw size={15} className="animate-spin text-[var(--color-accent)]" />
              <span>Audit et réparation en cours…</span>
            </span>
            <span className="text-xs font-mono text-[var(--color-text-secondary)]">
              {processed} / {total} ({percent}%)
            </span>
          </div>

          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>

          {currentRecipeTitle && (
            <p className="text-xs text-[var(--color-text-secondary)] truncate">
              Recette en cours : <strong className="text-[var(--color-text-primary)]">{currentRecipeTitle}</strong>
            </p>
          )}

          {/* Mini journal d'activité en temps réel */}
          {recentLogs.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-[var(--color-text-secondary)]">
                    {log.title}
                  </span>
                  <span
                    className={`shrink-0 font-medium ${
                      log.status === 'valid'
                        ? 'text-emerald-400'
                        : log.status === 'replaced' || log.status === 'generated'
                        ? 'text-[var(--color-accent)]'
                        : 'text-red-400'
                    }`}
                  >
                    {log.status === 'valid' && 'Photo conforme'}
                    {log.status === 'replaced' && 'Image non culinaire remplacée'}
                    {log.status === 'generated' && 'Photo créée par IA'}
                    {log.status === 'failed' && 'Échec'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'done' && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-[var(--color-text-secondary)] space-y-2">
          <p className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={17} strokeWidth={1.8} />
            <span>Audit et réparation terminés avec succès</span>
          </p>

          <ul className="space-y-1 pt-1 text-[var(--color-text-primary)]">
            <li>
              • <strong className="text-emerald-400">{stats.valid}</strong> photos vérifiées et conformes (vrais plats culinaires)
            </li>
            {stats.replaced > 0 && (
              <li>
                • <strong className="text-[var(--color-accent)]">{stats.replaced}</strong> images non conformes remplacées (visages, personnes, textes ou motifs éliminés)
              </li>
            )}
            {stats.generated > 0 && (
              <li>
                • <strong className="text-[var(--color-accent)]">{stats.generated}</strong> nouvelles photos créées par IA pour les recettes sans image
              </li>
            )}
            {stats.failed > 0 && (
              <li className="text-red-400 flex items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>
                  <strong>{stats.failed}</strong> recettes n&apos;ont pas pu être traitées (vérifiez votre quota Gemini)
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

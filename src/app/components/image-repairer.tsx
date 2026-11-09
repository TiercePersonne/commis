'use client';

import { useState } from 'react';
import { ImageIcon, CheckCircle2 } from 'lucide-react';
import { getRecipesNeedingImages, repairRecipeImage } from '@/app/actions/recipes';

type Step = 'idle' | 'scanning' | 'running' | 'done';

export function ImageRepairer() {
  const [step, setStep] = useState<Step>('idle');
  const [total, setTotal] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [stats, setStats] = useState({ recovered: 0, generated: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setError(null);
    setStep('scanning');
    setStats({ recovered: 0, generated: 0, failed: 0 });
    setProcessed(0);

    const res = await getRecipesNeedingImages();
    if (res.error || !res.ids) {
      setError(res.error ?? 'Erreur lors de la recherche');
      setStep('idle');
      return;
    }

    setTotal(res.ids.length);
    if (res.ids.length === 0) {
      setStep('done');
      return;
    }

    setStep('running');
    let recovered = 0;
    let generated = 0;
    let failed = 0;

    // Une recette à la fois : évite les timeouts et ménage le quota de l'IA
    for (let i = 0; i < res.ids.length; i++) {
      const r = await repairRecipeImage(res.ids[i], 'repair');
      if (r.error) failed++;
      else if (r.origin === 'generated') generated++;
      else recovered++;
      setProcessed(i + 1);
      setStats({ recovered, generated, failed });
    }

    setStep('done');
  };

  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="glass-panel rounded-3xl p-6 space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-serif font-medium text-[var(--color-text-primary)] flex items-center gap-2">
          <ImageIcon size={18} strokeWidth={1.6} className="text-[var(--color-accent)]" />
          <span>Réparer les images des recettes</span>
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
          Récupère les images manquantes ou cassées depuis la page d&apos;origine et, à défaut, génère une photo du plat par IA.
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
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] font-medium text-xs sm:text-sm transition-colors"
        >
          <ImageIcon size={15} strokeWidth={1.7} />
          <span>{step === 'done' ? 'Relancer la réparation' : 'Analyser et réparer'}</span>
        </button>
      )}

      {step === 'scanning' && (
        <p className="text-xs text-[var(--color-text-muted)]">Analyse de votre bibliothèque…</p>
      )}

      {step === 'running' && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[var(--color-text-primary)]">
              Réparation en cours…
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {processed} / {total}
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Ne fermez pas cette page. Chaque recette peut prendre quelques secondes.
          </p>
        </div>
      )}

      {step === 'done' && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-[var(--color-text-secondary)] space-y-1">
          <p className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={16} strokeWidth={1.8} />
            <span>{total === 0 ? 'Toutes vos images sont déjà en ordre' : 'Réparation terminée'}</span>
          </p>
          {total > 0 && (
            <ul className="space-y-0.5">
              <li>• <strong className="text-white">{stats.recovered}</strong> images récupérées</li>
              <li>• <strong className="text-white">{stats.generated}</strong> photos générées par IA</li>
              {stats.failed > 0 && (
                <li>• <strong className="text-red-300">{stats.failed}</strong> recettes sans résultat</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

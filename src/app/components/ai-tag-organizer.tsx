'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  Tag as TagIcon,
  Search,
  ChefHat,
  CheckCircle2,
  Info,
  Check,
  Plus,
} from 'lucide-react';
import {
  getAiTaggingStats,
  analyzeCollectionForTags,
  prepareApprovedTags,
  autoTagRecipesBatch,
  type CollectionAnalysisResult,
} from '@/app/actions/ai-tags';
import { normalizeTagName } from '@/lib/utils/tag-prompt';

type OrganizerStep = 'idle' | 'analyzing' | 'review' | 'tagging' | 'done';

const BATCH_SIZE = 40;

export function AiTagOrganizer() {
  const [step, setStep] = useState<OrganizerStep>('idle');
  const [stats, setStats] = useState<{
    totalRecipes: number;
    untaggedRecipes: number;
    existingTagsCount: number;
  } | null>(null);
  const [analysis, setAnalysis] = useState<CollectionAnalysisResult | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [targetScope, setTargetScope] = useState<'all' | 'untagged'>('all');
  const [progress, setProgress] = useState<{
    currentBatch: number;
    totalBatches: number;
    processedRecipes: number;
    totalRecipesToProcess: number;
  }>({ currentBatch: 0, totalBatches: 0, processedRecipes: 0, totalRecipesToProcess: 0 });
  const [summary, setSummary] = useState<{
    createdTagsCount: number;
    processedCount: number;
    associationsAdded: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAiTaggingStats().then((res) => {
      if (res.data) setStats(res.data);
    });
  }, []);

  const handleAnalyze = async () => {
    setError(null);
    setStep('analyzing');

    const res = await analyzeCollectionForTags();
    if (res.error || !res.data) {
      setError(res.error ?? "Erreur lors de l'analyse");
      setStep('idle');
      return;
    }

    setAnalysis(res.data);
    const allProposed = res.data.categories.flatMap((c) => c.tags.map((t) => t.name));
    setSelectedTags(allProposed);
    setTargetScope('all');
    setStep('review');
  };

  const toggleProposedTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const handleAddCustomTag = () => {
    const clean = customTagInput.trim();
    if (!clean || !analysis) return;
    const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
    const norm = normalizeTagName(formatted);

    const alreadyExists = analysis.categories.some((c) =>
      c.tags.some((t) => normalizeTagName(t.name) === norm)
    );

    if (!alreadyExists) {
      const updatedCategories = [...analysis.categories];
      const customCatIndex = updatedCategories.findIndex(
        (c) => c.category === 'Tags personnalisés ajoutés'
      );
      if (customCatIndex >= 0) {
        updatedCategories[customCatIndex].tags.push({
          name: formatted,
          isExisting: false,
          estimatedCount: 1,
        });
      } else {
        updatedCategories.push({
          category: 'Tags personnalisés ajoutés',
          tags: [{ name: formatted, isExisting: false, estimatedCount: 1 }],
        });
      }
      setAnalysis({ ...analysis, categories: updatedCategories });
    }

    if (!selectedTags.some((t) => normalizeTagName(t) === norm)) {
      setSelectedTags((prev) => [...prev, formatted]);
    }
    setCustomTagInput('');
  };

  const handleStartAutoTagging = async () => {
    if (!analysis || selectedTags.length === 0) return;
    setError(null);
    setStep('tagging');

    const recipeIds =
      targetScope === 'untagged' ? analysis.untaggedRecipeIds : analysis.allRecipeIds;

    const totalBatches = Math.max(1, Math.ceil(recipeIds.length / BATCH_SIZE));
    setProgress({
      currentBatch: 0,
      totalBatches,
      processedRecipes: 0,
      totalRecipesToProcess: recipeIds.length,
    });

    const prepRes = await prepareApprovedTags(selectedTags);
    if (prepRes.error || !prepRes.data) {
      setError(prepRes.error ?? 'Impossible de préparer les tags');
      setStep('review');
      return;
    }

    const createdTagsCount = prepRes.data.createdCount;
    let totalProcessed = 0;
    let totalAssociationsAdded = 0;

    for (let i = 0; i < recipeIds.length; i += BATCH_SIZE) {
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
      const chunk = recipeIds.slice(i, i + BATCH_SIZE);

      setProgress({
        currentBatch: batchIndex,
        totalBatches,
        processedRecipes: totalProcessed,
        totalRecipesToProcess: recipeIds.length,
      });

      const batchRes = await autoTagRecipesBatch(chunk, selectedTags);
      if (batchRes.error) {
        setError(`Lot ${batchIndex}/${totalBatches} : ${batchRes.error}`);
        break;
      }

      if (batchRes.data) {
        totalProcessed += batchRes.data.processedCount;
        totalAssociationsAdded += batchRes.data.associationsAdded;
      }

      setProgress({
        currentBatch: batchIndex,
        totalBatches,
        processedRecipes: totalProcessed,
        totalRecipesToProcess: recipeIds.length,
      });
    }

    setSummary({
      createdTagsCount,
      processedCount: totalProcessed,
      associationsAdded: totalAssociationsAdded,
    });

    getAiTaggingStats().then((res) => {
      if (res.data) setStats(res.data);
    });

    setStep('done');
  };

  return (
    <div className="glass-panel rounded-3xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-serif font-medium text-[var(--color-text-primary)] flex items-center gap-2">
            <Sparkles size={18} strokeWidth={1.6} className="text-[var(--color-accent)]" />
            <span>Organiser mes recettes par IA</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
            Analyse l&apos;ensemble de vos recettes pour proposer des tags pertinents (protéines, types de plats : soupe, tarte, pâtes, salade, plat mijoté…) et les classer automatiquement.
          </p>
        </div>
      </div>

      {stats && step === 'idle' && (
        <div className="flex flex-wrap gap-2.5 pt-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass-pill text-xs font-medium text-[var(--color-text-secondary)]">
            <BookOpen size={14} strokeWidth={1.6} className="text-[var(--color-accent)]" />
            <span>
              <strong className="text-[var(--color-text-primary)]">{stats.totalRecipes}</strong> recettes
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass-pill text-xs font-medium text-[var(--color-text-secondary)]">
            <TagIcon size={14} strokeWidth={1.6} className="text-[var(--color-accent)]" />
            <span>
              <strong className="text-[var(--color-text-primary)]">{stats.existingTagsCount}</strong> tags existants
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass-pill text-xs font-medium text-[var(--color-text-secondary)]">
            <Search size={14} strokeWidth={1.6} className="text-[var(--color-accent)]" />
            <span>
              <strong className="text-[var(--color-accent)]">{stats.untaggedRecipes}</strong> sans tag
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm text-red-300">
          {error}
        </div>
      )}

      {step === 'idle' && (
        <div className="pt-1">
          <button
            type="button"
            onClick={handleAnalyze}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] font-medium text-xs sm:text-sm transition-colors"
          >
            <Sparkles size={15} strokeWidth={1.7} />
            <span>Analyser mes recettes et proposer des tags</span>
          </button>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
          <ChefHat
            size={28}
            strokeWidth={1.5}
            className="mx-auto text-[var(--color-accent)] animate-bounce"
          />
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Analyse de votre collection en cours…
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            L&apos;IA parcourt vos recettes pour identifier les protéines, types de plats et styles culinaires.
          </p>
        </div>
      )}

      {step === 'review' && analysis && (
        <div className="space-y-5 pt-2 border-t border-[var(--color-border-light)]">
          {analysis.usedLocalFallback && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
              <Info size={15} strokeWidth={1.7} className="shrink-0 mt-0.5 text-amber-300" />
              <span>
                <strong>Mode analyse locale activé :</strong> l&apos;analyse a utilisé automatiquement le moteur culinaire intégré.
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Étape 1 : Validez ou ajustez la liste des tags ({selectedTags.length} sélectionnés)
            </p>
            <div className="flex gap-3 text-xs">
              <button
                type="button"
                onClick={() =>
                  setSelectedTags(analysis.categories.flatMap((c) => c.tags.map((t) => t.name)))
                }
                className="text-[var(--color-accent)] hover:underline font-medium"
              >
                Tout cocher
              </button>
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-[var(--color-text-muted)] hover:underline"
              >
                Tout décocher
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {analysis.categories.map((cat) => (
              <div
                key={cat.category}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  {cat.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cat.tags.map((tag) => {
                    const isChecked = selectedTags.includes(tag.name);
                    return (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => toggleProposedTag(tag.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border inline-flex items-center gap-1.5 ${
                          isChecked
                            ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm'
                            : 'glass-pill text-[var(--color-text-secondary)] opacity-70 hover:opacity-100'
                        }`}
                      >
                        {isChecked ? (
                          <Check size={12} strokeWidth={2.2} />
                        ) : (
                          <Plus size={12} strokeWidth={2} />
                        )}
                        <span>{tag.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            isChecked
                              ? 'bg-white/20 text-white'
                              : 'bg-white/5 text-[var(--color-text-muted)]'
                          }`}
                        >
                          {tag.isExisting ? 'existant' : `~${tag.estimatedCount}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Ajouter un tag personnalisé */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomTag();
                }
              }}
              placeholder="Ajouter un autre tag personnalisé (ex: Airfryer, Batch cooking)..."
              className="flex-1 px-3.5 py-2 text-sm border border-[var(--color-border)] rounded-xl bg-white/5 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
            />
            <button
              type="button"
              onClick={handleAddCustomTag}
              disabled={!customTagInput.trim()}
              className="inline-flex items-center gap-1 px-4 py-2 glass-pill rounded-xl text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent)] disabled:opacity-50 transition-colors"
            >
              <Plus size={13} strokeWidth={2} />
              <span>Ajouter</span>
            </button>
          </div>

          {/* Choix du périmètre */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Étape 2 : Quelles recettes classer ? (les tags déjà présents seront conservés)
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
                <input
                  type="radio"
                  name="targetScope"
                  checked={targetScope === 'all'}
                  onChange={() => setTargetScope('all')}
                  className="accent-[var(--color-accent)]"
                />
                <span>Toutes mes recettes ({analysis.totalRecipes})</span>
              </label>
              {analysis.untaggedRecipes > 0 && (
                <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
                  <input
                    type="radio"
                    name="targetScope"
                    checked={targetScope === 'untagged'}
                    onChange={() => setTargetScope('untagged')}
                    className="accent-[var(--color-accent)]"
                  />
                  <span>
                    Uniquement les recettes sans aucun tag ({analysis.untaggedRecipes})
                  </span>
                </label>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={handleStartAutoTagging}
              disabled={selectedTags.length === 0}
              className="px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 font-medium text-sm transition-colors"
            >
              Classer{' '}
              {targetScope === 'untagged' ? analysis.untaggedRecipes : analysis.totalRecipes}{' '}
              recettes avec ces {selectedTags.length} tags
            </button>
            <button
              type="button"
              onClick={() => setStep('idle')}
              className="px-4 py-2.5 glass-pill text-[var(--color-text-secondary)] rounded-xl hover:text-white text-sm font-medium transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {step === 'tagging' && (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[var(--color-text-primary)]">
              Attribution des tags par l&apos;IA (Lot {progress.currentBatch}/
              {progress.totalBatches})…
            </span>
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              {progress.processedRecipes} / {progress.totalRecipesToProcess} recettes
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-300"
              style={{
                width: `${
                  progress.totalRecipesToProcess > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (progress.processedRecipes / progress.totalRecipesToProcess) * 100
                        )
                      )
                    : 10
                }%`,
              }}
            />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Ne fermez pas cette page pendant le classement de votre collection.
          </p>
        </div>
      )}

      {step === 'done' && summary && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
          <p className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 size={17} strokeWidth={1.8} />
            <span>Classement terminé avec succès</span>
          </p>
          <ul className="text-xs text-[var(--color-text-secondary)] space-y-1">
            <li>
              • <strong className="text-white">{summary.processedCount}</strong> recettes analysées
            </li>
            <li>
              • <strong className="text-white">{summary.createdTagsCount}</strong> nouveaux tags créés
            </li>
            <li>
              • <strong className="text-white">{summary.associationsAdded}</strong> associations ajoutées
            </li>
          </ul>
          <div className="flex gap-3 pt-1">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl text-xs font-semibold hover:bg-[var(--accent-primary-hover)] transition-colors"
            >
              Voir mes recettes filtrées
            </Link>
            <button
              type="button"
              onClick={() => setStep('idle')}
              className="px-4 py-2 glass-pill text-[var(--color-text-secondary)] rounded-xl text-xs font-medium hover:text-white transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

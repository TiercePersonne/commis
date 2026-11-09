'use client';

import { useState, useRef, UIEvent, useEffect } from 'react';
import { Sun, Maximize2, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { IngredientList } from '@/app/components/ingredient-list';
import { RecipeNotes } from '@/app/components/recipe-notes';
import type { Recipe } from '@/lib/schemas/recipe';

interface RecipeTabsProps {
  recipe: Recipe;
  recipeId: string;
}

export function RecipeTabs({ recipe, recipeId }: RecipeTabsProps) {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'prep'>('ingredients');
  const [settledTab, setSettledTab] = useState<'ingredients' | 'prep' | null>('ingredients');
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [focusStepIndex, setFocusStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockSentinelRef = useRef<any>(null);

  const sortedSteps = [...recipe.steps].sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (pillRef.current) {
      pillRef.current.style.transform =
        activeTab === 'ingredients' ? 'translateX(0%)' : 'translateX(100%)';
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
      }
    };
  }, []);

  const toggleWakeLock = async () => {
    if (wakeLockActive) {
      if (wakeLockSentinelRef.current) {
        try {
          await wakeLockSentinelRef.current.release();
        } catch {
          // ignore
        }
        wakeLockSentinelRef.current = null;
      }
      setWakeLockActive(false);
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockSentinelRef.current = sentinel;
        sentinel.addEventListener?.('release', () => {
          setWakeLockActive(false);
        });
      }
      setWakeLockActive(true);
    } catch {
      // Fallback visual toggle if browser blocks WakeLock in non-HTTPS or background tab
      setWakeLockActive((prev) => !prev);
    }
  };

  const toggleStepCompleted = (idx: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const scrollToTab = (tab: 'ingredients' | 'prep') => {
    isProgrammaticScroll.current = true;
    setActiveTab(tab);
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        left: tab === 'ingredients' ? 0 : clientWidth,
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = e.currentTarget;
    if (clientWidth === 0) return;

    const scrollPercent = scrollLeft / clientWidth;

    if (pillRef.current) {
      pillRef.current.style.transform = `translateX(${scrollPercent * 100}%)`;
    }

    const isAtIngredients = scrollLeft === 0;
    const isAtPrep = Math.abs(scrollLeft - clientWidth) < 2;

    if (isAtIngredients) {
      if (settledTab !== 'ingredients') setSettledTab('ingredients');
    } else if (isAtPrep) {
      if (settledTab !== 'prep') setSettledTab('prep');
    } else {
      if (settledTab !== null) setSettledTab(null);
    }

    if (isProgrammaticScroll.current) {
      const targetLeft = activeTab === 'ingredients' ? 0 : clientWidth;
      if (Math.abs(scrollLeft - targetLeft) < 2) {
        isProgrammaticScroll.current = false;
      }
      return;
    }

    if (scrollPercent >= 0.5 && activeTab === 'ingredients') {
      setActiveTab('prep');
    } else if (scrollPercent < 0.5 && activeTab === 'prep') {
      setActiveTab('ingredients');
    }
  };

  const handleUserInteraction = () => {
    isProgrammaticScroll.current = false;
  };

  return (
    <div className="mt-4">
      {/* Barre Mode Cuisine Mains-Libres (Wake Lock + Plein Écran) */}
      <div className="glass-panel rounded-2xl p-3.5 mb-5 flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={toggleWakeLock}
          className="flex items-center gap-3 text-left group"
          aria-pressed={wakeLockActive}
        >
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
              wakeLockActive
                ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'bg-white/5 border-white/10 text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Sun size={17} strokeWidth={1.6} />
          </span>
          <div>
            <span className="block text-xs sm:text-[13px] font-semibold text-[var(--color-text-primary)]">
              Maintien d&apos;écran actif
            </span>
            <span className="block text-[11px] text-[var(--color-text-muted)]">
              {wakeLockActive ? 'Verrouillage en veille désactivé' : 'Empêcher la mise en veille en cuisinant'}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={toggleWakeLock}
            aria-label="Activer le maintien d'écran"
            className={`w-10 h-6 rounded-full p-0.5 transition-colors border ${
              wakeLockActive
                ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                : 'bg-white/10 border-white/15'
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                wakeLockActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>

          {sortedSteps.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setFocusStepIndex(0);
                setFocusModeOpen(true);
                if (!wakeLockActive) {
                  toggleWakeLock();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-pill text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
            >
              <Maximize2 size={13} strokeWidth={1.6} />
              <span>Mode Focus</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Header */}
      <div className="flex glass-panel p-1.5 rounded-2xl mb-6 relative">
        <div
          ref={pillRef}
          className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/50 rounded-xl shadow-sm left-1.5 transition-transform duration-150"
        />

        <button
          onClick={() => scrollToTab('ingredients')}
          className={`relative z-10 flex-1 py-2.5 text-[14px] font-semibold rounded-xl transition-colors ${
            activeTab === 'ingredients'
              ? 'text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Ingrédients ({recipe.ingredients.length})
        </button>
        <button
          onClick={() => scrollToTab('prep')}
          className={`relative z-10 flex-1 py-2.5 text-[14px] font-semibold rounded-xl transition-colors ${
            activeTab === 'prep'
              ? 'text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Préparation ({sortedSteps.length})
        </button>
      </div>

      {/* Swipe Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onTouchStart={handleUserInteraction}
        onWheel={handleUserInteraction}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 no-scrollbar"
      >
        {/* Tab 1: Ingredients */}
        <div
          className={`w-full shrink-0 snap-center pr-2 md:pr-4 ${
            settledTab === 'prep' ? 'h-0 overflow-hidden pointer-events-none' : 'h-auto'
          }`}
          style={{ width: '100%' }}
        >
          <IngredientList ingredients={recipe.ingredients} />
        </div>

        {/* Tab 2: Preparation & Notes */}
        <div
          className={`w-full shrink-0 snap-center pl-2 md:pl-4 ${
            settledTab === 'ingredients' ? 'h-0 overflow-hidden pointer-events-none' : 'h-auto'
          }`}
          style={{ width: '100%' }}
        >
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--color-border)]">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Étapes de préparation
              </h2>
              <span className="text-xs text-[var(--color-text-muted)]">
                 Touchez une étape pour la marquer comme faite
              </span>
            </div>

            <ol className="space-y-3">
              {sortedSteps.map((step, index) => {
                const isDone = completedSteps.has(index);
                const formattedNum = String(index + 1).padStart(2, '0');
                return (
                  <li
                    key={index}
                    onClick={() => toggleStepCompleted(index)}
                    className={`glass-panel rounded-2xl p-4 sm:p-5 flex gap-4 items-start cursor-pointer transition-all ${
                      isDone
                        ? 'opacity-50 border-white/5'
                        : 'hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <span
                      className={`font-serif italic text-xl leading-none pt-0.5 shrink-0 min-w-[28px] ${
                        isDone ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-accent)]'
                      }`}
                    >
                      {formattedNum}
                    </span>
                    <p
                      className={`flex-1 text-[14.5px] sm:text-[15.5px] leading-relaxed ${
                        isDone
                          ? 'line-through text-[var(--color-text-muted)]'
                          : 'text-[var(--color-text-primary)]'
                      }`}
                    >
                      {step.text}
                    </p>
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isDone
                          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                          : 'border-white/20 text-transparent'
                      }`}
                    >
                      <Check size={11} strokeWidth={2.5} />
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <RecipeNotes recipeId={recipeId} initialNotes={recipe.notes || ''} />
        </div>
      </div>

      {/* Mode Focus Plein Écran */}
      {focusModeOpen && sortedSteps.length > 0 && (
        <div className="fixed inset-0 z-50 bg-[#130f0d]/95 backdrop-blur-2xl flex flex-col justify-between p-6 md:p-12">
          <div className="max-w-2xl w-full mx-auto flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-[var(--color-accent)] font-semibold">
                Mode Cuisine Focus
              </span>
              <h3 className="font-serif text-lg text-[var(--color-text-primary)] line-clamp-1">
                {recipe.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setFocusModeOpen(false)}
              className="w-10 h-10 rounded-full glass-pill flex items-center justify-center text-[var(--color-text-secondary)] hover:text-white"
              aria-label="Fermer le mode focus"
            >
              <X size={18} strokeWidth={1.6} />
            </button>
          </div>

          <div className="max-w-2xl w-full mx-auto my-auto py-8">
            <div className="glass-panel rounded-3xl p-6 sm:p-10 space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-serif italic text-4xl text-[var(--color-accent)]">
                  {String(focusStepIndex + 1).padStart(2, '0')}{' '}
                  <span className="text-lg text-[var(--color-text-muted)] not-italic font-sans">
                    / {String(sortedSteps.length).padStart(2, '0')}
                  </span>
                </span>
              </div>
              <p className="text-lg sm:text-2xl leading-relaxed text-[var(--color-text-primary)] font-normal">
                {sortedSteps[focusStepIndex]?.text}
              </p>
            </div>
          </div>

          <div className="max-w-2xl w-full mx-auto flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setFocusStepIndex((i) => Math.max(0, i - 1))}
              disabled={focusStepIndex === 0}
              className="flex-1 py-4 rounded-2xl glass-pill inline-flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-text-primary)] disabled:opacity-30"
            >
              <ChevronLeft size={18} strokeWidth={1.6} />
              <span>Précédent</span>
            </button>
            {focusStepIndex < sortedSteps.length - 1 ? (
              <button
                type="button"
                onClick={() => setFocusStepIndex((i) => Math.min(sortedSteps.length - 1, i + 1))}
                className="flex-1 py-4 rounded-2xl bg-[var(--color-accent)] text-white inline-flex items-center justify-center gap-2 text-sm font-semibold shadow-lg"
              >
                <span>Étape suivante</span>
                <ChevronRight size={18} strokeWidth={1.8} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setFocusModeOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white inline-flex items-center justify-center gap-2 text-sm font-semibold shadow-lg"
              >
                <Check size={18} strokeWidth={2} />
                <span>Terminer</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Info, ShoppingBag, Check, Copy, RotateCcw } from 'lucide-react';
import type { MealPlanWithRecipe } from '@/lib/schemas/meal-plan';
import { aggregateIngredientsListWithRecipes } from '@/lib/utils/ingredients';

interface PlannerShoppingListProps {
  mealPlans: MealPlanWithRecipe[];
  weekStart?: string;
  isStandalone?: boolean;
}

export function PlannerShoppingList({
  mealPlans,
  weekStart = 'default',
  isStandalone = false,
}: PlannerShoppingListProps) {
  const [copying, setCopying] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const storageKey = `commis_checked_groceries_${weekStart}`;

  const aggregatedList = useMemo(() => {
    const ingredientsWithSource = mealPlans.flatMap((plan) =>
      plan.recipe.ingredients
        ? plan.recipe.ingredients.map((ing) => ({
            text: ing.text,
            recipeTitle: plan.recipe.title,
          }))
        : []
    );
    return aggregateIngredientsListWithRecipes(ingredientsWithSource);
  }, [mealPlans]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        setCheckedItems(new Set(parsed));
      } else {
        setCheckedItems(new Set());
      }
    } catch {
      setCheckedItems(new Set());
    }
  }, [storageKey]);

  if (aggregatedList.length === 0) {
    return null;
  }

  const persistChecked = (nextSet: Set<string>) => {
    setCheckedItems(nextSet);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(nextSet)));
      } catch {
        // ignore storage quota errors
      }
    }
  };

  const toggleItemChecked = (text: string) => {
    const next = new Set(checkedItems);
    if (next.has(text)) {
      next.delete(text);
    } else {
      next.add(text);
    }
    persistChecked(next);
  };

  const resetChecked = () => {
    persistChecked(new Set());
  };

  // Unchecked items are what still needs to be bought; sort unchecked first, checked at bottom
  const sortedItems = [...aggregatedList].sort((a, b) => {
    const aChecked = checkedItems.has(a.text) ? 1 : 0;
    const bChecked = checkedItems.has(b.text) ? 1 : 0;
    return aChecked - bChecked;
  });

  const remainingToBuy = aggregatedList.filter((item) => !checkedItems.has(item.text));
  const remainingCount = remainingToBuy.length;

  const handleCopy = async () => {
    const listToCopy = remainingCount > 0 ? remainingToBuy : aggregatedList;
    if (listToCopy.length === 0) return;

    setCopying(true);
    const texts = listToCopy.map((item) => item.text).join('\n');

    try {
      await navigator.clipboard.writeText(texts);
      setTimeout(() => setCopying(false), 2000);
    } catch {
      setCopying(false);
    }
  };

  return (
    <div className={`${isStandalone ? 'mt-2' : 'mt-10'} mb-8 animate-in fade-in duration-300`}>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-3 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-base sm:text-lg font-serif font-medium text-[var(--color-text-primary)] flex items-center gap-2">
            <ShoppingBag size={18} strokeWidth={1.6} className="text-[var(--color-accent)]" />
            <span>Liste de courses</span>
            <span className="text-xs font-sans font-normal text-[var(--color-text-muted)]">
              ({remainingCount} à acheter sur {aggregatedList.length})
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {checkedItems.size > 0 && (
            <button
              type="button"
              onClick={resetChecked}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-pill text-xs font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors"
            >
              <RotateCcw size={13} strokeWidth={1.6} />
              <span>Tout décocher</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={copying}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-accent)]/60 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[12.5px] font-semibold hover:bg-[var(--color-accent)] hover:text-white disabled:opacity-50 transition-all"
          >
            {copying ? (
              <>
                <Check size={14} strokeWidth={2} />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy size={14} strokeWidth={1.6} />
                <span>Copier ({remainingCount > 0 ? remainingCount : aggregatedList.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {sortedItems.map((ingredient) => {
          const isCheckedInCart = checkedItems.has(ingredient.text);
          const isExpanded = expandedKey === ingredient.text;

          return (
            <div key={ingredient.text} className="relative group">
              <div
                onClick={() => toggleItemChecked(ingredient.text)}
                className={`flex items-center gap-3 cursor-pointer p-3.5 rounded-2xl glass-panel transition-all w-full select-none ${
                  isCheckedInCart
                    ? 'opacity-45 border-white/5'
                    : 'hover:border-[var(--color-border-hover)]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                    !isCheckedInCart
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                      : 'border-white/25 bg-white/5 text-white/60'
                  }`}
                >
                  <Check size={11} strokeWidth={2.5} />
                </div>

                <span
                  className={`flex-1 text-[14px] transition-all font-medium truncate pr-2 ${
                    !isCheckedInCart
                      ? 'text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-muted)] line-through'
                  }`}
                >
                  {ingredient.text}
                </span>

                <button
                  type="button"
                  aria-label="Voir les recettes associées"
                  className="p-1.5 -m-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors rounded-full hover:bg-white/10 ml-auto flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedKey(isExpanded ? null : ingredient.text);
                  }}
                >
                  <Info size={14} strokeWidth={1.6} />
                </button>
              </div>

              {/* Tooltip for desktop */}
              <div className="hidden md:block absolute left-1/2 bottom-full -translate-x-1/2 mb-1.5 w-max max-w-[240px] glass-dock text-[var(--color-text-primary)] text-[11px] font-medium py-2.5 px-3.5 rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                <div className="text-[var(--color-accent)] text-[10px] uppercase tracking-wider mb-1 font-semibold">
                  Recettes associées
                </div>
                <ul className="list-disc pl-3 text-left space-y-0.5">
                  {ingredient.recipeTitles.map((title, i) => (
                    <li key={i} className="truncate">
                      {title}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dropdown for mobile */}
              {isExpanded && (
                <div className="md:hidden mt-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[12px] text-[var(--color-text-secondary)]">
                  <div className="font-semibold mb-1 text-[var(--color-accent)]">
                    Recettes associées :
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {ingredient.recipeTitles.map((title, i) => (
                      <li key={i}>{title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

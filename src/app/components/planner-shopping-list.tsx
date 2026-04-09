'use client';

import { useState, useMemo, useEffect } from 'react';
import type { MealPlanWithRecipe } from '@/lib/schemas/meal-plan';
import { aggregateIngredientsList } from '@/lib/utils/ingredients';
import { Clipboard, Check } from 'lucide-react';

interface PlannerShoppingListProps {
  mealPlans: MealPlanWithRecipe[];
}

export function PlannerShoppingList({ mealPlans }: PlannerShoppingListProps) {
  const [copying, setCopying] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(new Set());

  // Derive the list of aggregated ingredients
  const aggregatedList = useMemo(() => {
    const allIngredientsStr = mealPlans.flatMap(plan => 
      plan.recipe.ingredients ? plan.recipe.ingredients.map(ing => ing.text) : []
    );
    return aggregateIngredientsList(allIngredientsStr);
  }, [mealPlans]);

  // Select all by default when list changes
  useEffect(() => {
    setSelectedIngredients(new Set(aggregatedList.map((_, i) => i)));
  }, [aggregatedList]);

  if (aggregatedList.length === 0) {
    return null;
  }

  const toggleIngredient = (index: number) => {
    setSelectedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleCopy = async () => {
    if (selectedIngredients.size === 0) return;
    
    setCopying(true);

    const selectedTexts = aggregatedList
      .filter((_, index) => selectedIngredients.has(index))
      .join('\n');

    try {
      await navigator.clipboard.writeText(selectedTexts);
      setTimeout(() => setCopying(false), 2000);
    } catch {
      alert('Erreur lors de la copie dans le presse-papier');
      setCopying(false);
    }
  };

  const selectedCount = selectedIngredients.size;

  return (
    <div className="mt-10 mb-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--color-border)]">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <span>🛒</span> Liste de courses
        </h2>
        
        <button
          onClick={handleCopy}
          disabled={selectedCount === 0 || copying}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-accent)] bg-transparent text-[var(--color-accent)] text-[13px] font-semibold hover:bg-[var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {copying ? '✓ Copié !' : `Copier (${selectedCount})`}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1">
        {aggregatedList.map((ingredient, index) => {
          const isSelected = selectedIngredients.has(index);
          return (
            <label key={index} className="flex items-center gap-3 cursor-pointer py-1.5 px-2 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors group">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                    : 'border-[var(--color-border)] group-hover:border-[var(--color-accent)]'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  toggleIngredient(index);
                }}
              >
                {isSelected && <span className="text-xs font-bold leading-none">✓</span>}
              </div>
              <span
                className={`flex-1 text-[15px] transition-all font-medium select-none ${
                  isSelected
                    ? 'text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-muted)] line-through'
                }`}
              >
                {ingredient}
              </span>
            </label>
          );
        })}
      </div>

      {selectedCount === 0 && (
        <p className="text-[14px] text-[var(--color-text-secondary)] mt-8 text-center italic opacity-80">
          Sélectionnez au moins un ingrédient pour l'ajouter à votre presse-papiers
        </p>
      )}
    </div>
  );
}

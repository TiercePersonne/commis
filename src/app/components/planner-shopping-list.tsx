'use client';

import { useState, useMemo, useEffect } from 'react';
import type { MealPlanWithRecipe } from '@/lib/schemas/meal-plan';
import { aggregateIngredientsListWithRecipes } from '@/lib/utils/ingredients';
import { Info } from 'lucide-react';

interface PlannerShoppingListProps {
  mealPlans: MealPlanWithRecipe[];
}

export function PlannerShoppingList({ mealPlans }: PlannerShoppingListProps) {
  const [copying, setCopying] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(new Set());
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const aggregatedList = useMemo(() => {
    const ingredientsWithSource = mealPlans.flatMap(plan => 
      plan.recipe.ingredients 
        ? plan.recipe.ingredients.map(ing => ({ text: ing.text, recipeTitle: plan.recipe.title })) 
        : []
    );
    return aggregateIngredientsListWithRecipes(ingredientsWithSource);
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
      .map(item => item.text)
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
            <div key={index} className="relative group">
              <label className="flex items-center gap-3 cursor-pointer py-1.5 px-2 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors w-full group/label">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                      : 'border-[var(--color-border)] group-hover/label:border-[var(--color-accent)]'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleIngredient(index);
                  }}
                >
                  {isSelected && <span className="text-xs font-bold leading-none">✓</span>}
                </div>
                <span
                  className={`flex-1 text-[15px] transition-all font-medium select-none truncate pr-2 ${
                    isSelected
                      ? 'text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-muted)] line-through'
                  }`}
                >
                  {ingredient.text}
                </span>

                <div 
                  className="p-1.5 -m-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors rounded-full hover:bg-[var(--color-bg-primary)] cursor-pointer md:cursor-default ml-auto flex-shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    setExpandedIndex(expandedIndex === index ? null : index);
                  }}
                >
                  <Info size={14} className="opacity-60" />
                </div>
              </label>

              {/* Tooltip for desktop */}
              <div className="hidden md:block absolute left-1/2 bottom-full -translate-x-1/2 mb-1 w-max max-w-[220px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-[11px] font-medium py-2 px-3 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                <div className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1 font-semibold">Recettes associées</div>
                <ul className="list-disc pl-3 text-left">
                  {ingredient.recipeTitles.map((title, i) => (
                    <li key={i} className="py-0.5 truncate">{title}</li>
                  ))}
                </ul>
              </div>

              {/* Dropdown for mobile */}
              {expandedIndex === index && (
                <div className="md:hidden mt-1 px-10 pb-3 text-[12.5px] text-[var(--color-text-secondary)] animate-in slide-in-from-top-1 fade-in duration-200">
                  <div className="font-semibold mb-1 text-[var(--color-text-primary)]">Recettes associées :</div>
                  <ul className="list-disc pl-3 space-y-0.5">
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

      {selectedCount === 0 && (
        <p className="text-[14px] text-[var(--color-text-secondary)] mt-8 text-center italic opacity-80">
          Sélectionnez au moins un ingrédient pour l&apos;ajouter à votre presse-papiers
        </p>
      )}
    </div>
  );
}

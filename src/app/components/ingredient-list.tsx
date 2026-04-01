'use client';

import { useState } from 'react';
import type { RecipeItem } from '@/lib/schemas/recipe';

type IngredientListProps = {
  ingredients: RecipeItem[];
};

export function IngredientList({ ingredients }: IngredientListProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(
    new Set(ingredients.map((_, index) => index))
  );
  const [copying, setCopying] = useState(false);

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
    setCopying(true);

    const selectedTexts = ingredients
      .filter((_, index) => selectedIngredients.has(index))
      .sort((a, b) => a.order - b.order)
      .map(ingredient => ingredient.text)
      .join('\n');

    try {
      await navigator.clipboard.writeText(selectedTexts);
      
      setTimeout(() => {
        setCopying(false);
      }, 2000);
    } catch {
      alert('Erreur lors de la copie dans le presse-papier');
      setCopying(false);
    }
  };

  const sortedIngredients = [...ingredients].sort((a, b) => a.order - b.order);
  const selectedCount = selectedIngredients.size;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--color-border)]">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          Ingrédients
        </h2>
        <button
          onClick={handleCopy}
          disabled={selectedCount === 0 || copying}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-accent)] bg-transparent text-[var(--color-accent)] text-[13px] font-semibold hover:bg-[var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Copier les ingrédients sélectionnés"
        >
          {copying ? '✓ Copié !' : `Copier (${selectedCount})`}
        </button>
      </div>

      <ul className="space-y-0">
        {sortedIngredients.map((ingredient, index) => {
          const isSelected = selectedIngredients.has(index);
          
          return (
            <li key={index} className="py-2.5 border-b border-[#F0E8DE]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                      : 'border-[var(--color-border)]'
                  }`}
                  onClick={() => toggleIngredient(index)}
                >
                  {isSelected && <span className="text-xs">✓</span>}
                </div>
                <span
                  className={`flex-1 text-[15px] transition-all ${
                    isSelected
                      ? 'text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-muted)] line-through'
                  }`}
                >
                  {ingredient.text}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {selectedCount === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)] mt-4 text-center">
          Sélectionnez au moins un ingrédient pour copier
        </p>
      )}
    </div>
  );
}

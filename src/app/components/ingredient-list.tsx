'use client';

import { useState } from 'react';
import { Check, Copy, Minus, Plus } from 'lucide-react';
import type { RecipeItem } from '@/lib/schemas/recipe';

type IngredientListProps = {
  ingredients: RecipeItem[];
};

const BASE_SERVINGS = 2;

function scaleIngredientText(text: string, servings: number): string {
  if (servings === BASE_SERVINGS) return text;
  const ratio = servings / BASE_SERVINGS;

  return text.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
    const normalized = match.replace(',', '.');
    const num = parseFloat(normalized);
    if (isNaN(num)) return match;
    const scaled = num * ratio;
    const rounded = Math.round(scaled * 10) / 10;
    return String(rounded).replace('.', ',');
  });
}

export function IngredientList({ ingredients }: IngredientListProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(
    new Set(ingredients.map((_, index) => index))
  );
  const [servings, setServings] = useState<number>(BASE_SERVINGS);
  const [copying, setCopying] = useState(false);

  const toggleIngredient = (index: number) => {
    setSelectedIngredients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const sortedIngredients = [...ingredients].sort((a, b) => a.order - b.order);
  const selectedCount = selectedIngredients.size;

  const handleCopy = async () => {
    setCopying(true);

    const selectedTexts = sortedIngredients
      .filter((_, index) => selectedIngredients.has(index))
      .map((ingredient) => scaleIngredientText(ingredient.text, servings))
      .join('\n');

    try {
      await navigator.clipboard.writeText(selectedTexts);
      setTimeout(() => {
        setCopying(false);
      }, 2000);
    } catch {
      setCopying(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Ingrédients
          </h2>
          {/* Ajusteur de portions */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full glass-pill text-xs">
            <button
              type="button"
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              aria-label="Diminuer les portions"
              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition-colors"
            >
              <Minus size={12} strokeWidth={2} />
            </button>
            <span className="font-medium text-[var(--color-text-primary)] min-w-[54px] text-center">
              {servings} pers.
            </span>
            <button
              type="button"
              onClick={() => setServings((s) => Math.min(20, s + 1))}
              aria-label="Augmenter les portions"
              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition-colors"
            >
              <Plus size={12} strokeWidth={2} />
            </button>
          </div>
        </div>

        <button
          onClick={handleCopy}
          disabled={selectedCount === 0 || copying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-accent)]/60 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[12.5px] font-semibold hover:bg-[var(--color-accent)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Copier les ingrédients sélectionnés"
        >
          {copying ? (
            <>
              <Check size={14} strokeWidth={2} />
              <span>Copié</span>
            </>
          ) : (
            <>
              <Copy size={14} strokeWidth={1.6} />
              <span>Copier ({selectedCount})</span>
            </>
          )}
        </button>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {sortedIngredients.map((ingredient, index) => {
          const isSelected = selectedIngredients.has(index);
          const scaledText = scaleIngredientText(ingredient.text, servings);

          return (
            <li key={index}>
              <label
                onClick={() => toggleIngredient(index)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl glass-panel cursor-pointer transition-all select-none ${
                  isSelected
                    ? 'hover:border-[var(--color-border-hover)]'
                    : 'opacity-50 border-white/5'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                      : 'border-white/25'
                  }`}
                >
                  {isSelected && <Check size={11} strokeWidth={2.5} />}
                </div>
                <span
                  className={`flex-1 text-[14px] leading-snug transition-all ${
                    isSelected
                      ? 'text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-muted)] line-through'
                  }`}
                >
                  {scaledText}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {selectedCount === 0 && (
        <p className="text-xs text-[var(--color-text-muted)] mt-4 text-center">
          Sélectionnez au moins un ingrédient pour copier
        </p>
      )}
    </div>
  );
}

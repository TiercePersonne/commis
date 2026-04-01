'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserRecipes } from '@/app/actions/recipes';
import { addToSlot } from '@/app/actions/meal-plans';
import type { Recipe } from '@/lib/schemas/recipe';

type RecipePickerDialogProps = {
  weekStart: string;
  day: number;
  mealType: 'lunch' | 'dinner';
  onClose: () => void;
  onSuccess: () => void;
};

export function RecipePickerDialog({
  weekStart,
  day,
  mealType,
  onClose,
  onSuccess,
}: RecipePickerDialogProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const stableOnClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stableOnClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [stableOnClose]);

  useEffect(() => {
    const loadRecipes = async () => {
      setLoading(true);
      setError(null);

      const result = await getUserRecipes(100);

      if (result.error) {
        setError(result.error);
      } else {
        setRecipes(result.recipes || []);
      }

      setLoading(false);
    };

    loadRecipes();
  }, []);

  const handleAddRecipe = async (recipeId: string) => {
    setAdding(recipeId);

    const result = await addToSlot(recipeId, weekStart, day, mealType);

    if (result.error) {
      alert(result.error);
      setAdding(null);
    } else {
      onSuccess();
      onClose();
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const mealLabel = mealType === 'lunch' ? 'Déjeuner' : 'Dîner';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--color-bg-card)] rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-[var(--color-border-light)] shadow-[0_8px_24px_rgba(44,24,16,0.10)]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-serif text-[var(--color-text-primary)] mb-2">
            Choisir une recette
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {mealLabel} - {DAYS[day]}
          </p>
        </div>

        <div className="p-6 border-b border-[var(--color-border)]">
          <input
            type="text"
            placeholder="Rechercher une recette..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(196,112,75,0.12)]"
            aria-label="Rechercher une recette"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              {searchQuery ? 'Aucune recette trouvée' : 'Aucune recette disponible'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleAddRecipe(recipe.id)}
                  disabled={adding === recipe.id}
                  className="w-full text-left p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
                    {recipe.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {recipe.ingredients.length} ingrédient{recipe.ingredients.length > 1 ? 's' : ''} · {recipe.steps.length} étape{recipe.steps.length > 1 ? 's' : ''}
                  </p>
                  {adding === recipe.id && (
                    <p className="text-sm text-[var(--color-accent)] mt-2">Ajout en cours...</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

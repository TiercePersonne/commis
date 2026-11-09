'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
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
      setError(result.error);
      setAdding(null);
    } else {
      onSuccess();
      onClose();
    }
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const mealLabel = mealType === 'lunch' ? 'Déjeuner' : 'Dîner';

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="glass-dock rounded-3xl max-w-2xl w-full max-h-[82vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--color-border)] flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif text-[var(--color-text-primary)] mb-1">
              Choisir une recette
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-accent)] font-medium">
              {mealLabel} · {DAYS[day]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-[var(--color-text-secondary)] hover:text-white"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className="p-5 border-b border-[var(--color-border)]">
          <div className="relative flex items-center">
            <Search
              size={16}
              strokeWidth={1.6}
              className="absolute left-3.5 text-[var(--color-text-muted)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Rechercher une recette..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
              aria-label="Rechercher une recette"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400 text-sm">{error}</div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)] text-sm">
              {searchQuery ? 'Aucune recette trouvée' : 'Aucune recette disponible'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleAddRecipe(recipe.id)}
                  disabled={adding === recipe.id}
                  className="w-full text-left p-4 rounded-2xl glass-panel hover:border-[var(--color-accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <h3 className="font-serif font-medium text-[var(--color-text-primary)] mb-1">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {recipe.ingredients.length} ingrédient
                    {recipe.ingredients.length > 1 ? 's' : ''} · {recipe.steps.length} étape
                    {recipe.steps.length > 1 ? 's' : ''}
                  </p>
                  {adding === recipe.id && (
                    <p className="text-xs text-[var(--color-accent)] mt-2">Ajout en cours...</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 glass-pill text-[var(--color-text-primary)] rounded-2xl hover:bg-white/10 transition-colors text-sm font-medium"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
import { createRecipe } from '@/app/actions/recipes';
import { TagSelector } from '@/app/components/tag-selector';
import { AppLayout } from '@/app/components/app-layout';
import type { RecipeItem } from '@/lib/schemas/recipe';

export default function NewRecipePage() {
  const [state, formAction, isPending] = useActionState(createRecipe, null);
  const [ingredients, setIngredients] = useState<RecipeItem[]>([{ text: '', order: 0 }]);
  const [steps, setSteps] = useState<RecipeItem[]>([{ text: '', order: 0 }]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const addIngredient = () => {
    setIngredients([...ingredients, { text: '', order: ingredients.length }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, text: string) => {
    const updated = [...ingredients];
    updated[index] = { text, order: index };
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, { text: '', order: steps.length }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, text: string) => {
    const updated = [...steps];
    updated[index] = { text, order: index };
    setSteps(updated);
  };

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 md:px-10 pb-12">
        <div className="max-w-2xl mx-auto pt-6 md:pt-8">
          <h1 className="text-3xl md:text-4xl font-serif text-[var(--color-text-primary)] mb-8">
            Nouvelle Recette
          </h1>

          <form action={formAction} className="space-y-8">
            <div>
              <label htmlFor="title" className="block text-base font-medium text-[var(--color-text-primary)] mb-2">
                Titre
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full px-4 py-3 rounded-xl glass-panel text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                disabled={isPending}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-base font-medium text-[var(--color-text-primary)]">
                  Ingrédients
                </label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="inline-flex items-center gap-1.5 justify-center px-3.5 py-2 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 transition-colors text-xs font-medium"
                  disabled={isPending}
                >
                  <Plus size={14} strokeWidth={2} />
                  <span>Ajouter</span>
                </button>
              </div>
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient.text}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      placeholder={`Ingrédient ${index + 1}`}
                      className="flex-1 px-4 py-3 rounded-xl glass-panel text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
                      disabled={isPending}
                    />
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="inline-flex items-center justify-center px-3.5 py-2.5 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                        disabled={isPending}
                        aria-label="Supprimer cet ingrédient"
                      >
                        <X size={16} strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <input type="hidden" name="ingredients" value={JSON.stringify(ingredients)} />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-base font-medium text-[var(--color-text-primary)]">
                  Étapes
                </label>
                <button
                  type="button"
                  onClick={addStep}
                  className="inline-flex items-center gap-1.5 justify-center px-3.5 py-2 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 transition-colors text-xs font-medium"
                  disabled={isPending}
                >
                  <Plus size={14} strokeWidth={2} />
                  <span>Ajouter</span>
                </button>
              </div>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex items-center justify-center w-8 h-10 font-serif italic text-[var(--color-accent)] font-medium">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <textarea
                      value={step.text}
                      onChange={(e) => updateStep(index, e.target.value)}
                      placeholder={`Étape ${index + 1}`}
                      rows={2}
                      className="flex-1 px-4 py-3 rounded-xl glass-panel text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                      disabled={isPending}
                    />
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="inline-flex items-center justify-center px-3.5 py-2.5 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                        disabled={isPending}
                        aria-label="Supprimer cette étape"
                      >
                        <X size={16} strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <input type="hidden" name="steps" value={JSON.stringify(steps)} />
            </div>

            <div>
              <label className="block text-base font-medium text-[var(--color-text-primary)] mb-4">
                Tags
              </label>
              <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} />
              <input type="hidden" name="tags" value={JSON.stringify(selectedTags)} />
            </div>

            {state?.error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                {state.error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-6 py-3 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 font-medium transition-colors"
              >
                {isPending ? 'Création...' : 'Créer la recette'}
              </button>
              <Link
                href="/"
                className="px-6 py-3 glass-pill text-[var(--color-text-primary)] rounded-xl hover:bg-white/10 font-medium text-center transition-colors"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

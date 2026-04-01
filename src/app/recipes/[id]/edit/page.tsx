'use client';

import { useActionState, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { updateRecipe } from '@/app/actions/recipes';
import { getRecipeTags } from '@/app/actions/tags';
import { TagSelector } from '@/app/components/tag-selector';
import { AppLayout } from '@/app/components/app-layout';
import type { RecipeItem, Recipe } from '@/lib/schemas/recipe';

export default function EditRecipePage({ 
  searchParams 
}: { 
  searchParams: Promise<{ recipe?: string }> 
}) {
  const params = useParams();
  const id = params.id as string;
  const [state, formAction, isPending] = useActionState(updateRecipe, null);
  const [ingredients, setIngredients] = useState<RecipeItem[]>([{ text: '', order: 0 }]);
  const [steps, setSteps] = useState<RecipeItem[]>([{ text: '', order: 0 }]);
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecipe = async () => {
      const params = await searchParams;
      if (params.recipe) {
        try {
          const recipe: Recipe = JSON.parse(decodeURIComponent(params.recipe));
          setTitle(recipe.title);
          setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ text: '', order: 0 }]);
          setSteps(recipe.steps.length > 0 ? recipe.steps : [{ text: '', order: 0 }]);
          
          const { tags } = await getRecipeTags(id);
          if (tags) {
            setSelectedTags(tags.map(t => t.id));
          }
        } catch (error) {
          console.error('Failed to parse recipe:', error);
        }
      }
      setIsLoading(false);
    };
    loadRecipe();
  }, [searchParams, id]);

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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-10 pb-10">
          <div className="max-w-2xl mx-auto pt-8">
            <p className="text-[var(--color-text-secondary)]">Chargement...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-10 pb-10">
        <div className="max-w-2xl mx-auto pt-8">
          <h1 className="text-4xl font-serif text-[var(--color-text-primary)] mb-8">
            Modifier la Recette
          </h1>

          <form action={formAction} className="space-y-8">
          <input type="hidden" name="id" value={id} />

          <div>
            <label htmlFor="title" className="block text-lg font-medium text-[var(--color-text-primary)] mb-2">
              Titre
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(196,112,75,0.12)]"
              disabled={isPending}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-lg font-medium text-[var(--color-text-primary)]">
                Ingrédients
              </label>
              <button
                type="button"
                onClick={addIngredient}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 transition-colors text-sm font-medium"
                disabled={isPending}
              >
                + Ajouter
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
                    className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(196,112,75,0.12)]"
                    disabled={isPending}
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="inline-flex items-center justify-center px-4 py-2.5 bg-[#ba2d2d] text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                      disabled={isPending}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <input type="hidden" name="ingredients" value={JSON.stringify(ingredients)} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-lg font-medium text-[var(--color-text-primary)]">
                Étapes
              </label>
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 transition-colors text-sm font-medium"
                disabled={isPending}
              >
                + Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <span className="flex items-center justify-center w-8 h-10 text-[var(--color-text-secondary)] font-medium">
                    {index + 1}.
                  </span>
                  <textarea
                    value={step.text}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`Étape ${index + 1}`}
                    rows={2}
                    className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(196,112,75,0.12)] resize-none"
                    disabled={isPending}
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="inline-flex items-center justify-center px-4 py-2.5 bg-[#ba2d2d] text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                      disabled={isPending}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <input type="hidden" name="steps" value={JSON.stringify(steps)} />
          </div>

          <div>
            <label className="block text-lg font-medium text-[var(--color-text-primary)] mb-4">
              Tags
            </label>
            <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} />
            <input type="hidden" name="tags" value={JSON.stringify(selectedTags)} />
          </div>

          {state?.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {state.error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-6 py-3 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 font-medium transition-colors"
            >
              {isPending ? 'Modification...' : 'Enregistrer les modifications'}
            </button>
            <Link
              href={`/recipes/${id}`}
              className="px-6 py-3 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-secondary)] font-medium text-center transition-colors"
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

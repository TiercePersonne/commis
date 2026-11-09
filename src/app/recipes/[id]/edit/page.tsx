'use client';

import { useActionState, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, Sparkles, X } from 'lucide-react';
import { updateRecipe, getRecipe, repairRecipeImage } from '@/app/actions/recipes';
import { getRecipeTags } from '@/app/actions/tags';
import { suggestTagsForRecipe } from '@/app/actions/ai-tags';
import { TagSelector } from '@/app/components/tag-selector';
import { AppLayout } from '@/app/components/app-layout';
import type { RecipeItem, Recipe } from '@/lib/schemas/recipe';

export default function EditRecipePage({
  searchParams,
}: {
  searchParams: Promise<{ recipe?: string }>;
}) {
  const params = useParams();
  const id = params.id as string;
  const [state, formAction, isPending] = useActionState(updateRecipe, null);
  const [ingredients, setIngredients] = useState<RecipeItem[]>([{ text: '', order: 0 }]);
  const [steps, setSteps] = useState<RecipeItem[]>([{ text: '', order: 0 }]);
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestedTagNames, setSuggestedTagNames] = useState<string[]>([]);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecipe = async () => {
      const sp = await searchParams;
      let loadedRecipe: Recipe | null = null;

      if (sp.recipe) {
        try {
          loadedRecipe = JSON.parse(decodeURIComponent(sp.recipe));
        } catch (error) {
          console.error('Failed to parse recipe from query:', error);
        }
      }

      if (!loadedRecipe && id) {
        const res = await getRecipe(id);
        if (res.recipe) {
          loadedRecipe = res.recipe;
        }
      }

      if (loadedRecipe) {
        setTitle(loadedRecipe.title);
        setIngredients(
          loadedRecipe.ingredients.length > 0
            ? loadedRecipe.ingredients
            : [{ text: '', order: 0 }]
        );
        setSteps(
          loadedRecipe.steps.length > 0 ? loadedRecipe.steps : [{ text: '', order: 0 }]
        );
        setImageUrl(loadedRecipe.image_url ?? '');

        const { tags } = await getRecipeTags(id);
        if (tags) {
          setSelectedTags(tags.map((t) => t.id));
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
        <div className="px-4 sm:px-6 md:px-10 pb-10">
          <div className="max-w-2xl mx-auto pt-8">
            <p className="text-[var(--color-text-secondary)]">Chargement...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 md:px-10 pb-12">
        <div className="max-w-2xl mx-auto pt-6 md:pt-8">
          <h1 className="text-3xl md:text-4xl font-serif text-[var(--color-text-primary)] mb-8">
            Modifier la Recette
          </h1>

          <form action={formAction} className="space-y-8">
            <input type="hidden" name="id" value={id} />

            <div>
              <label htmlFor="title" className="block text-base font-medium text-[var(--color-text-primary)] mb-2">
                Titre
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
              <label htmlFor="image_url" className="block text-base font-medium text-[var(--color-text-primary)] mb-2">
                Image
              </label>
              <input
                type="url"
                id="image_url"
                name="image_url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl glass-panel text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
                disabled={isPending}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isPending || isGeneratingImage}
                  onClick={async () => {
                    setIsGeneratingImage(true);
                    setImageError(null);
                    const res = await repairRecipeImage(id, 'generate');
                    if (res.imageUrl) {
                      setImageUrl(res.imageUrl);
                    } else {
                      setImageError(res.error ?? 'Génération impossible');
                    }
                    setIsGeneratingImage(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold glass-pill text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50 transition-colors"
                >
                  <Sparkles size={13} strokeWidth={1.7} />
                  <span>{isGeneratingImage ? 'Génération en cours…' : 'Générer une photo du plat par IA'}</span>
                </button>
                {imageError && <span className="text-xs text-red-400">{imageError}</span>}
              </div>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Aperçu"
                  className="mt-3 w-full h-40 object-cover rounded-xl border border-[var(--color-border)]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <label className="block text-base font-medium text-[var(--color-text-primary)]">
                  Tags
                </label>
                <button
                  type="button"
                  disabled={isPending || isSuggestingTags || !title.trim()}
                  onClick={async () => {
                    setIsSuggestingTags(true);
                    const res = await suggestTagsForRecipe(
                      title,
                      ingredients.map((i) => i.text).filter(Boolean)
                    );
                    if (res.data) {
                      setSuggestedTagNames(res.data);
                    }
                    setIsSuggestingTags(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/35 hover:bg-[var(--color-accent)]/25 disabled:opacity-50 transition-colors"
                >
                  <Sparkles size={13} strokeWidth={1.7} />
                  <span>{isSuggestingTags ? 'Analyse IA…' : 'Suggérer des tags par IA'}</span>
                </button>
              </div>
              <TagSelector
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                suggestedTagNames={suggestedTagNames}
              />
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
                {isPending ? 'Modification...' : 'Enregistrer les modifications'}
              </button>
              <Link
                href={`/recipes/${id}`}
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

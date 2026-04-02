'use client';

import { useState, useRef, useEffect } from 'react';
import { ConfidenceIndicator } from './confidence-indicator';
import { TagSelector } from './tag-selector';
import { saveDraft } from '@/lib/utils/draft';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';

interface RecipePreviewProps {
  initialRecipe: ExtractedRecipe;
  onSave: (recipe: ExtractedRecipe, tagIds: string[]) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export function RecipePreview({ initialRecipe, onSave, onCancel, isSaving = false }: RecipePreviewProps) {
  const [recipe, setRecipe] = useState<ExtractedRecipe>(initialRecipe);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const scheduleAutosave = (updated: ExtractedRecipe) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveDraft(updated), 500);
  };

  const updateTitle = (title: string) => {
    const updated = { ...recipe, title };
    setRecipe(updated);
    scheduleAutosave(updated);
  };

  const updateIngredient = (index: number, text: string) => {
    const ingredients = recipe.ingredients.map((item, i) =>
      i === index ? { ...item, text } : item
    );
    const updated = { ...recipe, ingredients };
    setRecipe(updated);
    scheduleAutosave(updated);
  };

  const addIngredient = () => {
    const ingredients = [...recipe.ingredients, { text: '', order: recipe.ingredients.length }];
    const updated = { ...recipe, ingredients };
    setRecipe(updated);
    scheduleAutosave(updated);
  };

  const removeIngredient = (index: number) => {
    const ingredients = recipe.ingredients
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, order: i }));
    const updated = { ...recipe, ingredients };
    setRecipe(updated);
    scheduleAutosave(updated);
  };

  const updateStep = (index: number, text: string) => {
    const steps = recipe.steps.map((item, i) =>
      i === index ? { ...item, text } : item
    );
    const updated = { ...recipe, steps };
    setRecipe(updated);
    scheduleAutosave(updated);
  };

  const addStep = () => {
    const steps = [...recipe.steps, { text: '', order: recipe.steps.length }];
    const updated = { ...recipe, steps };
    setRecipe(updated);
    scheduleAutosave(updated);
  };

  const removeStep = (index: number) => {
    const steps = recipe.steps
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, order: i }));
    const updated = { ...recipe, steps };
    setRecipe(updated);
    scheduleAutosave(updated);
  };

  const updateImageUrl = (image_url: string) => {
    const updated = { ...recipe, image_url: image_url || null };
    setRecipe(updated);
    scheduleAutosave(updated);
  };

  const handleSave = async () => {
    await onSave(recipe, selectedTagIds);
  };

  return (
    <div className="mt-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <ConfidenceIndicator confidence={recipe.confidence} />
      </div>

      {/* Titre */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
          Titre
        </label>
        <input
          type="text"
          value={recipe.title}
          onChange={(e) => updateTitle(e.target.value)}
          disabled={isSaving}
          className={`w-full px-3 py-2.5 text-[15px] font-semibold border rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] transition-colors disabled:opacity-50 ${
            !recipe.title ? 'border-orange-300 bg-orange-50' : 'border-[var(--color-border)]'
          }`}
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
          Image (URL)
        </label>
        <input
          type="url"
          value={recipe.image_url || ''}
          onChange={(e) => updateImageUrl(e.target.value)}
          disabled={isSaving}
          placeholder="https://..."
          className="w-full px-3 py-2 text-[13px] border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
        />
      </div>

      {/* Ingrédients */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
          Ingrédients{' '}
          <span className={recipe.ingredients.length === 0 ? 'text-orange-500' : 'text-[var(--color-text-muted)]'}>
            ({recipe.ingredients.length})
          </span>
        </label>
        <div className="space-y-2">
          {recipe.ingredients.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateIngredient(index, e.target.value)}
                disabled={isSaving}
                className="flex-1 px-3 py-2 text-[14px] border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                disabled={isSaving}
                aria-label="Supprimer cet ingrédient"
                className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 rounded-[var(--radius-sm)] hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          disabled={isSaving}
          className="mt-2 text-[13px] text-[var(--color-accent)] hover:underline disabled:opacity-50"
        >
          + Ajouter un ingrédient
        </button>
      </div>

      {/* Étapes */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
          Étapes{' '}
          <span className={recipe.steps.length === 0 ? 'text-orange-500' : 'text-[var(--color-text-muted)]'}>
            ({recipe.steps.length})
          </span>
        </label>
        <div className="space-y-2">
          {recipe.steps.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <span className="mt-2.5 w-5 text-[12px] font-semibold text-[var(--color-text-muted)] shrink-0">
                {index + 1}.
              </span>
              <textarea
                value={item.text}
                onChange={(e) => updateStep(index, e.target.value)}
                disabled={isSaving}
                rows={2}
                className="flex-1 px-3 py-2 text-[14px] border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] resize-y disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => removeStep(index)}
                disabled={isSaving}
                aria-label="Supprimer cette étape"
                className="mt-2 w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-500 rounded-[var(--radius-sm)] hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          disabled={isSaving}
          className="mt-2 text-[13px] text-[var(--color-accent)] hover:underline disabled:opacity-50"
        >
          + Ajouter une étape
        </button>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
          Catégories / Tags
        </label>
        <TagSelector
          selectedTags={selectedTagIds}
          onTagsChange={setSelectedTagIds}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !recipe.title.trim()}
          className="px-6 py-2.5 bg-[var(--color-accent)] text-white text-[14px] font-medium rounded-[var(--radius-sm)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Sauvegarde…' : 'Sauvegarder la recette'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-6 py-2.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[14px] rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-primary)] disabled:opacity-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

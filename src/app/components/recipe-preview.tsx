'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import { ConfidenceIndicator } from './confidence-indicator';
import { TagSelector } from './tag-selector';
import { saveDraft } from '@/lib/utils/draft';
import { getImageProxySrc } from '@/lib/utils/image';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';

interface RecipePreviewProps {
  initialRecipe: ExtractedRecipe;
  onSave: (recipe: ExtractedRecipe, tagIds: string[]) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export function RecipePreview({
  initialRecipe,
  onSave,
  onCancel,
  isSaving = false,
}: RecipePreviewProps) {
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
    const ingredients = [
      ...recipe.ingredients,
      { text: '', order: recipe.ingredients.length },
    ];
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
    <div className="mt-6 max-w-2xl mx-auto glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
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
          className={`w-full px-3.5 py-2.5 text-[15px] font-semibold border rounded-xl bg-white/5 text-[var(--color-text-primary)] transition-colors focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 ${
            !recipe.title
              ? 'border-amber-500/50 bg-amber-500/10'
              : 'border-[var(--color-border)]'
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
          className="w-full px-3.5 py-2 text-[13px] border border-[var(--color-border)] rounded-xl bg-white/5 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
        />
        {!recipe.image_url && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Sparkles size={13} strokeWidth={1.7} className="shrink-0 mt-0.5 text-[var(--color-accent)]" />
            <span>
              Aucune image trouvée : à l&apos;enregistrement, Commis cherchera une photo sur la page d&apos;origine, sinon en générera une du plat.
            </span>
          </p>
        )}
        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt="Aperçu"
            className="mt-2.5 w-full h-44 object-cover rounded-2xl border border-[var(--color-border)]"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.dataset.proxied) {
                img.dataset.proxied = '1';
                img.src = getImageProxySrc(recipe.image_url!);
              } else {
                img.style.display = 'none';
              }
            }}
          />
        )}
      </div>

      {/* Ingrédients */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
          Ingrédients{' '}
          <span
            className={
              recipe.ingredients.length === 0
                ? 'text-amber-400'
                : 'text-[var(--color-text-muted)]'
            }
          >
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
                className="flex-1 px-3.5 py-2 text-[14px] border border-[var(--color-border)] rounded-xl bg-white/5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                disabled={isSaving}
                aria-label="Supprimer cet ingrédient"
                className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-400 rounded-xl hover:bg-red-500/15 transition-colors disabled:opacity-50"
              >
                <X size={15} strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          disabled={isSaving}
          className="mt-2.5 inline-flex items-center gap-1 text-[13px] text-[var(--color-accent)] hover:underline disabled:opacity-50"
        >
          <Plus size={14} strokeWidth={2} />
          <span>Ajouter un ingrédient</span>
        </button>
      </div>

      {/* Étapes */}
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
          Étapes{' '}
          <span
            className={
              recipe.steps.length === 0
                ? 'text-amber-400'
                : 'text-[var(--color-text-muted)]'
            }
          >
            ({recipe.steps.length})
          </span>
        </label>
        <div className="space-y-2">
          {recipe.steps.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <span className="mt-2.5 w-6 font-serif italic text-[14px] text-[var(--color-accent)] shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <textarea
                value={item.text}
                onChange={(e) => updateStep(index, e.target.value)}
                disabled={isSaving}
                rows={2}
                className="flex-1 px-3.5 py-2 text-[14px] border border-[var(--color-border)] rounded-xl bg-white/5 text-[var(--color-text-primary)] resize-y focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => removeStep(index)}
                disabled={isSaving}
                aria-label="Supprimer cette étape"
                className="mt-2 w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-400 rounded-xl hover:bg-red-500/15 transition-colors disabled:opacity-50"
              >
                <X size={15} strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          disabled={isSaving}
          className="mt-2.5 inline-flex items-center gap-1 text-[13px] text-[var(--color-accent)] hover:underline disabled:opacity-50"
        >
          <Plus size={14} strokeWidth={2} />
          <span>Ajouter une étape</span>
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
          suggestedTagNames={recipe.suggested_tags}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !recipe.title.trim()}
          className="px-6 py-2.5 bg-[var(--color-accent)] text-white text-[14px] font-semibold rounded-xl hover:bg-[var(--accent-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Sauvegarde et recherche de la photo…' : 'Sauvegarder la recette'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-6 py-2.5 glass-pill text-[var(--color-text-secondary)] text-[14px] rounded-xl hover:text-white disabled:opacity-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

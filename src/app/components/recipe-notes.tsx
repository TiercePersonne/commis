'use client';

import { useState, useRef } from 'react';
import { updateNotes } from '@/app/actions/recipes';

type RecipeNotesProps = {
  recipeId: string;
  initialNotes: string;
};

export function RecipeNotes({ recipeId, initialNotes }: RecipeNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const result = await updateNotes(recipeId, notes);

    setSaving(false);

    if (result.error) {
      alert(result.error);
    } else {
      setSaved(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSaved(false), 2000);
    }
  };

  const hasChanges = notes !== initialNotes;

  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-3 pb-2 border-b border-[var(--color-border)]">
        Notes personnelles
      </h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Ajoutez vos notes, ajustements, astuces..."
        rows={4}
        className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(196,112,75,0.12)] resize-y text-[15px] leading-relaxed"
      />
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        {saved && (
          <span className="text-sm text-[var(--color-accent)]">
            ✓ Note sauvegardée
          </span>
        )}
      </div>
    </div>
  );
}

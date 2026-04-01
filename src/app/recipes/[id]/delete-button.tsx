'use client';

import { useState } from 'react';
import { deleteRecipe } from '@/app/actions/recipes';

export function DeleteButton({ recipeId }: { recipeId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteRecipe(recipeId);
  };

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#ba2d2d] text-white rounded-xl hover:opacity-90 disabled:opacity-50 font-medium transition-opacity"
        >
          {isDeleting ? 'Suppression...' : 'Confirmer'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="inline-flex items-center justify-center px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-secondary)] font-medium transition-colors"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center justify-center px-4 py-2.5 border border-[#ba2d2d] text-[#ba2d2d] rounded-xl hover:bg-red-50 font-medium transition-colors"
    >
      Supprimer
    </button>
  );
}

'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
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
          className="inline-flex items-center justify-center px-4 py-2.5 bg-red-500/90 text-white rounded-xl hover:bg-red-500 disabled:opacity-50 font-medium text-xs sm:text-sm transition-colors"
        >
          {isDeleting ? 'Suppression...' : 'Confirmer'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="inline-flex items-center justify-center px-4 py-2.5 glass-pill text-[var(--color-text-primary)] rounded-xl hover:bg-white/10 font-medium text-xs sm:text-sm transition-colors"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-1.5 justify-center px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium text-xs sm:text-sm transition-colors"
    >
      <Trash2 size={14} strokeWidth={1.6} />
      <span>Supprimer</span>
    </button>
  );
}

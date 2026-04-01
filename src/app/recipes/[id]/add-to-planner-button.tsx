'use client';

import { useState } from 'react';
import { SlotPickerDialog } from '@/app/components/slot-picker-dialog';

type AddToPlannerButtonProps = {
  recipeId: string;
  recipeTitle: string;
};

export function AddToPlannerButton({ recipeId, recipeTitle }: AddToPlannerButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-secondary)] font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-secondary)]"
      >
        Ajouter au planning
      </button>

      {showDialog && (
        <SlotPickerDialog
          recipeId={recipeId}
          recipeTitle={recipeTitle}
          onClose={() => setShowDialog(false)}
          onSuccess={() => {
            setShowDialog(false);
          }}
        />
      )}
    </>
  );
}

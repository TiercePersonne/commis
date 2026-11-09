'use client';

import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
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
        className="inline-flex items-center gap-1.5 justify-center px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] font-medium text-xs sm:text-sm transition-all shadow-[0_6px_18px_rgba(217,130,91,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        <CalendarPlus size={15} strokeWidth={1.7} />
        <span>Ajouter au planning</span>
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

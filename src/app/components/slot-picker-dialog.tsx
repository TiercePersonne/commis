'use client';

import { useState, useEffect } from 'react';
import { addToSlot } from '@/app/actions/meal-plans';
import { getMonday, formatDate } from '@/lib/utils/date';

type SlotPickerDialogProps = {
  recipeId: string;
  recipeTitle: string;
  onClose: () => void;
  onSuccess: () => void;
};

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MEAL_TYPES = [
  { key: 'lunch' as const, label: 'Déjeuner' },
  { key: 'dinner' as const, label: 'Dîner' },
];

export function SlotPickerDialog({
  recipeId,
  recipeTitle,
  onClose,
  onSuccess,
}: SlotPickerDialogProps) {
  const [adding, setAdding] = useState<string | null>(null);
  const [currentWeekStart] = useState(() => formatDate(getMonday(new Date())));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleAddToSlot = async (day: number, mealType: 'lunch' | 'dinner') => {
    const slotKey = `${day}-${mealType}`;
    setAdding(slotKey);

    const result = await addToSlot(recipeId, currentWeekStart, day, mealType);

    if (result.error) {
      alert(result.error);
      setAdding(null);
    } else {
      onSuccess();
      onClose();
    }
  };

  const getWeekDisplay = () => {
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--color-bg-card)] rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col border border-[var(--color-border-light)] shadow-[0_8px_24px_rgba(44,24,16,0.10)]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-serif text-[var(--color-text-primary)] mb-2">
            Ajouter au planning
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">
            {recipeTitle}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {getWeekDisplay()}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DAYS.map((dayLabel, dayIndex) => (
              <div key={dayIndex} className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg-card)]">
                <h3 className="font-medium text-[var(--color-text-primary)] mb-3">
                  {dayLabel}
                </h3>
                <div className="space-y-2">
                  {MEAL_TYPES.map(({ key, label }) => {
                    const slotKey = `${dayIndex}-${key}`;
                    const isAdding = adding === slotKey;

                    return (
                      <button
                        key={key}
                        onClick={() => handleAddToSlot(dayIndex, key)}
                        disabled={isAdding}
                        className="w-full text-left px-3 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-sm text-[var(--color-text-primary)]">
                          {label}
                        </span>
                        {isAdding && (
                          <span className="text-xs text-[var(--color-accent)] ml-2">
                            Ajout...
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

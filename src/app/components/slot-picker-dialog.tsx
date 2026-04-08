'use client';

import { useState, useEffect, useCallback } from 'react';
import { addToSlot, getMealPlan } from '@/app/actions/meal-plans';
import { getMonday, formatDate } from '@/lib/utils/date';
import { getImageSrc, getImageProxySrc } from '@/lib/utils/image';
import type { MealPlanWithRecipe } from '@/lib/schemas/meal-plan';

type SlotKey = `${number}-${'lunch' | 'dinner'}`;

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

function addWeeks(dateStr: string, weeks: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + weeks * 7);
  return formatDate(d);
}

function getWeekDisplay(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} – ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

export function SlotPickerDialog({
  recipeId,
  recipeTitle,
  onClose,
  onSuccess,
}: SlotPickerDialogProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => formatDate(getMonday(new Date())));
  const [selectedSlots, setSelectedSlots] = useState<Set<SlotKey>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [mealPlans, setMealPlans] = useState<MealPlanWithRecipe[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Charge le planning pour la semaine affichée
  const loadMealPlans = useCallback(async (weekStart: string) => {
    setIsLoadingPlans(true);
    const { mealPlans: plans } = await getMealPlan(weekStart);
    setMealPlans(plans ?? []);
    setIsLoadingPlans(false);
  }, []);

  useEffect(() => {
    setSelectedSlots(new Set());
    loadMealPlans(currentWeekStart);
  }, [currentWeekStart, loadMealPlans]);

  const getExistingMeal = (day: number, mealType: 'lunch' | 'dinner'): MealPlanWithRecipe | undefined => {
    return mealPlans.find((mp) => mp.day === day && mp.meal_type === mealType);
  };

  const toggleSlot = (day: number, mealType: 'lunch' | 'dinner') => {
    const key: SlotKey = `${day}-${mealType}`;
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedSlots.size === 0) return;
    setIsSaving(true);

    const promises = Array.from(selectedSlots).map((key) => {
      const [day, mealType] = key.split('-') as [string, 'lunch' | 'dinner'];
      return addToSlot(recipeId, currentWeekStart, parseInt(day), mealType);
    });

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    setIsSaving(false);

    if (errors.length > 0) {
      alert(errors[0].error);
    } else {
      onSuccess();
      onClose();
    }
  };

  const isCurrentWeek = currentWeekStart === formatDate(getMonday(new Date()));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--color-bg-card)] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-[var(--color-border-light)] shadow-[0_8px_24px_rgba(44,24,16,0.10)]" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-serif text-[var(--color-text-primary)] mb-1">
            Ajouter au planning
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">{recipeTitle}</p>

          {/* Navigation semaine */}
          <div className="flex items-center justify-between bg-[var(--color-bg-primary)] rounded-xl px-4 py-2.5">
            <button
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, -1))}
              disabled={isCurrentWeek}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-[var(--color-text-primary)] text-xl font-light"
              aria-label="Semaine précédente"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-[var(--color-text-primary)] text-center">
              {getWeekDisplay(currentWeekStart)}
            </span>
            <button
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-primary)] text-xl font-light"
              aria-label="Semaine suivante"
            >
              ›
            </button>
          </div>

          {selectedSlots.size > 0 && (
            <p className="text-xs text-[var(--color-accent)] mt-2 font-medium">
              {selectedSlots.size} créneau{selectedSlots.size > 1 ? 'x' : ''} sélectionné{selectedSlots.size > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Grille des créneaux */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingPlans ? (
            <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-muted)]">
              Chargement du planning...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DAYS.map((dayLabel, dayIndex) => (
                <div key={dayIndex} className="border border-[var(--color-border)] rounded-xl p-4">
                  <h3 className="font-medium text-[var(--color-text-primary)] mb-3 text-sm">{dayLabel}</h3>
                  <div className="space-y-2">
                    {MEAL_TYPES.map(({ key, label }) => {
                      const slotKey: SlotKey = `${dayIndex}-${key}`;
                      const isSelected = selectedSlots.has(slotKey);
                      const existingMeal = getExistingMeal(dayIndex, key);
                      const isTaken = !!existingMeal;
                      const isThisRecipe = existingMeal?.recipe.id === recipeId;

                      return (
                        <button
                          key={key}
                          onClick={() => toggleSlot(dayIndex, key)}
                          disabled={isSaving}
                          className={`w-full text-left rounded-xl border-2 transition-all disabled:opacity-50 overflow-hidden ${
                            isSelected
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                              : isTaken
                              ? 'border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-accent)]/50'
                              : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent)]/50'
                          }`}
                        >
                          <div className="flex items-center gap-0">
                            {/* Miniature de la recette existante */}
                            {isTaken && (
                              <div className="w-14 h-14 flex-shrink-0 relative">
                                {existingMeal!.recipe.image_url ? (
                                  <img
                                    src={getImageSrc(existingMeal!.recipe.image_url)}
                                    alt={existingMeal!.recipe.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const img = e.currentTarget as HTMLImageElement;
                                      if (!img.dataset.proxied) {
                                        img.dataset.proxied = '1';
                                        img.src = getImageProxySrc(existingMeal!.recipe.image_url!);
                                      } else {
                                        img.style.display = 'none';
                                        (img.nextElementSibling as HTMLElement).style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="w-full h-full bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-border)] items-center justify-center text-lg"
                                  style={{ display: existingMeal!.recipe.image_url ? 'none' : 'flex' }}
                                >
                                  🍽️
                                </div>
                              </div>
                            )}

                            <div className={`flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0 ${isTaken ? 'py-2' : ''}`}>
                              {/* Case à cocher */}
                              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] flex-shrink-0 ${
                                isSelected
                                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                                  : 'border-[var(--color-border)]'
                              }`}>
                                {isSelected ? '✓' : ''}
                              </span>

                              <div className="flex-1 min-w-0">
                                <span className={`text-sm font-medium block ${isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                                  {label}
                                </span>
                                {isTaken && (
                                  <span className={`text-xs truncate block mt-0.5 ${
                                    isThisRecipe
                                      ? 'text-[var(--color-accent)]'
                                      : 'text-[var(--color-text-muted)]'
                                  }`}>
                                    {isThisRecipe ? '✓ Déjà planifiée' : `↔ ${existingMeal!.recipe.title}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border)] flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedSlots.size === 0 || isSaving}
            className="flex-1 px-4 py-3 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            {isSaving
              ? 'Enregistrement...'
              : selectedSlots.size === 0
              ? 'Sélectionnez des créneaux'
              : `Confirmer (${selectedSlots.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}

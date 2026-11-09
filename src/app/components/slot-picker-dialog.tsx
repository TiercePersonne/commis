'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Utensils, Check, ArrowLeftRight, X } from 'lucide-react';
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
  return `${start.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  })} – ${end.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
}

export function SlotPickerDialog({
  recipeId,
  recipeTitle,
  onClose,
  onSuccess,
}: SlotPickerDialogProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    formatDate(getMonday(new Date()))
  );
  const [selectedSlots, setSelectedSlots] = useState<Set<SlotKey>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [mealPlans, setMealPlans] = useState<MealPlanWithRecipe[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const getExistingMeal = (
    day: number,
    mealType: 'lunch' | 'dinner'
  ): MealPlanWithRecipe | undefined => {
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
    setErrorMessage(null);

    const promises = Array.from(selectedSlots).map((key) => {
      const [day, mealType] = key.split('-') as [string, 'lunch' | 'dinner'];
      return addToSlot(recipeId, currentWeekStart, parseInt(day), mealType);
    });

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    setIsSaving(false);

    if (errors.length > 0) {
      setErrorMessage(errors[0].error ?? 'Erreur lors de la planification');
    } else {
      onSuccess();
      onClose();
    }
  };

  const isCurrentWeek = currentWeekStart === formatDate(getMonday(new Date()));

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="glass-dock rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border)]">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-serif text-[var(--color-text-primary)] mb-1">
                Ajouter au planning
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                {recipeTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-[var(--color-text-secondary)] hover:text-white"
            >
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>

          {/* Navigation semaine */}
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
            <button
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, -1))}
              disabled={isCurrentWeek}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-[var(--color-text-primary)]"
              aria-label="Semaine précédente"
            >
              <ChevronLeft size={16} strokeWidth={1.8} />
            </button>
            <span className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)] text-center">
              {getWeekDisplay(currentWeekStart)}
            </span>
            <button
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors text-[var(--color-text-primary)]"
              aria-label="Semaine suivante"
            >
              <ChevronRight size={16} strokeWidth={1.8} />
            </button>
          </div>

          {selectedSlots.size > 0 && (
            <p className="text-xs text-[var(--color-accent)] mt-2.5 font-medium">
              {selectedSlots.size} créneau{selectedSlots.size > 1 ? 'x' : ''} sélectionné
              {selectedSlots.size > 1 ? 's' : ''}
            </p>
          )}
          {errorMessage && (
            <p className="text-xs text-red-400 mt-2">{errorMessage}</p>
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
                <div key={dayIndex} className="glass-panel rounded-2xl p-4">
                  <h3 className="font-serif font-medium text-[var(--color-text-primary)] mb-3 text-sm">
                    {dayLabel}
                  </h3>
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
                          className={`w-full text-left rounded-xl border transition-all disabled:opacity-50 overflow-hidden ${
                            isSelected
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15'
                              : isTaken
                              ? 'border-white/10 bg-white/[0.03] hover:border-[var(--color-accent)]/50'
                              : 'border-white/10 bg-white/[0.05] hover:border-[var(--color-accent)]/50'
                          }`}
                        >
                          <div className="flex items-center gap-0">
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
                                        img.src = getImageProxySrc(
                                          existingMeal!.recipe.image_url!
                                        );
                                      } else {
                                        img.style.display = 'none';
                                        (img.nextElementSibling as HTMLElement).style.display =
                                          'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="w-full h-full bg-gradient-to-br from-[#231b17] to-[#16110e] items-center justify-center text-[var(--color-text-muted)]"
                                  style={{
                                    display: existingMeal!.recipe.image_url ? 'none' : 'flex',
                                  }}
                                >
                                  <Utensils size={16} strokeWidth={1.4} />
                                </div>
                              </div>
                            )}

                            <div
                              className={`flex items-center gap-2.5 px-3 py-2.5 flex-1 min-w-0 ${
                                isTaken ? 'py-2' : ''
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                  isSelected
                                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                                    : 'border-white/25'
                                }`}
                              >
                                {isSelected && <Check size={10} strokeWidth={2.5} />}
                              </span>

                              <div className="flex-1 min-w-0">
                                <span
                                  className={`text-sm font-medium block ${
                                    isSelected
                                      ? 'text-[var(--color-accent)]'
                                      : 'text-[var(--color-text-primary)]'
                                  }`}
                                >
                                  {label}
                                </span>
                                {isTaken && (
                                  <span
                                    className={`text-xs truncate flex items-center gap-1 mt-0.5 ${
                                      isThisRecipe
                                        ? 'text-[var(--color-accent)]'
                                        : 'text-[var(--color-text-muted)]'
                                    }`}
                                  >
                                    {isThisRecipe ? (
                                      <>
                                        <Check size={11} strokeWidth={2} />
                                        <span>Déjà planifiée</span>
                                      </>
                                    ) : (
                                      <>
                                        <ArrowLeftRight size={11} strokeWidth={1.6} />
                                        <span className="truncate">
                                          {existingMeal!.recipe.title}
                                        </span>
                                      </>
                                    )}
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
            className="flex-1 px-4 py-3 glass-pill text-[var(--color-text-primary)] rounded-2xl hover:bg-white/10 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedSlots.size === 0 || isSaving}
            className="flex-1 px-4 py-3 bg-[var(--color-accent)] text-white rounded-2xl hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold"
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

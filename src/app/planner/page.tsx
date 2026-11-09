'use client';

import { useState, useEffect } from 'react';
import { Calendar, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { MealPlannerGrid } from '@/app/components/meal-planner-grid';
import { RecipePickerDialog } from '@/app/components/recipe-picker-dialog';
import { AppLayout } from '@/app/components/app-layout';
import { getMealPlan } from '@/app/actions/meal-plans';
import { getMonday, formatDate } from '@/lib/utils/date';
import { PlannerShoppingList } from '@/app/components/planner-shopping-list';
import type { MealPlanWithRecipe } from '@/lib/schemas/meal-plan';

export default function PlannerPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
    const monday = getMonday(new Date());
    return formatDate(monday);
  });
  const [mealPlans, setMealPlans] = useState<MealPlanWithRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: number;
    mealType: 'lunch' | 'dinner';
  } | null>(null);
  const [activeView, setActiveView] = useState<'meals' | 'groceries'>('meals');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'groceries') {
        setActiveView('groceries');
      }
    }
  }, []);

  useEffect(() => {
    if (!currentWeekStart) return;

    const loadMealPlan = async () => {
      setLoading(true);
      setError(null);

      const result = await getMealPlan(currentWeekStart);

      if (result.error) {
        setError(result.error);
      } else {
        setMealPlans(result.mealPlans || []);
      }

      setLoading(false);
    };

    loadMealPlan();
  }, [currentWeekStart]);

  const handlePreviousWeek = () => {
    const currentDate = new Date(currentWeekStart);
    currentDate.setDate(currentDate.getDate() - 7);
    setCurrentWeekStart(formatDate(currentDate));
  };

  const handleNextWeek = () => {
    const currentDate = new Date(currentWeekStart);
    currentDate.setDate(currentDate.getDate() + 7);
    setCurrentWeekStart(formatDate(currentDate));
  };

  const handleSlotClick = (day: number, mealType: 'lunch' | 'dinner') => {
    setSelectedSlot({ day, mealType });
  };

  const handleRemoveSuccess = (day: number, mealType: 'lunch' | 'dinner') => {
    setMealPlans((prev) =>
      prev.filter((mp) => !(mp.day === day && mp.meal_type === mealType))
    );
  };

  const getWeekDisplay = () => {
    if (!currentWeekStart) return '';
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return `${start.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    })} – ${end.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;
  };

  if (!currentWeekStart) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/5 rounded-xl w-1/3 mb-6" />
          <div className="h-96 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 md:px-10 pb-16 md:pb-10">
        <div className="max-w-7xl mx-auto pt-4 md:pt-8">
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-medium text-[var(--color-text-primary)]">
                  Ma Semaine de Repas
                </h1>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
                  Planifiez vos menus et retrouvez votre liste de courses agrégée.
                </p>
              </div>

              {/* Segmented Switch Repas / Courses */}
              <div className="inline-flex p-1 rounded-2xl glass-panel self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveView('meals')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeView === 'meals'
                      ? 'bg-[var(--color-accent)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-white'
                  }`}
                >
                  <Calendar size={14} strokeWidth={1.7} />
                  <span>Repas ({mealPlans.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('groceries')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeView === 'groceries'
                      ? 'bg-[var(--color-accent)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-white'
                  }`}
                >
                  <ShoppingBag size={14} strokeWidth={1.7} />
                  <span>Courses</span>
                </button>
              </div>
            </div>

            {/* Sélecteur de semaine */}
            <div className="flex items-center justify-between glass-panel rounded-2xl px-3 py-2.5">
              <button
                onClick={handlePreviousWeek}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] hover:text-white glass-pill rounded-xl transition-colors"
                aria-label="Semaine précédente"
              >
                <ChevronLeft size={15} strokeWidth={1.8} />
                <span>Préc.</span>
              </button>

              <h2 className="text-xs sm:text-sm md:text-base font-medium text-[var(--color-text-primary)] text-center px-2">
                {getWeekDisplay()}
              </h2>

              <button
                onClick={handleNextWeek}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] hover:text-white glass-pill rounded-xl transition-colors"
                aria-label="Semaine suivante"
              >
                <span>Suiv.</span>
                <ChevronRight size={15} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="animate-pulse">
              <div className="h-96 bg-white/5 rounded-3xl border border-white/10" />
            </div>
          ) : (
            <>
              {activeView === 'meals' ? (
                <>
                  <MealPlannerGrid
                    weekStart={currentWeekStart}
                    mealPlans={mealPlans}
                    onSlotClick={handleSlotClick}
                    onRemoveSuccess={handleRemoveSuccess}
                  />
                  {!error && mealPlans.length > 0 && (
                    <PlannerShoppingList mealPlans={mealPlans} weekStart={currentWeekStart} />
                  )}
                </>
              ) : mealPlans.length > 0 ? (
                <PlannerShoppingList mealPlans={mealPlans} weekStart={currentWeekStart} isStandalone />
              ) : (
                <div className="glass-panel rounded-3xl p-10 text-center space-y-3">
                  <ShoppingBag
                    size={36}
                    strokeWidth={1.4}
                    className="mx-auto text-[var(--color-text-muted)] opacity-60"
                  />
                  <h3 className="font-serif text-lg text-[var(--color-text-primary)]">
                    Aucun repas planifié cette semaine
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
                    Ajoutez des recettes dans votre planning de la semaine pour générer automatiquement votre liste de courses.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveView('meals')}
                    className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-xl text-xs font-semibold"
                  >
                    <Calendar size={14} strokeWidth={1.7} />
                    <span>Planifier mes repas</span>
                  </button>
                </div>
              )}
            </>
          )}

          {selectedSlot && (
            <RecipePickerDialog
              weekStart={currentWeekStart}
              day={selectedSlot.day}
              mealType={selectedSlot.mealType}
              onClose={() => setSelectedSlot(null)}
              onSuccess={async () => {
                const result = await getMealPlan(currentWeekStart);
                if (result.mealPlans) {
                  setMealPlans(result.mealPlans);
                }
              }}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

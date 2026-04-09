'use client';

import { useState, useEffect } from 'react';
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
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; mealType: 'lunch' | 'dinner' } | null>(null);

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



  const getWeekDisplay = () => {
    if (!currentWeekStart) return '';
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  if (!currentWeekStart) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="px-10 pb-10">
        <div className="max-w-7xl mx-auto pt-8">
          <div className="mb-6">
            <h1 className="text-3xl font-serif text-[var(--color-text-primary)] mb-4">
              Ma Semaine de Repas
            </h1>
            
            <div className="flex items-center justify-between mb-4 gap-4">
              <button
                onClick={handlePreviousWeek}
                className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors"
                aria-label="Semaine précédente"
              >
                ← Semaine précédente
              </button>
              
              <h2 className="text-lg font-medium text-[var(--color-text-primary)] text-center">
                {getWeekDisplay()}
              </h2>
              
              <button
                onClick={handleNextWeek}
                className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors"
                aria-label="Semaine suivante"
              >
                Semaine suivante →
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="animate-pulse">
              <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
          ) : (
            <>
              <MealPlannerGrid
                weekStart={currentWeekStart}
                mealPlans={mealPlans}
                onSlotClick={handleSlotClick}
              />
              {!loading && !error && mealPlans.length > 0 && (
                <PlannerShoppingList mealPlans={mealPlans} />
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

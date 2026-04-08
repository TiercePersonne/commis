'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { MealPlanWithRecipe } from '@/lib/schemas/meal-plan';
import { removeFromSlot } from '@/app/actions/meal-plans';
import { getImageSrc, getImageProxySrc } from '@/lib/utils/image';
import { toSentenceCase } from '@/lib/utils/text';

type MealPlannerGridProps = {
  weekStart: string;
  mealPlans: MealPlanWithRecipe[];
  onSlotClick: (day: number, mealType: 'lunch' | 'dinner') => void;
};

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MEAL_TYPES = [
  { key: 'lunch' as const, label: 'Déjeuner' },
  { key: 'dinner' as const, label: 'Dîner' },
];

export function MealPlannerGrid({ weekStart, mealPlans, onSlotClick }: MealPlannerGridProps) {
  const [removingSlot, setRemovingSlot] = useState<string | null>(null);

  const getMealPlan = (day: number, mealType: 'lunch' | 'dinner') => {
    return mealPlans.find(mp => mp.day === day && mp.meal_type === mealType);
  };

  const handleRemove = async (day: number, mealType: 'lunch' | 'dinner') => {
    const slotKey = `${day}-${mealType}`;
    setRemovingSlot(slotKey);
    
    const result = await removeFromSlot(weekStart, day, mealType);
    
    if (result.error) {
      alert(result.error);
    }
    
    setRemovingSlot(null);
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-8 gap-2">
          <div className="font-medium text-sm text-[var(--color-text-secondary)]"></div>
          {DAYS.map((day, index) => (
            <div
              key={index}
              className="font-medium text-sm text-[var(--color-text-primary)] text-center p-2"
            >
              {day}
            </div>
          ))}

          {MEAL_TYPES.map(({ key, label }) => (
            <>
              <div
                key={`label-${key}`}
                className="font-medium text-sm text-[var(--color-text-secondary)] flex items-center"
              >
                {label}
              </div>
              {DAYS.map((_, dayIndex) => {
                const mealPlan = getMealPlan(dayIndex, key);
                const slotKey = `${dayIndex}-${key}`;
                const isRemoving = removingSlot === slotKey;

                return (
                  <div
                    key={`${dayIndex}-${key}`}
                    className="min-h-[100px] border border-[var(--color-border-light)] rounded-xl bg-[var(--color-bg-card)] shadow-[0_1px_3px_rgba(44,24,16,0.06)]"
                  >
                    {mealPlan ? (
                      <>
                        <Link
                          href={`/recipes/${mealPlan.recipe.id}`}
                          className="flex flex-col group"
                        >
                          {mealPlan.recipe.image_url ? (
                            <img
                              src={getImageSrc(mealPlan.recipe.image_url)}
                              alt={mealPlan.recipe.title}
                              className="w-full h-20 object-cover rounded-t-xl"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                if (!img.dataset.proxied) {
                                  img.dataset.proxied = '1';
                                  img.src = getImageProxySrc(mealPlan.recipe.image_url!);
                                } else {
                                  img.style.display = 'none';
                                  (img.nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-20 bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-border)] items-center justify-center text-[var(--color-text-muted)] text-2xl rounded-t-xl"
                            style={{ display: mealPlan.recipe.image_url ? 'none' : 'flex' }}
                          >
                            🍽️
                          </div>
                          <div className="p-2 flex flex-col">
                            <span className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">
                              {toSentenceCase(mealPlan.recipe.title)}
                            </span>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleRemove(dayIndex, key)}
                          disabled={isRemoving}
                          className="mx-2 mb-2 text-xs text-[var(--color-accent)] hover:underline disabled:opacity-50 text-left"
                          aria-label={`Retirer ${mealPlan.recipe.title}`}
                        >
                          {isRemoving ? 'Suppression...' : 'Retirer'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onSlotClick(dayIndex, key)}
                        className="w-full h-full min-h-[100px] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors rounded-xl"
                        aria-label={`Ajouter une recette pour ${label.toLowerCase()} ${DAYS[dayIndex].toLowerCase()}`}
                      >
                        <span className="text-2xl">+</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

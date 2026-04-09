'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    <>
      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-6 mt-4">
        {DAYS.map((day, dayIndex) => (
          <div key={`mobile-day-${dayIndex}`} className="flex flex-col gap-3">
            <h3 className="font-serif text-lg font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border-light)] pb-2">
              {day}
            </h3>
            <div className="flex flex-col gap-3">
              {MEAL_TYPES.map(({ key, label }) => {
                const mealPlan = getMealPlan(dayIndex, key);
                const slotKey = `${dayIndex}-${key}`;
                const isRemoving = removingSlot === slotKey;

                return (
                  <div key={slotKey} className="relative w-full rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-light)] shadow-sm overflow-hidden flex flex-row h-[100px]">
                    {mealPlan ? (
                      <>
                        <Link href={`/recipes/${mealPlan.recipe.id}`} className="block relative h-full w-[100px] shrink-0 border-r border-[var(--color-border-light)]">
                          {mealPlan.recipe.image_url ? (
                            <Image
                              src={getImageSrc(mealPlan.recipe.image_url)}
                              alt={mealPlan.recipe.title}
                              fill
                              sizes="(max-width: 768px) 100px, 100px"
                              className="object-cover object-center"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                if (!img.dataset.proxied) {
                                  img.dataset.proxied = '1';
                                  img.src = getImageProxySrc(mealPlan.recipe.image_url!);
                                  img.srcset = '';
                                } else {
                                  img.style.display = 'none';
                                  if (img.nextElementSibling) {
                                    (img.nextElementSibling as HTMLElement).style.display = 'flex';
                                  }
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-border)] items-center justify-center text-[var(--color-text-muted)] text-xl"
                            style={{ display: mealPlan.recipe.image_url ? 'none' : 'flex' }}
                          >
                            🍽️
                          </div>
                        </Link>
                        
                        <div className="flex flex-col flex-1 p-3 px-4 justify-between min-w-0">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">{label}</span>
                            <Link href={`/recipes/${mealPlan.recipe.id}`} className="block block-truncate">
                              <span className="block text-sm font-medium text-[var(--color-text-primary)] line-clamp-2 leading-tight">
                                {toSentenceCase(mealPlan.recipe.title)}
                              </span>
                            </Link>
                          </div>
                          <div className="flex justify-start">
                            <button
                              onClick={(e) => { e.preventDefault(); handleRemove(dayIndex, key); }}
                              disabled={isRemoving}
                              className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
                            >
                              {isRemoving ? '...' : 'Retirer'}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => onSlotClick(dayIndex, key)}
                        className="w-full h-full flex items-center px-4 hover:bg-[var(--color-bg-secondary)] transition-colors text-left"
                      >
                        <div className="w-[100px] shrink-0 h-full flex flex-col items-center justify-center border-r border-dashed border-[var(--color-border)] opacity-60">
                          <span className="text-2xl text-[var(--color-text-secondary)]">+</span>
                        </div>
                        <div className="flex-1 p-3 px-4">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">{label}</span>
                          <span className="block text-sm font-medium text-[var(--color-text-secondary)] mt-1">Ajouter une recette</span>
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
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
              <div key={`desktop-row-${key}`} className="contents">
                <div
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
                      key={`desktop-${slotKey}`}
                      className="min-h-[100px] border border-[var(--color-border-light)] rounded-xl bg-[var(--color-bg-card)] shadow-[0_1px_3px_rgba(44,24,16,0.06)]"
                    >
                      {mealPlan ? (
                        <>
                          <Link
                            href={`/recipes/${mealPlan.recipe.id}`}
                            className="flex flex-col group"
                          >
                            <div className="relative w-full h-20">
                              {mealPlan.recipe.image_url ? (
                                <Image
                                  src={getImageSrc(mealPlan.recipe.image_url)}
                                  alt={mealPlan.recipe.title}
                                  fill
                                  sizes="150px"
                                  className="object-cover object-center rounded-t-xl"
                                  onError={(e) => {
                                    const img = e.currentTarget as HTMLImageElement;
                                    if (!img.dataset.proxied) {
                                      img.dataset.proxied = '1';
                                      img.src = getImageProxySrc(mealPlan.recipe.image_url!);
                                      img.srcset = '';
                                    } else {
                                      img.style.display = 'none';
                                      if (img.nextElementSibling) {
                                        (img.nextElementSibling as HTMLElement).style.display = 'flex';
                                      }
                                    }
                                  }}
                                />
                              ) : null}
                              <div
                                className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-border)] items-center justify-center text-[var(--color-text-muted)] text-2xl rounded-t-xl"
                                style={{ display: mealPlan.recipe.image_url ? 'none' : 'flex' }}
                              >
                                🍽️
                              </div>
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

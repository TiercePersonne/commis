'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Utensils, Plus, X } from 'lucide-react';
import type { MealPlanWithRecipe } from '@/lib/schemas/meal-plan';
import { removeFromSlot } from '@/app/actions/meal-plans';
import { getImageSrc, getImageProxySrc } from '@/lib/utils/image';
import { toSentenceCase } from '@/lib/utils/text';

type MealPlannerGridProps = {
  weekStart: string;
  mealPlans: MealPlanWithRecipe[];
  onSlotClick: (day: number, mealType: 'lunch' | 'dinner') => void;
  onRemoveSuccess?: (day: number, mealType: 'lunch' | 'dinner') => void;
};

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MEAL_TYPES = [
  { key: 'lunch' as const, label: 'Déjeuner' },
  { key: 'dinner' as const, label: 'Dîner' },
];

export function MealPlannerGrid({
  weekStart,
  mealPlans,
  onSlotClick,
  onRemoveSuccess,
}: MealPlannerGridProps) {
  const [removingSlot, setRemovingSlot] = useState<string | null>(null);
  const [mobileSelectedDay, setMobileSelectedDay] = useState<number | 'all'>('all');

  const getMealPlan = (day: number, mealType: 'lunch' | 'dinner') => {
    return mealPlans.find((mp) => mp.day === day && mp.meal_type === mealType);
  };

  const handleRemove = async (day: number, mealType: 'lunch' | 'dinner') => {
    const slotKey = `${day}-${mealType}`;
    setRemovingSlot(slotKey);

    const result = await removeFromSlot(weekStart, day, mealType);

    if (!result.error) {
      onRemoveSuccess?.(day, mealType);
    }

    setRemovingSlot(null);
  };

  const mobileDaysToShow =
    mobileSelectedDay === 'all'
      ? DAYS.map((day, idx) => ({ day, idx }))
      : [{ day: DAYS[mobileSelectedDay], idx: mobileSelectedDay }];

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-5 mt-2">
        {/* Barre horizontale des 7 jours sur mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setMobileSelectedDay('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
              mobileSelectedDay === 'all'
                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                : 'glass-pill text-[var(--color-text-secondary)]'
            }`}
          >
            7 jours
          </button>
          {DAY_SHORT.map((shortLabel, idx) => {
            const hasMeals = mealPlans.some((mp) => mp.day === idx);
            const isSelected = mobileSelectedDay === idx;
            return (
              <button
                key={shortLabel}
                type="button"
                onClick={() => setMobileSelectedDay(idx)}
                className={`flex-1 min-w-[44px] py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all border ${
                  isSelected
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border-[var(--color-accent)]'
                    : 'glass-pill text-[var(--color-text-secondary)]'
                }`}
              >
                <span>{shortLabel}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasMeals ? 'bg-[var(--color-accent)]' : 'bg-white/15'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {mobileDaysToShow.map(({ day, idx: dayIndex }) => (
          <div key={`mobile-day-${dayIndex}`} className="flex flex-col gap-2.5">
            <h3 className="font-serif text-base font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border-light)] pb-1.5">
              {day}
            </h3>
            <div className="flex flex-col gap-2.5">
              {MEAL_TYPES.map(({ key, label }) => {
                const mealPlan = getMealPlan(dayIndex, key);
                const slotKey = `${dayIndex}-${key}`;
                const isRemoving = removingSlot === slotKey;

                return (
                  <div
                    key={slotKey}
                    className="relative w-full rounded-2xl glass-panel overflow-hidden flex flex-row h-[82px]"
                  >
                    {mealPlan ? (
                      <>
                        <Link
                          href={`/recipes/${mealPlan.recipe.id}`}
                          className="block relative h-full w-[82px] shrink-0 border-r border-[var(--color-border-light)]"
                        >
                          {mealPlan.recipe.image_url ? (
                            <Image
                              src={getImageSrc(mealPlan.recipe.image_url)}
                              alt={mealPlan.recipe.title}
                              fill
                              sizes="82px"
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
                            className="absolute inset-0 bg-gradient-to-br from-[#231b17] to-[#16110e] items-center justify-center text-[var(--color-text-muted)]"
                            style={{ display: mealPlan.recipe.image_url ? 'none' : 'flex' }}
                          >
                            <Utensils size={20} strokeWidth={1.4} />
                          </div>
                        </Link>

                        <div className="flex flex-col flex-1 p-3 px-3.5 justify-between min-w-0">
                          <div>
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--color-accent)]">
                              {label}
                            </span>
                            <Link href={`/recipes/${mealPlan.recipe.id}`} className="block">
                              <span className="block text-[13.5px] font-medium text-[var(--color-text-primary)] line-clamp-2 leading-tight mt-0.5">
                                {toSentenceCase(mealPlan.recipe.title)}
                              </span>
                            </Link>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemove(dayIndex, key);
                          }}
                          disabled={isRemoving}
                          aria-label={`Retirer ${mealPlan.recipe.title}`}
                          className="self-center mr-3 w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[var(--color-text-muted)] hover:text-red-400 disabled:opacity-40 transition-colors"
                        >
                          <X size={14} strokeWidth={1.8} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onSlotClick(dayIndex, key)}
                        className="w-full h-full flex items-center px-2 hover:bg-white/[0.04] transition-colors text-left"
                      >
                        <div className="w-[74px] shrink-0 h-full flex flex-col items-center justify-center border-r border-dashed border-[var(--color-border)] text-[var(--color-text-muted)]">
                          <Plus size={20} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 p-3 px-3.5">
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--color-text-muted)]">
                            {label}
                          </span>
                          <span className="block text-[13px] font-medium text-[var(--color-text-secondary)] mt-0.5">
                            Ajouter une recette
                          </span>
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
          <div className="grid grid-cols-8 gap-2.5">
            <div className="font-medium text-xs uppercase tracking-wider text-[var(--color-text-muted)]" />
            {DAYS.map((day, index) => (
              <div
                key={index}
                className="font-serif font-medium text-sm text-[var(--color-text-primary)] text-center p-2"
              >
                {day}
              </div>
            ))}

            {MEAL_TYPES.map(({ key, label }) => (
              <div key={`desktop-row-${key}`} className="contents">
                <div className="font-medium text-xs uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center pr-2">
                  {label}
                </div>
                {DAYS.map((_, dayIndex) => {
                  const mealPlan = getMealPlan(dayIndex, key);
                  const slotKey = `${dayIndex}-${key}`;
                  const isRemoving = removingSlot === slotKey;

                  return (
                    <div
                      key={`desktop-${slotKey}`}
                      className="min-h-[116px] rounded-2xl glass-panel overflow-hidden flex flex-col justify-between transition-all hover:border-[var(--color-border-hover)]"
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
                                        (img.nextElementSibling as HTMLElement).style.display =
                                          'flex';
                                      }
                                    }
                                  }}
                                />
                              ) : null}
                              <div
                                className="absolute inset-0 bg-gradient-to-br from-[#231b17] to-[#16110e] items-center justify-center text-[var(--color-text-muted)]"
                                style={{
                                  display: mealPlan.recipe.image_url ? 'none' : 'flex',
                                }}
                              >
                                <Utensils size={20} strokeWidth={1.4} />
                              </div>
                            </div>
                            <div className="p-2.5 flex flex-col">
                              <span className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">
                                {toSentenceCase(mealPlan.recipe.title)}
                              </span>
                            </div>
                          </Link>
                          <button
                            onClick={() => handleRemove(dayIndex, key)}
                            disabled={isRemoving}
                            className="mx-2.5 mb-2 text-[11px] text-[var(--color-text-muted)] hover:text-red-400 disabled:opacity-50 text-left transition-colors"
                            aria-label={`Retirer ${mealPlan.recipe.title}`}
                          >
                            {isRemoving ? 'Suppression...' : 'Retirer'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onSlotClick(dayIndex, key)}
                          className="w-full h-full min-h-[116px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-white/[0.03] transition-colors rounded-2xl"
                          aria-label={`Ajouter une recette pour ${label.toLowerCase()} ${DAYS[
                            dayIndex
                          ].toLowerCase()}`}
                        >
                          <Plus size={22} strokeWidth={1.5} />
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

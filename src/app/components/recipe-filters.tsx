'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Recipe } from '@/lib/schemas/recipe';
import type { Tag } from '@/lib/schemas/tag';
import { getImageSrc, getImageProxySrc } from '@/lib/utils/image';
import { toSentenceCase } from '@/lib/utils/text';

interface RecipeFiltersProps {
  recipes: Recipe[];
  recipeTagsMap: Map<string, Tag[]>;
}

export function RecipeFilters({ recipes, recipeTagsMap }: RecipeFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');

  const allTags = Array.from(
    new Set(
      Array.from(recipeTagsMap.values())
        .flat()
        .map(tag => JSON.stringify({ id: tag.id, name: tag.name }))
    )
  ).map(str => JSON.parse(str) as Tag);

  const toggleTagFilter = (tagId: string) => {
    if (selectedTagFilters.includes(tagId)) {
      setSelectedTagFilters(selectedTagFilters.filter(id => id !== tagId));
    } else {
      setSelectedTagFilters([...selectedTagFilters, tagId]);
    }
  };

  const filteredAndSortedRecipes = recipes
    .filter((recipe) => {
      if (selectedTagFilters.length > 0) {
        const recipeTags = recipeTagsMap.get(recipe.id) || [];
        if (!selectedTagFilters.every(tagId => recipeTags.some(tag => tag.id === tagId))) {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        recipe.title.toLowerCase().includes(query) ||
        recipe.ingredients.some((ing) => ing.text.toLowerCase().includes(query)) ||
        recipe.steps.some((step) => step.text.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        if (ratingA !== ratingB) return ratingB - ratingA;
        // Si même note, on trie par date
      }
      // Par défaut ou en cas d'égalité sur la note : les plus récentes d'abord
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            🔍
          </div>
          <input
            type="text"
            placeholder="Rechercher une recette..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-card)] text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(196,112,75,0.12)]"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">
              {recipes.length} recette{recipes.length > 1 ? 's' : ''}
            </p>
            <div className="h-4 w-px bg-[var(--color-border)] hidden sm:block"></div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
              className="text-[13px] bg-transparent font-medium text-[var(--color-text-primary)] focus:outline-none cursor-pointer hover:text-[var(--color-accent)] transition-colors"
            >
              <option value="recent">Plus récentes</option>
              <option value="rating">Mieux notées</option>
            </select>
          </div>
          
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <button
                onClick={() => setSelectedTagFilters([])}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  selectedTagFilters.length === 0
                    ? 'bg-[var(--color-accent)] text-white shadow-sm'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]'
                }`}
              >
                Toutes
              </button>
              
              {allTags.slice(0, showAllTags ? allTags.length : 3).map((tag) => {
                const isSelected = selectedTagFilters.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTagFilter(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                      isSelected
                        ? 'bg-[var(--color-accent)] text-white shadow-sm transform scale-105'
                        : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}

              {allTags.length > 3 && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium text-[var(--color-accent)] bg-[rgba(196,112,75,0.08)] hover:bg-[rgba(196,112,75,0.15)] transition-colors"
                >
                  {showAllTags ? (
                    <>Moins <span className="rotate-180 transform transition-transform text-[10px]">▼</span></>
                  ) : (
                    <>+ {allTags.length - 3} <span className="transition-transform text-[10px]">▼</span></>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {filteredAndSortedRecipes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-[var(--color-text-secondary)]">
            Aucune recette ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {filteredAndSortedRecipes.map((recipe) => {
            const tags = recipeTagsMap.get(recipe.id) || [];
            
            return (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="block bg-[var(--color-bg-card)] rounded-2xl overflow-hidden border border-[var(--color-border-light)] shadow-[0_1px_3px_rgba(44,24,16,0.06)] hover:shadow-[0_4px_12px_rgba(44,24,16,0.08)] hover:-translate-y-0.5 transition-all"
              >
                {recipe.image_url ? (
                  <div className="relative w-full h-44">
                    <Image
                      src={getImageSrc(recipe.image_url)}
                      alt={recipe.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-center"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (!img.dataset.nativeFallback) {
                          img.dataset.nativeFallback = '1';
                          img.src = recipe.image_url!;
                          img.srcset = '';
                          img.referrerPolicy = 'no-referrer';
                        } else {
                          if (img.parentElement) {
                            img.parentElement.style.display = 'none';
                            if (img.parentElement.nextElementSibling) {
                              (img.parentElement.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }
                        }
                      }}
                    />
                  </div>
                ) : null}
                <div className="w-full h-44 bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-border)] items-center justify-center text-[var(--color-text-muted)] text-4xl" style={{ display: recipe.image_url ? 'none' : 'flex' }}>
                  🍽️
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-[17px] font-serif font-semibold text-[var(--color-text-primary)] leading-tight line-clamp-2">
                      {toSentenceCase(recipe.title)}
                    </h2>
                    {recipe.rating ? (
                      <div className="flex items-center gap-0.5 text-yellow-400 shrink-0 bg-yellow-50 px-1.5 py-0.5 rounded-md border border-yellow-100">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 12 2" />
                        </svg>
                        <span className="text-[11px] font-bold text-yellow-700">{recipe.rating}</span>
                      </div>
                    ) : null}
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                    <span>{recipe.ingredients.length} ingrédients</span>
                    <span>•</span>
                    <span>{recipe.steps.length} étapes</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

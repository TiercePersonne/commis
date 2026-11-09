'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Shuffle,
  Utensils,
  Star,
  ChevronDown,
  X,
  ArrowUpDown,
} from 'lucide-react';

import type { Recipe } from '@/lib/schemas/recipe';
import type { Tag } from '@/lib/schemas/tag';
import { toSentenceCase } from '@/lib/utils/text';

interface RecipeFiltersProps {
  recipes: Recipe[];
  recipeTagsMap: Map<string, Tag[]>;
}

function RecipeCardImage({ src, alt }: { src: string | null | undefined; alt: string }) {
  const [failed, setFailed] = React.useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-44 bg-gradient-to-br from-[#251c17] to-[#18120f] flex items-center justify-center text-[var(--color-text-muted)]">
        <Utensils size={28} strokeWidth={1.4} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-44 overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80" />
    </div>
  );
}

export function RecipeFilters({ recipes, recipeTagsMap }: RecipeFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsStuck(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const allTags = Array.from(
    new Set(
      Array.from(recipeTagsMap.values())
        .flat()
        .map((tag) => JSON.stringify({ id: tag.id, name: tag.name }))
    )
  ).map((str) => JSON.parse(str) as Tag);

  const toggleTagFilter = (tagId: string) => {
    if (selectedTagFilters.includes(tagId)) {
      setSelectedTagFilters(selectedTagFilters.filter((id) => id !== tagId));
    } else {
      setSelectedTagFilters([...selectedTagFilters, tagId]);
    }
  };

  const filteredAndSortedRecipes = recipes
    .filter((recipe) => {
      if (selectedTagFilters.length > 0) {
        const recipeTags = recipeTagsMap.get(recipe.id) || [];
        if (!selectedTagFilters.every((tagId) => recipeTags.some((tag) => tag.id === tagId))) {
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
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleRandomRecipe = () => {
    if (filteredAndSortedRecipes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredAndSortedRecipes.length);
    const chosen = filteredAndSortedRecipes[randomIndex];
    if (chosen) {
      window.location.href = `/recipes/${chosen.id}`;
    }
  };

  return (
    <>
      {/* Editorial Minimalist Header */}
      <div className="mb-5 pt-1 flex items-end justify-between">
        <div>
          <span className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)] block mb-0.5">
            Bibliothèque
          </span>
          <h1 className="text-2xl md:text-3xl font-serif font-normal text-[var(--color-text-primary)] tracking-tight">
            Mes <span className="italic text-[var(--color-accent)]">recettes</span>
          </h1>
        </div>
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">
          {filteredAndSortedRecipes.length} recette{filteredAndSortedRecipes.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Frosted Glass Filter & Search Bar */}
      <div className="sticky top-18 z-30 mb-6 transition-all duration-300">
        <div
          className={`flex flex-col gap-3 p-3 md:p-4 rounded-3xl transition-all duration-300 ${
            isStuck ? 'glass-dock' : 'glass-panel'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
                <Search size={16} strokeWidth={1.6} />
              </div>
              <input
                type="text"
                placeholder="Rechercher une recette, un ingrédient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-9 py-2.5 rounded-2xl text-sm bg-white/[0.04] border border-[var(--color-border-light)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Effacer la recherche"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  <X size={15} strokeWidth={1.6} />
                </button>
              )}
            </div>

            {filteredAndSortedRecipes.length > 1 && (
              <button
                type="button"
                onClick={handleRandomRecipe}
                title="Tirer une recette au hasard"
                aria-label="Suggestion aléatoire"
                className="h-10 px-3.5 rounded-2xl glass-pill text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] flex items-center gap-1.5 shrink-0 transition-all"
              >
                <Shuffle size={15} strokeWidth={1.6} />
                <span className="hidden sm:inline">Idée</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2.5">
            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <ArrowUpDown size={13} strokeWidth={1.6} className="text-[var(--color-text-muted)]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
                className="text-xs bg-transparent font-medium text-[var(--color-text-secondary)] focus:outline-none cursor-pointer hover:text-[var(--color-text-primary)] transition-colors"
              >
                <option value="recent" className="bg-[#1c1613] text-[#f5efe8]">
                  Plus récentes
                </option>
                <option value="rating" className="bg-[#1c1613] text-[#f5efe8]">
                  Mieux notées
                </option>
              </select>
            </div>

            {/* Horizontal Scrollable Tag Pills */}
            {allTags.length > 0 && (
              <div
                className={`flex items-center gap-1.5 ${
                  showAllTags ? 'flex-wrap' : 'overflow-x-auto no-scrollbar'
                } sm:justify-end`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedTagFilters([])}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedTagFilters.length === 0
                      ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] shadow-sm'
                      : 'glass-pill text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Toutes
                </button>

                {allTags.slice(0, showAllTags ? allTags.length : 5).map((tag) => {
                  const isSelected = selectedTagFilters.includes(tag.id);
                  return (
                    <button
                      type="button"
                      key={tag.id}
                      onClick={() => toggleTagFilter(tag.id)}
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[var(--color-accent)] text-white shadow-sm'
                          : 'glass-pill text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/50'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}

                {allTags.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllTags(!showAllTags)}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent-soft)] hover:opacity-90 transition-opacity"
                  >
                    <span>{showAllTags ? 'Moins' : `+${allTags.length - 5}`}</span>
                    <ChevronDown
                      size={12}
                      strokeWidth={1.75}
                      className={`transition-transform ${showAllTags ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      {filteredAndSortedRecipes.length === 0 ? (
        <div className="glass-panel rounded-3xl text-center py-16 px-4">
          <p className="text-base text-[var(--color-text-secondary)]">
            Aucune recette ne correspond à votre recherche.
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4 sm:gap-5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
        >
          {filteredAndSortedRecipes.map((recipe) => {
            const tags = recipeTagsMap.get(recipe.id) || [];

            return (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group block glass-panel rounded-3xl overflow-hidden hover:border-[var(--color-accent)]/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative">
                  <RecipeCardImage src={recipe.image_url} alt={recipe.title} />

                  {recipe.rating ? (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md bg-black/45 border border-white/15 text-white">
                      <Star size={12} className="fill-amber-300 text-amber-300" />
                      <span className="text-xs font-medium">{recipe.rating}</span>
                    </div>
                  ) : null}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-base font-serif font-medium text-[var(--color-text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">
                      {toSentenceCase(recipe.title)}
                    </h2>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-normal glass-pill text-[var(--color-text-secondary)]"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
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

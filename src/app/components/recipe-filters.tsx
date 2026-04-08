'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Recipe } from '@/lib/schemas/recipe';
import type { Tag } from '@/lib/schemas/tag';
import { getImageSrc, getImageProxySrc } from '@/lib/utils/image';

interface RecipeFiltersProps {
  recipes: Recipe[];
  recipeTagsMap: Map<string, Tag[]>;
}

export function RecipeFilters({ recipes, recipeTagsMap }: RecipeFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);

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
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

        <div className="flex justify-between items-center">
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            {recipes.length} recette{recipes.length > 1 ? 's' : ''}
          </p>
          
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTagFilters([])}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                  selectedTagFilters.length === 0
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]'
                }`}
              >
                Toutes
              </button>
              {allTags.slice(0, 4).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTagFilter(tag.id)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                    selectedTagFilters.includes(tag.id)
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
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
                  <img
                    src={getImageSrc(recipe.image_url)}
                    alt={recipe.title}
                    className="w-full h-44 object-cover"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (!img.dataset.proxied) {
                        img.dataset.proxied = '1';
                        img.src = getImageProxySrc(recipe.image_url!);
                      } else {
                        img.style.display = 'none';
                        (img.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div className="w-full h-44 bg-gradient-to-br from-[var(--color-bg-primary)] to-[var(--color-border)] items-center justify-center text-[var(--color-text-muted)] text-4xl" style={{ display: recipe.image_url ? 'none' : 'flex' }}>
                  🍽️
                </div>
                
                <div className="p-4">
                  <h2 className="text-[17px] font-serif font-semibold text-[var(--color-text-primary)] mb-2 leading-tight">
                    {recipe.title}
                  </h2>
                  
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

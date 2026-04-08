'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getUserRecipesWithTags, type RecipeWithTags } from '@/app/actions/recipes';
import { RecipeFilters } from './recipe-filters';
import type { Tag } from '@/lib/schemas/tag';

interface InfiniteScrollProps {
  initialRecipes: RecipeWithTags[];
  initialRecipeTagsMap: Map<string, Tag[]>;
  initialHasMore: boolean;
}

export function InfiniteScroll({ 
  initialRecipes, 
  initialRecipeTagsMap,
  initialHasMore 
}: InfiniteScrollProps) {
  const [recipes, setRecipes] = useState<RecipeWithTags[]>(initialRecipes);
  const [recipeTagsMap, setRecipeTagsMap] = useState<Map<string, Tag[]>>(initialRecipeTagsMap);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const lastRecipe = recipes[recipes.length - 1];
    const cursor = {
      created_at: lastRecipe.created_at,
      id: lastRecipe.id,
    };

    // 1 seule requête pour les recettes ET leurs tags
    const { recipes: newRecipes, hasMore: moreAvailable } = await getUserRecipesWithTags(50, cursor);

    if (newRecipes && newRecipes.length > 0) {
      const newTagsMap = new Map(recipeTagsMap);
      for (const recipe of newRecipes) {
        newTagsMap.set(recipe.id, recipe.tags);
      }

      setRecipes([...recipes, ...newRecipes]);
      setRecipeTagsMap(newTagsMap);
      setHasMore(moreAvailable || false);
    } else {
      setHasMore(false);
    }

    setIsLoading(false);
  }, [hasMore, isLoading, recipeTagsMap, recipes]);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  return (
    <>
      <RecipeFilters recipes={recipes} recipeTagsMap={recipeTagsMap} />
      
      {hasMore && (
        <div ref={observerRef} className="h-20 flex items-center justify-center mt-6">
          {isLoading && <p className="text-sm text-[var(--color-text-secondary)]">Chargement...</p>}
        </div>
      )}
    </>
  );
}


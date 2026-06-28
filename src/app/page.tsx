import Link from 'next/link';
import { getUserRecipesWithTags } from '@/app/actions/recipes';
import { InfiniteScroll } from './components/infinite-scroll';
import { AppLayout } from './components/app-layout';
import type { Tag } from '@/lib/schemas/tag';

export default async function Home() {
  // 1 seule requête Supabase au lieu de 1 + N
  const { recipes, error, hasMore } = await getUserRecipesWithTags(50);

  const recipeTagsMap = new Map<string, Tag[]>();
  if (recipes) {
    for (const recipe of recipes) {
      recipeTagsMap.set(recipe.id, recipe.tags);
    }
  }

  return (
    <AppLayout>
      <div className="px-10 pb-10">

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
            {error}
          </div>
        )}

        {recipes && recipes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-[var(--color-text-secondary)] mb-6">
              Vous n&apos;avez pas encore de recettes.
            </p>
            <Link
              href="/recipes/new"
              className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] font-medium transition-colors"
            >
              Créer ma première recette
            </Link>
          </div>
        )}

        {recipes && recipes.length > 0 && (
          <InfiniteScroll 
            initialRecipes={recipes} 
            initialRecipeTagsMap={recipeTagsMap}
            initialHasMore={hasMore || false}
          />
        )}      </div>

      <a 
        href="https://paypal.me/GJCommis" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--color-bg-card)]/90 backdrop-blur-md border border-[var(--color-border-light)] text-xs text-[var(--color-text-secondary)] shadow-[0_8px_20px_-6px_rgba(44,24,16,0.15)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:shadow-[0_8px_20px_-6px_rgba(196,112,75,0.25)] hover:scale-105 transition-all duration-200"
      >
        <span>🚗</span>
        <span className="font-medium whitespace-nowrap">Buy me a <span className="line-through opacity-60">coffe</span> Lambo.</span>
      </a>
    </AppLayout>
  );
}


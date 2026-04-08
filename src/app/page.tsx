import Link from 'next/link';
import { getUserRecipes } from '@/app/actions/recipes';
import { getRecipeTags } from '@/app/actions/tags';
import { InfiniteScroll } from './components/infinite-scroll';
import { AppLayout } from './components/app-layout';
import type { Tag } from '@/lib/schemas/tag';

export default async function Home() {
  const { recipes, error, hasMore } = await getUserRecipes(50);

  const recipeTagsMap = new Map<string, Tag[]>();
  if (recipes) {
    await Promise.all(
      recipes.map(async (recipe) => {
        const { tags } = await getRecipeTags(recipe.id);
        if (tags) {
          recipeTagsMap.set(recipe.id, tags);
        }
      })
    );
  }

  return (
    <AppLayout>
      <div className="px-10 pb-10">
        <h1 className="text-[28px] font-serif font-bold text-[var(--color-text-primary)] pt-8 pb-2">
          Ma Collection
        </h1>

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
        )}
      </div>
    </AppLayout>
  );
}

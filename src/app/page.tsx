import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getUserRecipesWithTags } from '@/app/actions/recipes';
import { RecipeFilters } from './components/recipe-filters';
import { AppLayout } from './components/app-layout';
import type { Tag } from '@/lib/schemas/tag';

export default async function Home() {
  const { recipes, error } = await getUserRecipesWithTags();

  const recipeTagsMap = new Map<string, Tag[]>();
  if (recipes) {
    for (const recipe of recipes) {
      recipeTagsMap.set(recipe.id, recipe.tags);
    }
  }

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 md:px-10 pb-10 max-w-7xl mx-auto">
        {error && (
          <div className="p-4 glass-panel border-red-500/30 rounded-2xl text-red-300 mb-6 text-sm">
            {error}
          </div>
        )}

        {recipes && recipes.length === 0 && (
          <div className="glass-panel rounded-3xl text-center py-16 px-6 max-w-lg mx-auto mt-8">
            <p className="text-lg font-serif text-[var(--color-text-primary)] mb-2">
              Votre bibliothèque est vide
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Importez une recette depuis un lien ou créez votre première fiche manuellement.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/import"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-full hover:bg-[var(--accent-primary-hover)] text-xs font-medium transition-colors"
              >
                <Plus size={15} strokeWidth={1.75} />
                <span>Importer une recette</span>
              </Link>
              <Link
                href="/recipes/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 glass-pill rounded-full text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors"
              >
                <span>Créer manuellement</span>
              </Link>
            </div>
          </div>
        )}

        {recipes && recipes.length > 0 && (
          <RecipeFilters
            recipes={recipes}
            recipeTagsMap={recipeTagsMap}
          />
        )}
      </div>
    </AppLayout>
  );
}

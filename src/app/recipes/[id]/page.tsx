import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { RecipeImage } from '@/app/components/recipe-image';
import { getRecipe } from '@/app/actions/recipes';
import { getRecipeTags } from '@/app/actions/tags';
import { DeleteButton } from './delete-button';
import { AddToPlannerButton } from './add-to-planner-button';
import { RecipeTabs } from '@/app/components/recipe-tabs';
import { AppLayout } from '@/app/components/app-layout';
import { RecipeRating } from '@/app/components/recipe-rating';

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { recipe, error } = await getRecipe(id);

  if (error || !recipe) {
    notFound();
  }

  const { tags } = await getRecipeTags(id);
  const recipeParam = encodeURIComponent(JSON.stringify(recipe));

  return (
    <AppLayout>
      <div className="px-5 md:px-10 pb-10">
        <div className="max-w-3xl mx-auto pt-6 md:pt-8">
          <Link
            href="/"
            className="text-[var(--color-accent)] hover:underline mb-4 md:mb-6 inline-block text-sm"
          >
            ← Retour aux recettes
          </Link>

          {recipe.image_url ? (
            <RecipeImage
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-56 md:h-72 rounded-3xl object-cover object-center mb-4 md:mb-6"
              fallbackClassName="w-full h-56 md:h-72 rounded-3xl bg-gradient-to-br from-[#E8D5C4] to-[#D4B8A0] flex items-center justify-center text-[var(--color-text-muted)] text-5xl mb-4 md:mb-6"
            />
          ) : (
            <div className="w-full h-56 md:h-72 rounded-3xl bg-gradient-to-br from-[#E8D5C4] to-[#D4B8A0] flex items-center justify-center text-[var(--color-text-muted)] text-5xl mb-4 md:mb-6">
              🍽️
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl md:text-[32px] font-serif font-bold text-[var(--color-text-primary)] leading-tight">
                {recipe.title}
              </h1>
              <div className="shrink-0 pt-1">
                <RecipeRating recipeId={recipe.id} initialRating={recipe.rating} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <p className="text-[13px] text-[var(--color-text-muted)]">
                Créée le {new Date(recipe.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              {recipe.source_url && (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                >
                  <ExternalLink size={13} />
                  Voir la source originale
                </a>
              )}
            </div>
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-3 flex-wrap items-center">
              <AddToPlannerButton recipeId={id} recipeTitle={recipe.title} />
              <Link
                href={`/recipes/${id}/edit?recipe=${recipeParam}`}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--accent-primary-hover)] font-medium text-sm transition-colors"
              >
                Modifier
              </Link>
              <DeleteButton recipeId={id} />
            </div>
          </div>

          <RecipeTabs recipe={recipe} recipeId={id} />
        </div>
      </div>
    </AppLayout>
  );
}

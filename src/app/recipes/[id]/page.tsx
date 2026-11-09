import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Pencil, Utensils } from 'lucide-react';
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
      <div className="px-4 sm:px-6 md:px-10 pb-12">
        <div className="max-w-3xl mx-auto pt-4 md:pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full glass-pill text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-white/25 transition-all mb-4 md:mb-6"
          >
            <ArrowLeft size={14} strokeWidth={1.6} />
            <span>Retour aux recettes</span>
          </Link>

          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.45)] mb-6">
            {recipe.image_url ? (
              <RecipeImage
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-60 md:h-80 object-cover object-center"
                fallbackClassName="w-full h-60 md:h-80 bg-gradient-to-br from-[#231b17] to-[#16110e] flex items-center justify-center"
              />
            ) : (
              <div className="w-full h-60 md:h-80 bg-gradient-to-br from-[#231b17] to-[#16110e] flex items-center justify-center">
                <Utensils size={42} strokeWidth={1.3} className="text-[var(--color-text-muted)] opacity-60" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#130f0d] via-[#130f0d]/25 to-transparent pointer-events-none" />
          </div>

          <div className="mb-6">
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-block px-3 py-1 rounded-full text-[11px] font-medium glass-pill text-[var(--color-text-secondary)]"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl md:text-[34px] font-serif font-medium text-[var(--color-text-primary)] leading-tight tracking-[-0.02em]">
                {recipe.title}
              </h1>
              <div className="shrink-0 pt-1">
                <RecipeRating recipeId={recipe.id} initialRating={recipe.rating} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              <p className="text-[12.5px] text-[var(--color-text-muted)]">
                Créée le{' '}
                {new Date(recipe.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {recipe.source_url && (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                >
                  <ExternalLink size={13} strokeWidth={1.6} />
                  <span>Voir la source originale</span>
                </a>
              )}
            </div>

            <div className="flex gap-2.5 flex-wrap items-center">
              <AddToPlannerButton recipeId={id} recipeTitle={recipe.title} />
              <Link
                href={`/recipes/${id}/edit?recipe=${recipeParam}`}
                className="inline-flex items-center gap-1.5 justify-center px-4 py-2.5 glass-pill text-[var(--color-text-primary)] rounded-xl hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] font-medium text-xs sm:text-sm transition-all"
              >
                <Pencil size={14} strokeWidth={1.6} />
                <span>Modifier</span>
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

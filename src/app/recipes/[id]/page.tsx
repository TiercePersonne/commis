import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { getRecipe } from '@/app/actions/recipes';
import { getRecipeTags } from '@/app/actions/tags';
import { DeleteButton } from './delete-button';
import { AddToPlannerButton } from './add-to-planner-button';
import { IngredientList } from '@/app/components/ingredient-list';
import { RecipeNotes } from '@/app/components/recipe-notes';
import { AppLayout } from '@/app/components/app-layout';

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
      <div className="px-10 pb-10">
        <div className="max-w-3xl mx-auto pt-8">
          <Link
            href="/"
            className="text-[var(--color-accent)] hover:underline mb-6 inline-block text-sm"
          >
            ← Retour aux recettes
          </Link>

          <div className="w-full h-72 rounded-3xl bg-gradient-to-br from-[#E8D5C4] to-[#D4B8A0] flex items-center justify-center text-[var(--color-text-muted)] text-5xl mb-6">
            🍽️
          </div>

          <div className="mb-6">
            <h1 className="text-[32px] font-serif font-bold text-[var(--color-text-primary)] mb-2 leading-tight">
              {recipe.title}
            </h1>
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

          <IngredientList ingredients={recipe.ingredients} />

          <div className="mb-8">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-3 pb-2 border-b border-[var(--color-border)]">
              Préparation
            </h2>
            <ol className="space-y-0">
              {recipe.steps
                .sort((a, b) => a.order - b.order)
                .map((step, index) => (
                  <li key={index} className="relative pl-12 py-3.5 border-b border-[var(--color-border-light)] text-[15px] leading-relaxed">
                    <span className="absolute left-0 top-3.5 w-8 h-8 rounded-full bg-[var(--color-bg-primary)] text-[var(--color-accent)] flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </span>
                    {step.text}
                  </li>
                ))}
            </ol>
          </div>

          <RecipeNotes recipeId={id} initialNotes={recipe.notes || ''} />
        </div>
      </div>
    </AppLayout>
  );
}

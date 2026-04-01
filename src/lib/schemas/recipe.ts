import { z } from 'zod';

export const recipeItemSchema = z.object({
  text: z.string().min(1, 'Le texte ne peut pas être vide'),
  order: z.number().int().min(0),
});

export const createRecipeSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200, 'Le titre est trop long'),
  ingredients: z.array(recipeItemSchema).min(1, 'Au moins un ingrédient est requis'),
  steps: z.array(recipeItemSchema).min(1, 'Au moins une étape est requise'),
});

export type RecipeItem = z.infer<typeof recipeItemSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  ingredients: RecipeItem[];
  steps: RecipeItem[];
  notes: string;
  created_at: string;
  updated_at: string;
};

import { z } from 'zod';
import type { RecipeItem } from './recipe';

export const mealTypeSchema = z.enum(['lunch', 'dinner']);

export const addToSlotSchema = z.object({
  recipeId: z.string().uuid('ID de recette invalide'),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  day: z.number().int().min(0).max(6, 'Le jour doit être entre 0 (lundi) et 6 (dimanche)'),
  mealType: mealTypeSchema,
});

export type MealType = z.infer<typeof mealTypeSchema>;
export type AddToSlotInput = z.infer<typeof addToSlotSchema>;

export type MealPlan = {
  id: string;
  user_id: string;
  recipe_id: string;
  week_start: string;
  day: number;
  meal_type: MealType;
  created_at: string;
};

export type MealPlanWithRecipe = MealPlan & {
  recipe: {
    id: string;
    title: string;
    image_url?: string;
    ingredients?: RecipeItem[];
  };
};

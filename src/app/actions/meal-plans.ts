'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { addToSlotSchema, type MealPlanWithRecipe } from '@/lib/schemas/meal-plan';

export async function getMealPlan(weekStart: string): Promise<{
  mealPlans?: MealPlanWithRecipe[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('meal_plans')
    .select(`
      id,
      user_id,
      recipe_id,
      week_start,
      day,
      meal_type,
      created_at,
      recipe:recipes!inner (
        id,
        title,
        image_url
      )
    `)
    .eq('user_id', user.id)
    .eq('week_start', weekStart);

  if (error) {
    return { error: 'Erreur lors de la récupération du planning' };
  }

  const mealPlans = (data || []).map(item => ({
    ...item,
    recipe: Array.isArray(item.recipe) ? item.recipe[0] : item.recipe,
  })) as MealPlanWithRecipe[];

  return { mealPlans };
}

export async function addToSlot(
  recipeId: string,
  weekStart: string,
  day: number,
  mealType: 'lunch' | 'dinner'
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const validationResult = addToSlotSchema.safeParse({
    recipeId,
    weekStart,
    day,
    mealType,
  });

  if (!validationResult.success) {
    return { error: validationResult.error.issues[0].message };
  }

  const { error } = await supabase
    .from('meal_plans')
    .upsert({
      user_id: user.id,
      recipe_id: recipeId,
      week_start: weekStart,
      day,
      meal_type: mealType,
    }, {
      onConflict: 'user_id,week_start,day,meal_type',
    });

  if (error) {
    return { error: 'Erreur lors de l\'ajout de la recette au planning' };
  }

  revalidatePath('/planner');
  return { success: true };
}

export async function removeFromSlot(
  weekStart: string,
  day: number,
  mealType: 'lunch' | 'dinner'
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .eq('day', day)
    .eq('meal_type', mealType);

  if (error) {
    return { error: 'Erreur lors de la suppression de la recette du planning' };
  }

  revalidatePath('/planner');
  return { success: true };
}

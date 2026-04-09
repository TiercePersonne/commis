-- Optimize RLS performance by caching auth.uid() in a subquery
-- Resolves Auth RLS Initialization Plan lint warnings

-- recipes
ALTER POLICY "Users can view own recipes" ON recipes USING (user_id = (select auth.uid()));
ALTER POLICY "Users can create own recipes" ON recipes WITH CHECK (user_id = (select auth.uid()));
ALTER POLICY "Users can update own recipes" ON recipes USING (user_id = (select auth.uid()));
ALTER POLICY "Users can delete own recipes" ON recipes USING (user_id = (select auth.uid()));

-- tags
ALTER POLICY "Users can view own tags" ON tags USING (user_id = (select auth.uid()));
ALTER POLICY "Users can create own tags" ON tags WITH CHECK (user_id = (select auth.uid()));
ALTER POLICY "Users can update own tags" ON tags USING (user_id = (select auth.uid()));
ALTER POLICY "Users can delete own tags" ON tags USING (user_id = (select auth.uid()));

-- recipe_tags
ALTER POLICY "Users can view own recipe tags" ON recipe_tags USING (recipe_id IN (SELECT id FROM recipes WHERE user_id = (select auth.uid())));
ALTER POLICY "Users can create own recipe tags" ON recipe_tags WITH CHECK (recipe_id IN (SELECT id FROM recipes WHERE user_id = (select auth.uid())));
ALTER POLICY "Users can delete own recipe tags" ON recipe_tags USING (recipe_id IN (SELECT id FROM recipes WHERE user_id = (select auth.uid())));

-- meal_plans
ALTER POLICY "Users can view their own meal plans" ON meal_plans USING (user_id = (select auth.uid()));
ALTER POLICY "Users can insert their own meal plans" ON meal_plans WITH CHECK (user_id = (select auth.uid()));
ALTER POLICY "Users can update their own meal plans" ON meal_plans USING (user_id = (select auth.uid()));
ALTER POLICY "Users can delete their own meal plans" ON meal_plans USING (user_id = (select auth.uid()));

-- import_jobs (FOR ALL policy, so update both USING and WITH CHECK)
ALTER POLICY "Users can manage their own import jobs" ON import_jobs 
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- user_settings
ALTER POLICY "user_settings_select_own" ON user_settings USING (user_id = (select auth.uid()));
ALTER POLICY "user_settings_insert_own" ON user_settings WITH CHECK (user_id = (select auth.uid()));
ALTER POLICY "user_settings_update_own" ON user_settings USING (user_id = (select auth.uid()));
ALTER POLICY "user_settings_delete_own" ON user_settings USING (user_id = (select auth.uid()));

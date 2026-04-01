-- Create meal_plans table
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  day smallint NOT NULL CHECK (day >= 0 AND day <= 6),
  meal_type text NOT NULL CHECK (meal_type IN ('lunch', 'dinner')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start, day, meal_type)
);

-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own meal plans"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
  ON meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
  ON meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_meal_plans_user_week ON meal_plans(user_id, week_start);

-- Migration 010_recipe_rating.sql

ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating >= 0 AND rating <= 5) DEFAULT NULL;

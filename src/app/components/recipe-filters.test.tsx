import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeFilters } from './recipe-filters';
import type { Recipe } from '@/lib/schemas/recipe';
import type { Tag } from '@/lib/schemas/tag';

const mockRecipes: Recipe[] = [
  {
    id: '1',
    user_id: 'u1',
    title: 'Recette A',
    rating: 5,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '',
    ingredients: [],
    steps: [],
    notes: '',
  },
  {
    id: '2',
    user_id: 'u1',
    title: 'Recette B',
    rating: 2,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '',
    ingredients: [],
    steps: [],
    notes: '',
  },
  {
    id: '3',
    user_id: 'u1',
    title: 'Recette C',
    rating: 4,
    created_at: '2023-01-03T00:00:00Z',
    updated_at: '',
    ingredients: [],
    steps: [],
    notes: '',
  }
];

const mockTagsMap = new Map<string, Tag[]>();

describe('RecipeFilters sorting', () => {
  it('trie par défaut les plus récentes en premier', () => {
    render(<RecipeFilters recipes={mockRecipes} recipeTagsMap={mockTagsMap} />);
    const titles = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent);
    // Plus récente 2023-01-03 -> Recette C (devient Recette c par toSentenceCase)
    expect(titles).toEqual(['Recette c', 'Recette b', 'Recette a']);
  });

  it('peut trier par les mieux notées', () => {
    render(<RecipeFilters recipes={mockRecipes} recipeTagsMap={mockTagsMap} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'rating' } });
    
    const titles = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent);
    // Notes: A (5), C (4), B (2) -> Deviennent Recette a, Recette c, Recette b
    expect(titles).toEqual(['Recette a', 'Recette c', 'Recette b']);
  });

  it('filtre les recettes par recherche textuelle', () => {
    render(<RecipeFilters recipes={mockRecipes} recipeTagsMap={mockTagsMap} />);
    
    const searchInput = screen.getByPlaceholderText(/Rechercher une recette/i);
    fireEvent.change(searchInput, { target: { value: 'Recette A' } });
    
    const titles = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent);
    expect(titles).toEqual(['Recette a']);
    expect(titles).not.toContain('Recette B');
  });
});

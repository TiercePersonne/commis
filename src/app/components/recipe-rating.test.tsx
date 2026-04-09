import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeRating } from './recipe-rating';

// Mock de l'action serveur
vi.mock('@/app/actions/recipes', () => ({
  updateRecipeRating: vi.fn(() => Promise.resolve({}))
}));

describe('RecipeRating', () => {
  it('affiche 5 étoiles', () => {
    render(<RecipeRating recipeId="1" />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  it('affiche le nombre correct d\'étoiles pleines selon initialRating', () => {
    render(<RecipeRating recipeId="1" initialRating={3} />);
    const stars = screen.getAllByRole('button');
    // On vérifie la classe text-yellow-400 sur les 3 premières étoiles
    expect(stars[0].className).toContain('text-yellow-400');
    expect(stars[1].className).toContain('text-yellow-400');
    expect(stars[2].className).toContain('text-yellow-400');
    expect(stars[3].className).not.toContain('text-yellow-400');
  });

  it('change la note locale au clic', () => {
    render(<RecipeRating recipeId="1" initialRating={0} />);
    const stars = screen.getAllByRole('button');
    
    fireEvent.click(stars[3]); // 4ème étoile (index 3)
    
    // Après le clic, les 4 premières étoiles devraient être jaunes
    expect(stars[0].className).toContain('text-yellow-400');
    expect(stars[1].className).toContain('text-yellow-400');
    expect(stars[2].className).toContain('text-yellow-400');
    expect(stars[3].className).toContain('text-yellow-400');
  });

  it('désactive les étoiles en mode readOnly', () => {
    render(<RecipeRating recipeId="1" initialRating={3} readOnly={true} />);
    const stars = screen.getAllByRole('button');
    
    expect(stars[0]).toBeDisabled();
    
    fireEvent.click(stars[4]);
    // La note ne devrait pas changer
    expect(stars[4].className).not.toContain('text-yellow-400');
  });
});

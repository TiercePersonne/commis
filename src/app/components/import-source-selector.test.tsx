import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportSourceSelector } from './import-source-selector';

function getSubmitButton(container: HTMLElement) {
  return container.querySelector('button[type="submit"]') as HTMLElement;
}

describe('ImportSourceSelector', () => {
  it('affiche les trois cartes source', () => {
    render(<ImportSourceSelector />);
    expect(screen.getByText('Site Web')).toBeDefined();
    expect(screen.getByText('Texte')).toBeDefined();
    expect(screen.getByText('Reel Insta')).toBeDefined();
    expect(screen.getByText('En masse')).toBeDefined();
  });

  it('révèle le champ URL Reel quand on clique sur la carte Reel', () => {
    render(<ImportSourceSelector />);
    const reelCard = screen.getByRole('button', { name: /reel insta/i });
    fireEvent.click(reelCard);
    expect(screen.getByPlaceholderText(/instagram\.com\/reel/i)).toBeDefined();
  });

  it('révèle le champ URL quand on clique sur la carte Site web', () => {
    render(<ImportSourceSelector />);
    const webCard = screen.getByRole('button', { name: /site web/i });
    fireEvent.click(webCard);
    expect(screen.getByPlaceholderText(/marmiton\.org/)).toBeDefined();
  });

  it('affiche une erreur pour une URL invalide', () => {
    const { container } = render(<ImportSourceSelector />);
    const webCard = screen.getByRole('button', { name: /site web/i });
    fireEvent.click(webCard);

    const input = screen.getByPlaceholderText(/marmiton\.org/);
    fireEvent.change(input, { target: { value: 'pas-une-url' } });

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(screen.getByText(/URL invalide/i)).toBeDefined();
  });

  it("n'affiche pas d'erreur pour une URL valide", () => {
    const { container } = render(<ImportSourceSelector />);
    const webCard = screen.getByRole('button', { name: /site web/i });
    fireEvent.click(webCard);

    const input = screen.getByPlaceholderText(/marmiton\.org/);
    fireEvent.change(input, { target: { value: 'https://example.com/recette' } });

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(screen.queryByText(/URL invalide/i)).toBeNull();
  });

  it('permet de basculer entre les différents onglets', () => {
    render(<ImportSourceSelector />);
    
    // Par défaut 'Site Web' est sélectionné
    expect(screen.getByPlaceholderText(/marmiton\.org/)).toBeDefined();

    // Cliquer sur 'Texte'
    const textCard = screen.getByRole('button', { name: /texte/i });
    fireEvent.click(textCard);
    
    // Le champ URL doit disparaître, le champ texte doit apparaître
    expect(screen.queryByPlaceholderText(/marmiton\.org/)).toBeNull();
    expect(screen.getByPlaceholderText(/Exemple: 200g de farine/i)).toBeDefined();

    // Revenir sur 'Site Web'
    const webCard = screen.getByRole('button', { name: /site web/i });
    fireEvent.click(webCard);
    expect(screen.getByPlaceholderText(/marmiton\.org/)).toBeDefined();
  });
});

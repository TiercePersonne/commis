import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportSourceSelector } from './import-source-selector';

function getSubmitButton(container: HTMLElement) {
  return container.querySelector('button[type="submit"]') as HTMLElement;
}

describe('ImportSourceSelector', () => {
  it('affiche les deux cartes source', () => {
    render(<ImportSourceSelector />);
    expect(screen.getByText('Site web')).toBeDefined();
    expect(screen.getByText('Reel Instagram')).toBeDefined();
  });

  it('affiche le badge "Bientôt disponible" sur la carte Reel', () => {
    render(<ImportSourceSelector />);
    expect(screen.getByText('Bientôt disponible')).toBeDefined();
  });

  it('révèle le champ URL quand on clique sur la carte Site web', () => {
    render(<ImportSourceSelector />);
    const webCard = screen.getByRole('button', { name: /site web/i });
    fireEvent.click(webCard);
    expect(screen.getByPlaceholderText(/https:\/\/exemple/)).toBeDefined();
  });

  it('affiche une erreur pour une URL invalide', () => {
    const { container } = render(<ImportSourceSelector />);
    const webCard = screen.getByRole('button', { name: /site web/i });
    fireEvent.click(webCard);

    const input = screen.getByPlaceholderText(/https:\/\/exemple/);
    fireEvent.change(input, { target: { value: 'pas-une-url' } });

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(screen.getByText(/URL invalide/i)).toBeDefined();
  });

  it("n'affiche pas d'erreur pour une URL valide", () => {
    const { container } = render(<ImportSourceSelector />);
    const webCard = screen.getByRole('button', { name: /site web/i });
    fireEvent.click(webCard);

    const input = screen.getByPlaceholderText(/https:\/\/exemple/);
    fireEvent.change(input, { target: { value: 'https://example.com/recette' } });

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(screen.queryByText(/URL invalide/i)).toBeNull();
  });

  it('masque le champ URL quand on reclique sur la carte sélectionnée', () => {
    render(<ImportSourceSelector />);
    const webCard = screen.getByRole('button', { name: /site web/i });
    fireEvent.click(webCard);
    expect(screen.getByPlaceholderText(/https:\/\/exemple/)).toBeDefined();

    fireEvent.click(webCard);
    expect(screen.queryByPlaceholderText(/https:\/\/exemple/)).toBeNull();
  });
});

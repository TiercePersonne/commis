import { describe, it, expect, beforeEach } from 'vitest';
import { saveDraft, loadDraft, clearDraft } from './draft';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
});

describe('draft.ts', () => {
  it('saveDraft + loadDraft retourne le brouillon sauvegardé', () => {
    const draft = {
      title: 'Ma recette',
      ingredients: [{ text: '200g farine', order: 0 }],
      steps: [{ text: 'Mélanger', order: 0 }],
      confidence: 'complete' as const,
    };

    saveDraft(draft);
    const loaded = loadDraft();

    expect(loaded).not.toBeNull();
    expect(loaded!.title).toBe('Ma recette');
    expect(loaded!.ingredients).toHaveLength(1);
    expect(loaded!.steps).toHaveLength(1);
  });

  it('loadDraft retourne null si aucun brouillon', () => {
    expect(loadDraft()).toBeNull();
  });

  it('clearDraft supprime le brouillon', () => {
    saveDraft({ title: 'Test' });
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it('saveDraft écrase le brouillon précédent', () => {
    saveDraft({ title: 'Version 1' });
    saveDraft({ title: 'Version 2' });
    expect(loadDraft()!.title).toBe('Version 2');
  });

  it('loadDraft retourne null si le JSON est corrompu', () => {
    localStorageMock.setItem('commis_import_draft', 'not valid json {{{');
    expect(loadDraft()).toBeNull();
  });
});

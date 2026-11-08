import { describe, it, expect } from 'vitest';
import { buildTagPromptInstructions, normalizeTagName } from './tag-prompt';

describe('normalizeTagName', () => {
  it('normalise la casse, les espaces et les accents', () => {
    expect(normalizeTagName('  Pâtes  ')).toBe('pates');
    expect(normalizeTagName('Végétarien')).toBe('vegetarien');
    expect(normalizeTagName('Bœuf')).toBe('bœuf');
  });
});

describe('buildTagPromptInstructions', () => {
  it('inclut les tags existants quand ils sont fournis', () => {
    const prompt = buildTagPromptInstructions(['Poulet', 'Soupe', 'Asiatique']);
    expect(prompt).toContain('"Poulet"');
    expect(prompt).toContain('"Soupe"');
    expect(prompt).toContain('PRIORITÉ ABSOLUE');
  });

  it('indique qu’aucun tag n’existe quand la liste est vide', () => {
    const prompt = buildTagPromptInstructions([]);
    expect(prompt).toContain("L'utilisateur n'a pas encore de tags enregistrés");
  });
});

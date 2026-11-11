import { describe, it, expect } from 'vitest';
import { toSentenceCase, normalizeSearch } from './text';

describe('toSentenceCase', () => {
  it('met la première lettre en majuscule et le reste en minuscule', () => {
    expect(toSentenceCase('POULET RÔTI')).toBe('Poulet rôti');
    expect(toSentenceCase('poulet rôti')).toBe('Poulet rôti');
    expect(toSentenceCase('Poulet Rôti')).toBe('Poulet rôti');
  });

  it('gère les chaînes vides', () => {
    expect(toSentenceCase('')).toBe('');
  });

  it('gère les chaînes d\'un seul caractère', () => {
    expect(toSentenceCase('a')).toBe('A');
    expect(toSentenceCase('A')).toBe('A');
  });

  it('gère les caractères spéciaux au début', () => {
    expect(toSentenceCase('!poulet')).toBe('!poulet');
  });
});

describe('normalizeSearch', () => {
  it('retire les accents, les ligatures et passe en minuscule', () => {
    expect(normalizeSearch('Crêpe à la pâte d\'amande')).toBe("crepe a la pate d'amande");
    expect(normalizeSearch('ÉCHALOTE & BŒUF')).toBe('echalote & boeuf');
  });

  it('gère les espaces superflus', () => {
    expect(normalizeSearch('  Poulet rôti  ')).toBe('poulet roti');
  });

  it('gère les chaînes vides', () => {
    expect(normalizeSearch('')).toBe('');
  });
});

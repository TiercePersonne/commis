import { describe, it, expect } from 'vitest';
import { toSentenceCase } from './text';

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

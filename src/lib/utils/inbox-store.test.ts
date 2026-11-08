import { describe, it, expect, beforeEach } from 'vitest';
import { extractFirstUrl, createInboxToken, verifyInboxToken } from './inbox-store';

describe('extractFirstUrl', () => {
  it('extrait une URL Instagram propre depuis un texte de partage', () => {
    const shared =
      'Regarde cette recette trop bonne : https://www.instagram.com/reel/C9xYz123/?igsh=abc123 !';
    expect(extractFirstUrl(shared)).toBe(
      'https://www.instagram.com/reel/C9xYz123/?igsh=abc123'
    );
  });

  it('retourne null si aucune URL http(s)', () => {
    expect(extractFirstUrl('Juste du texte sans lien')).toBeNull();
    expect(extractFirstUrl(null)).toBeNull();
  });
});

describe('createInboxToken / verifyInboxToken', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_SECRET = 'test-secret-for-unit-tests-32-chars';
  });

  it('chiffre et déchiffre correctement un userId', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const token = createInboxToken(userId);
    expect(verifyInboxToken(token)).toBe(userId);
  });

  it('retourne null pour un token invalide', () => {
    expect(verifyInboxToken('invalid-token')).toBeNull();
  });
});

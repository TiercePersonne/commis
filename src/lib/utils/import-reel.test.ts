import { describe, it, expect } from 'vitest';
import { isInstagramReelUrl } from './import-reel';

describe('isInstagramReelUrl', () => {
  it('reconnaît un lien /reel/', () => {
    expect(isInstagramReelUrl('https://www.instagram.com/reel/ABC123/')).toBe(true);
  });

  it('reconnaît un lien /reels/', () => {
    expect(isInstagramReelUrl('https://www.instagram.com/reels/ABC123/')).toBe(true);
  });

  it('reconnaît un lien /p/ (post)', () => {
    expect(isInstagramReelUrl('https://www.instagram.com/p/ABC123/')).toBe(true);
  });

  it('reconnaît sans www', () => {
    expect(isInstagramReelUrl('https://instagram.com/reel/ABC123/')).toBe(true);
  });

  it('rejette un lien non-Instagram', () => {
    expect(isInstagramReelUrl('https://www.tiktok.com/@user/video/123')).toBe(false);
  });

  it('rejette un profil Instagram (pas un reel)', () => {
    expect(isInstagramReelUrl('https://www.instagram.com/someuser/')).toBe(false);
  });

  it('rejette une URL invalide', () => {
    expect(isInstagramReelUrl('pas-une-url')).toBe(false);
  });

  it('rejette une chaîne vide', () => {
    expect(isInstagramReelUrl('')).toBe(false);
  });
});

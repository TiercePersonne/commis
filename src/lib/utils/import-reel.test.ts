import { describe, it, expect } from 'vitest';
import { isSupportedVideoUrl } from './import-reel';

describe('isSupportedVideoUrl', () => {
  it('reconnaît un lien /reel/', () => {
    expect(isSupportedVideoUrl('https://www.instagram.com/reel/ABC123/')).toBe(true);
  });

  it('reconnaît un lien /reels/', () => {
    expect(isSupportedVideoUrl('https://www.instagram.com/reels/ABC123/')).toBe(true);
  });

  it('reconnaît un lien /p/ (post)', () => {
    expect(isSupportedVideoUrl('https://www.instagram.com/p/ABC123/')).toBe(true);
  });

  it('reconnaît sans www', () => {
    expect(isSupportedVideoUrl('https://instagram.com/reel/ABC123/')).toBe(true);
  });

  it('reconnaît un lien tiktok.com classique', () => {
    expect(isSupportedVideoUrl('https://www.tiktok.com/@user/video/123456')).toBe(true);
  });

  it('reconnaît un lien de partage tiktok', () => {
    expect(isSupportedVideoUrl('https://vm.tiktok.com/ZMxxxxxx/')).toBe(true);
    expect(isSupportedVideoUrl('https://vt.tiktok.com/ZSxxxxxx/')).toBe(true);
  });

  it('reconnaît un lien youtube classique', () => {
    expect(isSupportedVideoUrl('https://www.youtube.com/watch?v=123456')).toBe(true);
  });

  it('reconnaît un youtube short', () => {
    expect(isSupportedVideoUrl('https://www.youtube.com/shorts/123456')).toBe(true);
  });

  it('reconnaît un lien youtu.be', () => {
    expect(isSupportedVideoUrl('https://youtu.be/123456')).toBe(true);
  });

  it('rejette un profil Instagram (pas un reel)', () => {
    expect(isSupportedVideoUrl('https://www.instagram.com/someuser/')).toBe(false);
  });

  it('rejette une URL invalide', () => {
    expect(isSupportedVideoUrl('pas-une-url')).toBe(false);
  });

  it('rejette une chaîne vide', () => {
    expect(isSupportedVideoUrl('')).toBe(false);
  });
});


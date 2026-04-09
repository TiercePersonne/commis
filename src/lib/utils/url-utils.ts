const INSTAGRAM_HOST_REGEX = /^(www\.)?instagram\.com$/i;
const INSTAGRAM_PATH_REGEX = /^\/(reel|reels|p)\//i;
const TIKTOK_HOST_REGEX = /^(www\.|vm\.|vt\.)?tiktok\.com$/i;
const YOUTUBE_HOST_REGEX = /^(www\.)?(youtube\.com|youtu\.be)$/i;

export function isSupportedVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const isInstagram = INSTAGRAM_HOST_REGEX.test(parsed.hostname) && INSTAGRAM_PATH_REGEX.test(parsed.pathname);
    const isTikTok = TIKTOK_HOST_REGEX.test(parsed.hostname);
    const isYouTube = YOUTUBE_HOST_REGEX.test(parsed.hostname);
    
    return isInstagram || isTikTok || isYouTube;
  } catch {
    return false;
  }
}

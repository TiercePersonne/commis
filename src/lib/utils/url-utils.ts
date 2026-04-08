const INSTAGRAM_HOST_REGEX = /^(www\.)?instagram\.com$/i;
const INSTAGRAM_PATH_REGEX = /^\/(reel|reels|p)\//i;

export function isInstagramReelUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      INSTAGRAM_HOST_REGEX.test(parsed.hostname) &&
      INSTAGRAM_PATH_REGEX.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

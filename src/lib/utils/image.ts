export function getImageSrc(imageUrl: string): string {
  return imageUrl;
}

export function getImageProxySrc(imageUrl: string): string {
  return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
}

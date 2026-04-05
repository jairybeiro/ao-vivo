/**
 * Check if a URL is a valid playable stream (HLS or MP4).
 */
export const isStreamUrl = (url: string): boolean => {
  if (!url || url.trim() === "" || url === "placeholder") return false;
  const lower = url.toLowerCase();
  return lower.includes(".m3u8") || lower.includes(".m3u") || lower.includes(".mp4");
};

/**
 * Check if a URL is specifically an HLS manifest (m3u8/m3u only, NOT mp4).
 */
export const isHlsUrl = (url: string): boolean => {
  if (!url || url.trim() === "" || url === "placeholder") return false;
  const lower = url.toLowerCase();
  return lower.includes(".m3u8") || lower.includes(".m3u");
};

/**
 * Find the first playable stream URL from an array.
 */
export const findHlsUrl = (urls: string[] | undefined | null): string | undefined => {
  return urls?.find(isStreamUrl);
};

/**
 * Check if an array of URLs contains at least one valid stream.
 */
export const hasValidStreamUrls = (urls: string[]): boolean => {
  return urls.some(isStreamUrl);
};

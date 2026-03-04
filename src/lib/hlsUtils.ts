/**
 * Check if a URL is a valid HLS stream.
 * Supports .m3u8, .m3u, and .txt extensions (with or without query params).
 */
export const isHlsUrl = (url: string): boolean => {
  if (!url || url.trim() === "" || url === "placeholder") return false;
  const lower = url.toLowerCase();
  return (
    lower.includes(".m3u8") ||
    lower.includes(".m3u") ||
    lower.includes(".txt")
  );
};

/**
 * Find the first HLS-compatible URL from an array of stream URLs.
 */
export const findHlsUrl = (urls: string[] | undefined | null): string | undefined => {
  return urls?.find(isHlsUrl);
};

/**
 * Check if an array of URLs contains at least one valid HLS stream.
 */
export const hasValidStreamUrls = (urls: string[]): boolean => {
  return urls.some(isHlsUrl);
};

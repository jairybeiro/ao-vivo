/**
 * Proxy utility — ensures stream URLs use HTTPS to avoid mixed-content blocks.
 */
export const toProxyStreamUrl = (url: string): string => {
  if (!url) return url;
  // Convert http:// to https:// to prevent mixed-content issues on HTTPS sites
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

export const createMediaProxyUrl = (url: string): string => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${baseUrl}/functions/v1/media-proxy?url=${encodeURIComponent(url)}`;
};

export const createTransportPlaylistUrl = (url: string): string => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${baseUrl}/functions/v1/media-proxy?url=${encodeURIComponent(url)}&format=m3u8`;
};

export const toProxyAssetUrl = (url: string | null): string | null => {
  if (!url) return url;
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

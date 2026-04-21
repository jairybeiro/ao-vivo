/**
 * URL helpers — força HTTPS para evitar mixed-content em contextos HTTPS.
 * Sem proxy de mídia: a Edge Function `resolve-stream-url` já segue redirects
 * e devolve o link final do CDN diretamente.
 */
export const toProxyStreamUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

export const toProxyAssetUrl = (url: string | null): string | null => {
  if (!url) return url;
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

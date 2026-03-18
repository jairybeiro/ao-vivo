const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const FORCE_PROXY_DOMAINS = ["ipsmart.icu", "embedtv", "embedtvonline", "cdn2embedtv"];
const PROXY_PATH = "/functions/v1/proxy-stream";

const isProxyUrl = (url: string): boolean => {
  return url.includes(PROXY_PATH);
};

const shouldForceProxy = (url: string): boolean => {
  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.toLowerCase();

    return (
      parsed.protocol === "http:" ||
      FORCE_PROXY_DOMAINS.some((domain) => hostname.includes(domain))
    );
  } catch {
    return false;
  }
};

const buildProxyUrl = (url: string): string => {
  if (!SUPABASE_URL) return url;
  return `${SUPABASE_URL}${PROXY_PATH}?url=${encodeURIComponent(url)}`;
};

export const toProxyStreamUrl = (url: string): string => {
  const normalizedUrl = url.trim();

  if (!normalizedUrl || normalizedUrl === "placeholder") return normalizedUrl;
  if (isProxyUrl(normalizedUrl)) return normalizedUrl;

  return shouldForceProxy(normalizedUrl)
    ? buildProxyUrl(normalizedUrl)
    : normalizedUrl;
};

export const toProxyEmbedUrl = (url: string): string => {
  if (!url || !SUPABASE_URL) return url;
  const normalizedUrl = url.trim();
  if (!normalizedUrl) return normalizedUrl;
  if (isProxyUrl(normalizedUrl)) return normalizedUrl;
  return buildProxyUrl(normalizedUrl);
};

export const toProxyAssetUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  const normalizedUrl = url.trim();
  if (!normalizedUrl) return null;
  if (isProxyUrl(normalizedUrl)) return normalizedUrl;

  return shouldForceProxy(normalizedUrl)
    ? buildProxyUrl(normalizedUrl)
    : normalizedUrl;
};
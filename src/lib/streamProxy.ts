const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const FORCE_PROXY_DOMAINS = ["ipsmart.icu", "embedtv", "embedtvonline", "cdn2embedtv"];

const isProxyUrl = (url: string): boolean => {
  return url.includes("/functions/v1/proxy-stream");
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
  return `${SUPABASE_URL}/functions/v1/proxy-stream?url=${encodeURIComponent(url)}`;
};

export const toProxyStreamUrl = (url: string): string => {
  const normalizedUrl = url.trim();

  if (!normalizedUrl || normalizedUrl === "placeholder") return normalizedUrl;
  if (isProxyUrl(normalizedUrl)) return normalizedUrl;

  if (shouldForceProxy(normalizedUrl)) {
    return buildProxyUrl(normalizedUrl);
  }

  return normalizedUrl;
};

export const toProxyAssetUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  const normalizedUrl = url.trim();
  if (!normalizedUrl) return null;
  if (isProxyUrl(normalizedUrl)) return normalizedUrl;

  try {
    const parsed = new URL(normalizedUrl);
    if (parsed.protocol === "http:") {
      return buildProxyUrl(normalizedUrl);
    }
  } catch {
    return normalizedUrl;
  }

  return normalizedUrl;
};

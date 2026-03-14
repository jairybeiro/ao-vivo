import type { ResolvedSource, SourceType } from "./types";
import { log, warn } from "./utils";

const HLS_EXTENSIONS = [".m3u8", ".m3u"];
const TXT_EXTENSIONS = [".txt"];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Domains that require proxied requests (block direct browser access via Referer check) */
const PROXY_DOMAINS = ["embedtv", "embedtvonline", "cdn2embedtv"];

/** Check if URL is plain HTTP (needs proxy to avoid mixed content) */
const isInsecureHttp = (url: string): boolean => {
  try {
    return new URL(url).protocol === 'http:';
  } catch {
    return false;
  }
};

const detectSourceType = (url: string): SourceType => {
  const lower = url.toLowerCase().split("?")[0].split("#")[0];

  if (HLS_EXTENSIONS.some((ext) => lower.includes(ext))) return "hls";
  if (TXT_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "txt";

  if (
    lower.includes("embed") ||
    lower.includes("player") ||
    lower.includes("iframe")
  ) {
    return "embed";
  }

  return "unknown";
};

/**
 * Resolve a .txt URL via edge function proxy to avoid CORS.
 * Returns the actual HLS URL contained in the .txt file.
 */
const resolveTxtViaProxy = async (url: string): Promise<string | null> => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    warn("SourceResolver: missing Supabase config for TXT resolution");
    return null;
  }

  try {
    log("SourceResolver: resolving TXT via proxy:", url);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/resolve-txt-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      warn("SourceResolver: proxy returned", response.status);
      return null;
    }

    const data = await response.json();
    if (data.success && data.streamUrl) {
      log("SourceResolver: TXT resolved to:", data.streamUrl);
      return data.streamUrl;
    }

    return null;
  } catch (err) {
    warn("SourceResolver: proxy error:", err);
    return null;
  }
};

/**
 * Check if a URL needs to be proxied (domain blocks direct browser requests).
 */
const needsProxy = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    // Proxy if domain is blocked OR if URL is plain HTTP (mixed content)
    return PROXY_DOMAINS.some(d => hostname.includes(d)) || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

/**
 * Build a proxied URL that goes through our proxy-stream edge function.
 */
const buildProxyUrl = (url: string): string => {
  return `${SUPABASE_URL}/functions/v1/proxy-stream?url=${encodeURIComponent(url)}`;
};

/**
 * Resolve a source URL to a playable format.
 * For .txt files, fetches the actual HLS URL via server proxy.
 * For blocked domains, routes through proxy-stream edge function.
 */
export const resolveSource = async (url: string): Promise<ResolvedSource> => {
  const type = detectSourceType(url);
  log("SourceResolver: type detected:", type, "for:", url);

  if (type === "txt") {
    const resolved = await resolveTxtViaProxy(url);
    if (resolved && resolved !== url) {
      // Check if the resolved URL also needs proxying
      if (needsProxy(resolved)) {
        const proxied = buildProxyUrl(resolved);
        log("SourceResolver: TXT resolved + proxied:", proxied);
        return { type: "hls", resolvedUrl: proxied, originalUrl: url };
      }
      return { type: "hls", resolvedUrl: resolved, originalUrl: url };
    }
    return { type: "hls", resolvedUrl: url, originalUrl: url };
  }

  // For any URL that needs proxying (blocked domain or HTTP), route through proxy
  if (needsProxy(url)) {
    const proxied = buildProxyUrl(url);
    log("SourceResolver: proxying:", proxied);
    return { type: type === "unknown" ? "hls" : type, resolvedUrl: proxied, originalUrl: url };
  }

  return { type, resolvedUrl: url, originalUrl: url };
};

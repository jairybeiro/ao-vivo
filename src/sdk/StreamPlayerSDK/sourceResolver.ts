import type { ResolvedSource, SourceType } from "./types";
import { log, warn } from "./utils";

const HLS_EXTENSIONS = [".m3u8", ".m3u"];
const TXT_EXTENSIONS = [".txt"];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Domains that require proxied requests (block direct browser access via Referer check) */
const PROXY_DOMAINS = ["embedtv", "embedtvonline", "cdn2embedtv"];

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
 * Resolve a source URL to a playable format.
 * For .txt files, fetches the actual HLS URL via server proxy.
 */
export const resolveSource = async (url: string): Promise<ResolvedSource> => {
  const type = detectSourceType(url);
  log("SourceResolver: type detected:", type, "for:", url);

  if (type === "txt") {
    const resolved = await resolveTxtViaProxy(url);
    if (resolved && resolved !== url) {
      return { type: "hls", resolvedUrl: resolved, originalUrl: url };
    }
    // Fallback: pass .txt URL directly to HLS.js (some servers serve it as playlist)
    return { type: "hls", resolvedUrl: url, originalUrl: url };
  }

  return { type, resolvedUrl: url, originalUrl: url };
};

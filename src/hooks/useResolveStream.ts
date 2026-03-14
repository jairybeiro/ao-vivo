import { useState, useEffect } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Domains that require proxied requests */
const PROXY_DOMAINS = ["embedtv", "embedtvonline", "cdn2embedtv"];

const needsProxy = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return PROXY_DOMAINS.some(d => hostname.includes(d));
  } catch {
    return false;
  }
};

const buildProxyUrl = (url: string): string => {
  return `${SUPABASE_URL}/functions/v1/proxy-stream?url=${encodeURIComponent(url)}`;
};

interface ResolveResult {
  resolvedUrl: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Validates a resolved URL by attempting a HEAD request.
 * Returns true if the URL is reachable.
 */
const validateUrl = async (url: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(url, { 
      method: 'HEAD', 
      mode: 'no-cors',
      signal: controller.signal 
    });
    clearTimeout(timeout);
    // no-cors returns opaque response (status 0), which means network is reachable
    return true;
  } catch {
    return false;
  }
};

/**
 * Hook that resolves a stream URL from an embed page via the resolve-stream edge function.
 * Validates the resolved URL and falls back if DNS/network fails.
 */
export const useResolveStream = (embedUrl: string | null | undefined, fallbackUrls: string[]): ResolveResult & { finalStreamUrls: string[] } => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!embedUrl?.trim()) {
      setResolvedUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/resolve-stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ url: embedUrl }),
        });

        if (!response.ok) {
          throw new Error(`Resolver returned ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) {
          if (data.success && data.streamUrl) {
            console.log("[useResolveStream] Resolved:", data.streamUrl);
            
            // Validate the resolved URL is reachable
            const isValid = await validateUrl(data.streamUrl);
            
            if (isValid) {
              console.log("[useResolveStream] URL validated successfully");
              setResolvedUrl(data.streamUrl);
            } else {
              // Try allUrls if available
              let foundValid = false;
              if (data.allUrls && Array.isArray(data.allUrls)) {
                for (const altUrl of data.allUrls) {
                  if (altUrl !== data.streamUrl) {
                    const altValid = await validateUrl(altUrl);
                    if (altValid) {
                      console.log("[useResolveStream] Alternative URL valid:", altUrl);
                      setResolvedUrl(altUrl);
                      foundValid = true;
                      break;
                    }
                  }
                }
              }
              
              if (!foundValid) {
                console.warn("[useResolveStream] Resolved URL unreachable, falling back to embed");
                setError("Resolved URL unreachable");
                setResolvedUrl(null);
              }
            }
          } else {
            console.warn("[useResolveStream] No stream found, using fallback");
            setError(data.error || "No stream URL found");
            setResolvedUrl(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[useResolveStream] Error:", err);
          setError(err instanceof Error ? err.message : "Resolution failed");
          setResolvedUrl(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [embedUrl]);

  // Build final stream URLs: resolved URL first, then existing fallbacks
  const finalStreamUrls = resolvedUrl
    ? [resolvedUrl, ...fallbackUrls.filter(u => u !== resolvedUrl)]
    : fallbackUrls;

  return { resolvedUrl, loading, error, finalStreamUrls };
};

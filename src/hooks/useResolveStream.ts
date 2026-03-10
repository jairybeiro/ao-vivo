import { useState, useEffect } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ResolveResult {
  resolvedUrl: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook that resolves a stream URL from an embed page via the resolve-stream edge function.
 * If embedUrl is provided, it fetches the real stream URL server-side.
 * Falls back to the provided fallbackUrl if resolution fails.
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
            setResolvedUrl(data.streamUrl);
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

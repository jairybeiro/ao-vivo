import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toProxyStreamUrl } from "@/lib/streamProxy";

const ACTIVATION_HOSTS = new Set([
  "ipsmart.icu",
  "vaicairmaisnao.xyz",
  "smarters.sbs",
  "elitedns.sbs",
]);
const resolvedUrlCache = new Map<string, string>();

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
};

export const shouldResolveStreamUrl = (url?: string | null) => {
  if (!url) return false;

  const hostname = getHostname(url);
  return hostname ? ACTIVATION_HOSTS.has(hostname) : false;
};

export const resolvePlayableStreamUrl = async (sourceUrl: string) => {
  const fallbackUrl = toProxyStreamUrl(sourceUrl);

  if (!shouldResolveStreamUrl(sourceUrl)) {
    return fallbackUrl;
  }

  const cachedUrl = resolvedUrlCache.get(sourceUrl);
  if (cachedUrl) {
    return cachedUrl;
  }

  try {
    const { data, error } = await supabase.functions.invoke("resolve-stream-url", {
      body: { url: sourceUrl },
    });

    if (error) throw error;

    const resolvedUrl = typeof data?.resolvedUrl === "string" && data.resolvedUrl
      ? data.resolvedUrl
      : fallbackUrl;

    resolvedUrlCache.set(sourceUrl, resolvedUrl);
    return resolvedUrl;
  } catch (error) {
    console.error("Erro ao resolver a URL final do stream:", error);
    return fallbackUrl;
  }
};

export const useResolvedStreamUrl = (sourceUrl?: string | null) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!sourceUrl) {
      setResolvedUrl(null);
      setIsResolving(false);
      return;
    }

    if (!shouldResolveStreamUrl(sourceUrl)) {
      setResolvedUrl(toProxyStreamUrl(sourceUrl));
      setIsResolving(false);
      return;
    }

    // Check cache first
    const cached = resolvedUrlCache.get(sourceUrl);
    if (cached) {
      setResolvedUrl(cached);
      setIsResolving(false);
      return;
    }

    setResolvedUrl(null);
    setIsResolving(true);

    void resolvePlayableStreamUrl(sourceUrl)
      .then((nextUrl) => {
        if (isActive) {
          setResolvedUrl(nextUrl);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsResolving(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [sourceUrl]);

  return {
    resolvedUrl,
    isResolving,
  };
};
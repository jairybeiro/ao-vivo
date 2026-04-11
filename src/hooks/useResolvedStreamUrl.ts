import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toProxyStreamUrl } from "@/lib/streamProxy";

const ACTIVATION_HOSTS = new Set(["ipsmart.icu", "vaicairmaisnao.xyz"]);
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
  const requiresResolution = Boolean(sourceUrl && shouldResolveStreamUrl(sourceUrl));
  const [resolvedFor, setResolvedFor] = useState<string | null>(sourceUrl ?? null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(() => {
    if (!sourceUrl) return null;
    return shouldResolveStreamUrl(sourceUrl) ? null : toProxyStreamUrl(sourceUrl);
  });
  const [isResolving, setIsResolving] = useState(() => Boolean(sourceUrl && shouldResolveStreamUrl(sourceUrl)));

  const cachedResolvedUrl = sourceUrl ? resolvedUrlCache.get(sourceUrl) ?? null : null;
  const safeResolvedUrl = sourceUrl
    ? requiresResolution
      ? cachedResolvedUrl ?? (resolvedFor === sourceUrl ? resolvedUrl : null)
      : toProxyStreamUrl(sourceUrl)
    : null;

  useEffect(() => {
    let isActive = true;

    if (!sourceUrl) {
      setResolvedUrl(null);
      setIsResolving(false);
      return;
    }

    if (!shouldResolveStreamUrl(sourceUrl)) {
      setResolvedFor(sourceUrl);
      setResolvedUrl(toProxyStreamUrl(sourceUrl));
      setIsResolving(false);
      return;
    }

    setResolvedFor(sourceUrl);
    setResolvedUrl(null);
    setIsResolving(true);

    void resolvePlayableStreamUrl(sourceUrl)
      .then((nextUrl) => {
        if (isActive) {
          setResolvedFor(sourceUrl);
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
    resolvedUrl: safeResolvedUrl,
    isResolving: requiresResolution ? isResolving && !cachedResolvedUrl : false,
  };
};
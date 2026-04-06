import { isStreamUrl } from "@/lib/hlsUtils";

const YOUTUBE_HOST_PATTERN = /(^|\.)(youtube\.com|youtube-nocookie\.com)$/i;

const normalizeUrl = (url?: string | null) => {
  const trimmed = url?.trim();
  return trimmed ? trimmed : null;
};

const normalizeHost = (host: string) => host.replace(/^www\./i, "").toLowerCase();

export const isYouTubeUrl = (url?: string | null): boolean => {
  const normalized = normalizeUrl(url);

  if (!normalized) return false;
  if (/^[a-zA-Z0-9_-]{11}$/.test(normalized)) return true;

  try {
    const parsed = new URL(normalized);
    const host = normalizeHost(parsed.hostname);

    return host === "youtu.be" || YOUTUBE_HOST_PATTERN.test(host);
  } catch {
    return /(youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(normalized);
  }
};

export const extractYouTubeId = (url?: string | null): string | null => {
  const normalized = normalizeUrl(url);

  if (!normalized) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(normalized)) return normalized;
  if (!isYouTubeUrl(normalized)) return null;

  try {
    const parsed = new URL(normalized);
    const host = normalizeHost(parsed.hostname);

    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    const directId = parsed.searchParams.get("v");
    if (directId) return directId;

    const parts = parsed.pathname.split("/").filter(Boolean);
    const markerIndex = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part));

    if (markerIndex >= 0) {
      return parts[markerIndex + 1] ?? null;
    }

    return parts[0] ?? null;
  } catch {
    const match = normalized.match(
      /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    );

    return match ? match[1] : null;
  }
};

export const isDirectVideoUrl = (url?: string | null): boolean => !!normalizeUrl(url) && isStreamUrl(url!);

export const pickPreferredMediaUrl = (...sources: Array<string | null | undefined>) => {
  for (const source of sources) {
    const normalized = normalizeUrl(source);
    if (normalized) return normalized;
  }

  return null;
};
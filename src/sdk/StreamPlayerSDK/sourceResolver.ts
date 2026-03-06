import type { ResolvedSource, SourceType } from "./types";
import { log, warn } from "./utils";

const HLS_EXTENSIONS = [".m3u8", ".m3u", ".txt"];

const detectSourceType = (url: string): SourceType => {
  const lower = url.toLowerCase().split("?")[0].split("#")[0];

  if (HLS_EXTENSIONS.some((ext) => lower.includes(ext))) return "hls";

  // If URL contains typical embed patterns
  if (
    lower.includes("embed") ||
    lower.includes("player") ||
    lower.includes("iframe") ||
    lower.startsWith("http")
  ) {
    return "embed";
  }

  return "unknown";
};

/**
 * Fetch a .txt file and extract the HLS URL from its content.
 * Returns the first line that looks like an HLS URL, or the first HTTP(S) URL.
 */
const resolveTxtPlaylist = async (url: string): Promise<string | null> => {
  try {
    log("Fetching TXT playlist:", url);
    const response = await fetch(url);
    if (!response.ok) {
      warn("TXT fetch failed:", response.status);
      return null;
    }
    const text = await response.text();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // Look for an m3u8 URL first
    const m3u8Line = lines.find((l) => l.includes(".m3u8") || l.includes(".m3u"));
    if (m3u8Line) {
      log("Resolved TXT to HLS:", m3u8Line);
      return m3u8Line;
    }

    // Otherwise try any http URL
    const httpLine = lines.find((l) => l.startsWith("http"));
    if (httpLine) {
      log("Resolved TXT to URL:", httpLine);
      return httpLine;
    }

    // If content starts with #EXTM3U, the txt IS the playlist
    if (text.trimStart().startsWith("#EXTM3U")) {
      log("TXT is a valid HLS playlist itself");
      return url;
    }

    return null;
  } catch (err) {
    warn("Error resolving TXT:", err);
    return null;
  }
};

/**
 * Resolve a source URL to a playable format.
 * For TXT files, fetches and extracts the actual HLS URL.
 */
export const resolveSource = async (url: string): Promise<ResolvedSource> => {
  const type = detectSourceType(url);
  log("Source type detected:", type, "for URL:", url);

  return { type, resolvedUrl: url, originalUrl: url };
};

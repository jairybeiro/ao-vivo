import Hls from "hls.js";
import type { HlsEngineConfig, StreamPlayerError } from "./types";
import { DEFAULT_HLS_CONFIG } from "./types";
import { log, warn, error as logError } from "./utils";

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_STREAM_PATH = "/functions/v1/proxy-stream";

const KEEP_ALIVE_INTERVAL_MS = 25_000; // 25 seconds

const isProxyStreamRequest = (url: string): boolean => {
  return url.includes(PROXY_STREAM_PATH);
};

/** Extract the original upstream URL from a proxied URL */
const extractUpstreamUrl = (proxyUrl: string): string | null => {
  try {
    const parsed = new URL(proxyUrl);
    return parsed.searchParams.get("url");
  } catch {
    return null;
  }
};

export class HlsEngine {
  private hls: Hls | null = null;
  private video: HTMLVideoElement | null = null;
  private currentUrl: string = "";
  private config: HlsEngineConfig;
  private onErrorCallback?: (err: StreamPlayerError) => void;
  private onPlayCallback?: () => void;
  private onBufferCallback?: () => void;
  private networkRetryCount = 0;
  private mediaRetryCount = 0;
  private maxRetries = 2;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string | null = null;

  constructor(config?: Partial<HlsEngineConfig>) {
    this.config = { ...DEFAULT_HLS_CONFIG, ...config };
  }

  get isSupported(): boolean {
    return Hls.isSupported();
  }

  get hasNativeSupport(): boolean {
    const video = document.createElement("video");
    return !!video.canPlayType("application/vnd.apple.mpegurl");
  }

  setCallbacks(cbs: {
    onError?: (err: StreamPlayerError) => void;
    onPlay?: () => void;
    onBuffer?: () => void;
  }) {
    this.onErrorCallback = cbs.onError;
    this.onPlayCallback = cbs.onPlay;
    this.onBufferCallback = cbs.onBuffer;
  }

  attach(video: HTMLVideoElement, url: string): boolean {
    this.destroy();
    this.video = video;
    this.currentUrl = url;

    log("HLS Engine: attaching to", url);

    if (this.isSupported) {
      return this.attachWithHlsJs(video, url);
    }

    if (this.hasNativeSupport) {
      return this.attachNative(video, url);
    }

    logError("HLS not supported in this browser");
    this.onErrorCallback?.({
      type: "media",
      fatal: true,
      details: "HLS not supported in this browser",
    });
    return false;
  }

  private attachWithHlsJs(video: HTMLVideoElement, url: string): boolean {
    const hls = new Hls({
      enableWorker: this.config.enableWorker,
      maxBufferLength: this.config.maxBufferLength,
      backBufferLength: this.config.backBufferLength,
      liveSyncDurationCount: this.config.liveSyncDurationCount,
      liveMaxLatencyDurationCount: this.config.liveMaxLatencyDurationCount,
      capLevelToPlayerSize: this.config.capLevelToPlayerSize,
      manifestLoadingTimeOut: this.config.manifestLoadingTimeOut,
      manifestLoadingMaxRetry: this.config.manifestLoadingMaxRetry,
      levelLoadingTimeOut: this.config.levelLoadingTimeOut,
      levelLoadingMaxRetry: this.config.levelLoadingMaxRetry,
      fragLoadingTimeOut: this.config.fragLoadingTimeOut,
      fragLoadingMaxRetry: this.config.fragLoadingMaxRetry,
      fragLoadingRetryDelay: this.config.fragLoadingRetryDelay,
      levelLoadingRetryDelay: this.config.levelLoadingRetryDelay,
      xhrSetup: (xhr, requestUrl) => {
        if (SUPABASE_KEY && isProxyStreamRequest(requestUrl)) {
          xhr.setRequestHeader("apikey", SUPABASE_KEY);
          xhr.setRequestHeader("Authorization", `Bearer ${SUPABASE_KEY}`);
          // Send session ID so proxy can reuse cookies
          if (this.sessionId) {
            xhr.setRequestHeader("X-Session-Id", this.sessionId);
          }
        }
      },
    });

    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      log("HLS manifest loaded");
      this.networkRetryCount = 0;
      this.mediaRetryCount = 0;
      video.play().catch(() => {});
      this.onPlayCallback?.();
      // Start keep-alive after successful manifest load
      this.startKeepAlive();
    });

    hls.on(Hls.Events.FRAG_BUFFERED, () => {
      this.onBufferCallback?.();
    });

    // Capture session ID from proxy responses
    hls.on(Hls.Events.FRAG_LOADED, (_event, data) => {
      this.captureSessionFromResponse(data);
    });

    hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
      this.captureSessionFromResponse(data);
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      log("HLS error:", data.type, data.details);
      if (data.fatal) {
        const isAuthError = data.response?.code === 403 || data.response?.code === 401;
        const err: StreamPlayerError = {
          type: data.type === "networkError" ? "network" : isAuthError ? "auth" : "media",
          fatal: true,
          details: `${data.type} - ${data.details}`,
          originalError: data,
        };

        if (isAuthError) {
          // Session expired – clear and try fresh reload
          warn("[SESSION] Auth error detected, clearing session and reloading...");
          this.sessionId = null;
          this.stopKeepAlive();
          this.networkRetryCount++;
          if (this.networkRetryCount <= this.maxRetries) {
            hls.startLoad();
          } else {
            this.onErrorCallback?.(err);
          }
        } else if (data.type === "networkError") {
          this.networkRetryCount++;
          if (this.networkRetryCount <= this.maxRetries) {
            warn(`Fatal network error, retry ${this.networkRetryCount}/${this.maxRetries}...`);
            hls.startLoad();
          } else {
            warn("Network retries exhausted, escalating to failover");
            this.stopKeepAlive();
            this.onErrorCallback?.(err);
          }
        } else if (data.type === "mediaError") {
          this.mediaRetryCount++;
          if (this.mediaRetryCount <= this.maxRetries) {
            warn(`Fatal media error, retry ${this.mediaRetryCount}/${this.maxRetries}...`);
            hls.recoverMediaError();
          } else {
            warn("Media retries exhausted, escalating to failover");
            this.stopKeepAlive();
            this.onErrorCallback?.(err);
          }
        } else {
          this.stopKeepAlive();
          this.onErrorCallback?.(err);
        }
      }
    });

    this.hls = hls;
    return true;
  }

  /** Try to capture session ID from HLS.js response data */
  private captureSessionFromResponse(data: any): void {
    try {
      // HLS.js stores response headers in networkDetails (XMLHttpRequest)
      const xhr = data?.networkDetails;
      if (xhr && typeof xhr.getResponseHeader === "function") {
        const sid = xhr.getResponseHeader("X-Session-Id");
        if (sid && sid !== this.sessionId) {
          this.sessionId = sid;
          log("[SESSION] captured session:", sid);
        }
      }
    } catch {
      // Ignore
    }
  }

  /** Start keep-alive pings to prevent session expiration */
  private startKeepAlive(): void {
    this.stopKeepAlive();

    if (!this.currentUrl || !isProxyStreamRequest(this.currentUrl)) return;

    log("[SESSION] Starting keep-alive engine");

    this.keepAliveTimer = setInterval(async () => {
      if (!this.currentUrl) {
        this.stopKeepAlive();
        return;
      }

      try {
        const headers: Record<string, string> = {};
        if (SUPABASE_KEY) {
          headers["apikey"] = SUPABASE_KEY;
          headers["Authorization"] = `Bearer ${SUPABASE_KEY}`;
        }
        if (this.sessionId) {
          headers["X-Session-Id"] = this.sessionId;
        }

        const resp = await fetch(this.currentUrl, {
          method: "HEAD",
          headers,
        });

        // Capture updated session ID
        const newSid = resp.headers.get("X-Session-Id");
        if (newSid) this.sessionId = newSid;

        if (resp.ok) {
          log("[SESSION] refreshed ✓");
        } else if (resp.status === 403 || resp.status === 401) {
          warn("[SESSION] expired → reloading stream");
          this.sessionId = null;
          this.stopKeepAlive();
          this.reload();
        }
      } catch (err) {
        warn("[SESSION] keep-alive ping failed:", err);
      }
    }, KEEP_ALIVE_INTERVAL_MS);
  }

  /** Stop keep-alive timer */
  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
      log("[SESSION] Keep-alive stopped");
    }
  }

  private attachNative(video: HTMLVideoElement, url: string): boolean {
    log("Using native HLS (Safari)");
    video.src = url;

    video.addEventListener("loadedmetadata", () => {
      log("Native HLS manifest loaded");
      video.play().catch(() => {});
      this.onPlayCallback?.();
    });

    video.addEventListener("error", () => {
      this.onErrorCallback?.({
        type: "media",
        fatal: true,
        details: "Native HLS playback error",
        originalError: video.error,
      });
    });

    return true;
  }

  reload(): boolean {
    if (!this.video || !this.currentUrl) return false;
    log("HLS Engine: reloading stream");
    return this.attach(this.video, this.currentUrl);
  }

  destroy() {
    this.stopKeepAlive();
    if (this.hls) {
      log("HLS Engine: destroying instance");
      this.hls.destroy();
      this.hls = null;
    }
    if (this.video) {
      this.video.src = "";
      this.video.load();
    }
    this.video = null;
    this.currentUrl = "";
    this.sessionId = null;
  }

  getCurrentUrl(): string {
    return this.currentUrl;
  }
}

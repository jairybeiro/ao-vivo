import Hls from "hls.js";
import type { HlsEngineConfig, StreamPlayerError } from "./types";
import { DEFAULT_HLS_CONFIG } from "./types";
import { log, warn, error as logError } from "./utils";

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
    });

    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      log("HLS manifest loaded");
      this.networkRetryCount = 0;
      this.mediaRetryCount = 0;
      video.play().catch(() => {});
      this.onPlayCallback?.();
    });

    hls.on(Hls.Events.FRAG_BUFFERED, () => {
      this.onBufferCallback?.();
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      log("HLS error:", data.type, data.details);
      if (data.fatal) {
        const err: StreamPlayerError = {
          type: data.type === "networkError" ? "network" : data.response?.code === 403 ? "auth" : "media",
          fatal: true,
          details: `${data.type} - ${data.details}`,
          originalError: data,
        };

        if (data.type === "networkError") {
          warn("Fatal network error, attempting recovery...");
          hls.startLoad();
        } else if (data.type === "mediaError") {
          warn("Fatal media error, attempting recovery...");
          hls.recoverMediaError();
        } else {
          this.onErrorCallback?.(err);
        }
      }
    });

    this.hls = hls;
    return true;
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
  }

  getCurrentUrl(): string {
    return this.currentUrl;
  }
}

import type { StreamPlayerConfig, StreamPlayerError, ResolvedSource } from "./types";
import { resolveSource } from "./sourceResolver";
import { HlsEngine } from "./hlsEngine";
import { EmbedPlayer } from "./embedPlayer";
import { TokenManager } from "./tokenManager";
import { FallbackManager } from "./fallbackManager";
import { MultiSourceManager } from "./multiSourceManager";
import { log, warn, error as logError, resolveContainer, setDebug } from "./utils";

export type PlayerState = "idle" | "loading" | "playing" | "error" | "fallback";

export class StreamPlayer {
  private config: StreamPlayerConfig;
  private containerEl: HTMLElement | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private hlsEngine: HlsEngine;
  private embedPlayer: EmbedPlayer;
  private tokenManager: TokenManager;
  private fallbackManager: FallbackManager;
  private multiSourceManager: MultiSourceManager | null = null;
  private resolvedSource: ResolvedSource | null = null;
  private state: PlayerState = "idle";
  private destroyed = false;

  constructor(config: StreamPlayerConfig) {
    this.config = config;
    setDebug(config.debug ?? false);

    this.hlsEngine = new HlsEngine();
    this.embedPlayer = new EmbedPlayer();
    this.tokenManager = new TokenManager();
    this.fallbackManager = new FallbackManager();

    // Initialize multi-source if sources array provided
    const sources = config.sources && config.sources.length > 0
      ? config.sources
      : [config.source];

    if (sources.length > 1) {
      this.multiSourceManager = new MultiSourceManager(sources);
      log("StreamPlayer: initialized with", sources.length, "sources");
    } else {
      log("StreamPlayer: initialized with source:", config.source);
    }
  }

  async init(): Promise<void> {
    this.containerEl = resolveContainer(this.config.container);
    if (!this.containerEl) {
      logError("StreamPlayer: container not found");
      return;
    }

    this.setState("loading");

    const currentSource = this.multiSourceManager
      ? this.multiSourceManager.getCurrentSource()
      : this.config.source;

    await this.loadSource(currentSource);
  }

  private async loadSource(sourceUrl: string): Promise<void> {
    if (this.destroyed) return;

    this.setState("loading");

    // Resolve source
    this.resolvedSource = await resolveSource(sourceUrl);
    log("StreamPlayer: resolved source:", this.resolvedSource);
    this.config.onSourceResolved?.(this.resolvedSource);

    if (this.destroyed) return;

    if (this.resolvedSource.type === "hls") {
      this.initHlsPlayer(this.resolvedSource.resolvedUrl);
    } else if (this.resolvedSource.type === "embed") {
      this.initEmbedPlayer(this.resolvedSource.resolvedUrl);
    } else {
      // Try as HLS anyway
      this.initHlsPlayer(this.resolvedSource.resolvedUrl);
    }
  }

  private initHlsPlayer(url: string) {
    if (!this.containerEl) return;

    // Create video element
    this.videoEl = document.createElement("video");
    this.videoEl.controls = true;
    this.videoEl.playsInline = true;
    this.videoEl.autoplay = this.config.autoplay ?? true;
    this.videoEl.style.cssText = "width:100%;height:100%;object-fit:contain;background:#000;";
    this.containerEl.innerHTML = "";
    this.containerEl.appendChild(this.videoEl);

    // Setup HLS engine callbacks
    this.hlsEngine.setCallbacks({
      onPlay: () => {
        this.setState("playing");
        this.config.onPlay?.();
      },
      onError: (err) => this.handleError(err),
      onBuffer: () => this.config.onBuffer?.(),
    });

    const success = this.hlsEngine.attach(this.videoEl, url);
    if (!success) {
      this.handleError({
        type: "media",
        fatal: true,
        details: "Failed to attach HLS engine",
      });
      return;
    }

    // Setup fallback (only triggers after all multi-sources exhausted)
    this.fallbackManager.configure({
      strategy: {
        reload: () => this.hlsEngine.reload(),
        refetch: async () => {
          const currentSrc = this.multiSourceManager
            ? this.multiSourceManager.getCurrentSource()
            : this.config.source;
          const newSource = await resolveSource(currentSrc);
          if (newSource.resolvedUrl !== url) {
            return this.hlsEngine.attach(this.videoEl!, newSource.resolvedUrl);
          }
          return this.hlsEngine.reload();
        },
        useFallbackEmbed: (embedUrl) => this.initEmbedPlayer(embedUrl),
      },
      fallbackEmbedUrl: this.config.fallbackEmbedUrl,
      onFallback: this.config.onFallback,
    });

    // Start token health monitoring
    this.tokenManager.start(url, () => {
      log("StreamPlayer: token refresh triggered, reloading");
      this.config.onReload?.();
      this.hlsEngine.reload();
    });
  }

  private initEmbedPlayer(url: string) {
    if (!this.containerEl) return;
    this.containerEl.innerHTML = "";
    this.containerEl.style.position = "relative";
    this.embedPlayer.create(this.containerEl, url, this.config.title);
    this.setState("playing");
  }

  private async handleError(err: StreamPlayerError) {
    warn("StreamPlayer: error:", err.details);
    this.config.onError?.(err);

    if (!err.fatal) return;

    // If multi-source is active, try next source before fallback
    if (this.multiSourceManager) {
      this.multiSourceManager.recordError();

      if (this.multiSourceManager.hasNext()) {
        const nextSrc = this.multiSourceManager.nextSource();
        if (nextSrc) {
          const idx = this.multiSourceManager.getCurrentIndex();
          log(`StreamPlayer: Source ${idx} failed, switching to source ${idx + 1}`);
          this.config.onSourceSwitch?.(idx, nextSrc);
          this.tokenManager.stop();
          await this.loadSource(nextSrc);
          return;
        }
      }

      // All sources exhausted, fall through to fallbackManager
      warn("StreamPlayer: all sources exhausted, using fallback manager");
    }

    const recovered = await this.fallbackManager.handleFailure();
    if (!recovered) {
      this.setState("error");
    }
  }

  private setState(state: PlayerState) {
    this.state = state;
    log("StreamPlayer: state →", state);
  }

  // --- Public API ---

  play() {
    this.videoEl?.play().catch(() => {});
  }

  pause() {
    this.videoEl?.pause();
  }

  reload() {
    log("StreamPlayer: manual reload");
    this.config.onReload?.();
    this.fallbackManager.reset();
    this.multiSourceManager?.reset();

    if (this.resolvedSource?.type === "hls") {
      this.hlsEngine.reload();
    } else {
      this.init();
    }
  }

  setVolume(volume: number) {
    if (this.videoEl) {
      this.videoEl.volume = Math.max(0, Math.min(1, volume));
    }
  }

  toggleFullscreen() {
    if (this.containerEl) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        this.containerEl.requestFullscreen?.();
      }
    }
  }

  getState(): PlayerState {
    return this.state;
  }

  getResolvedSource(): ResolvedSource | null {
    return this.resolvedSource;
  }

  destroy() {
    log("StreamPlayer: destroying");
    this.destroyed = true;
    this.hlsEngine.destroy();
    this.embedPlayer.destroy();
    this.tokenManager.stop();
    this.fallbackManager.reset();
    this.multiSourceManager?.reset();
    if (this.containerEl) {
      this.containerEl.innerHTML = "";
    }
    this.videoEl = null;
    this.containerEl = null;
    this.resolvedSource = null;
    this.setState("idle");
  }
}

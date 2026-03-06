export type SourceType = "hls" | "txt" | "embed" | "unknown";

export interface ResolvedSource {
  type: SourceType;
  resolvedUrl: string;
  originalUrl: string;
}

export interface StreamPlayerConfig {
  container: HTMLElement | string;
  source: string;
  autoplay?: boolean;
  title?: string;
  debug?: boolean;
  fallbackEmbedUrl?: string;
  onPlay?: () => void;
  onError?: (error: StreamPlayerError) => void;
  onBuffer?: () => void;
  onReload?: () => void;
  onFallback?: (url: string) => void;
  onSourceResolved?: (source: ResolvedSource) => void;
}

export interface StreamPlayerError {
  type: "network" | "media" | "auth" | "unknown";
  fatal: boolean;
  details: string;
  originalError?: unknown;
}

export interface HlsEngineConfig {
  maxBufferLength: number;
  backBufferLength: number;
  liveSyncDurationCount: number;
  liveMaxLatencyDurationCount: number;
  enableWorker: boolean;
  capLevelToPlayerSize: boolean;
  manifestLoadingTimeOut: number;
  manifestLoadingMaxRetry: number;
  levelLoadingTimeOut: number;
  levelLoadingMaxRetry: number;
  fragLoadingTimeOut: number;
  fragLoadingMaxRetry: number;
  fragLoadingRetryDelay: number;
  levelLoadingRetryDelay: number;
}

export const DEFAULT_HLS_CONFIG: HlsEngineConfig = {
  maxBufferLength: 60,
  backBufferLength: 60,
  liveSyncDurationCount: 3,
  liveMaxLatencyDurationCount: 6,
  enableWorker: true,
  capLevelToPlayerSize: true,
  manifestLoadingTimeOut: 20000,
  manifestLoadingMaxRetry: 6,
  levelLoadingTimeOut: 20000,
  levelLoadingMaxRetry: 6,
  fragLoadingTimeOut: 20000,
  fragLoadingMaxRetry: 6,
  fragLoadingRetryDelay: 1000,
  levelLoadingRetryDelay: 1000,
};

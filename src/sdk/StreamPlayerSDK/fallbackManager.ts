import { log, warn } from "./utils";

export interface FallbackStrategy {
  reload: () => boolean;
  refetch: () => Promise<boolean>;
  useFallbackEmbed: (url: string) => void;
}

export class FallbackManager {
  private retryCount = 0;
  private maxRetries = 3;
  private strategy?: FallbackStrategy;
  private fallbackEmbedUrl?: string;
  private onFallback?: (url: string) => void;

  configure(opts: {
    strategy: FallbackStrategy;
    fallbackEmbedUrl?: string;
    maxRetries?: number;
    onFallback?: (url: string) => void;
  }) {
    this.strategy = opts.strategy;
    this.fallbackEmbedUrl = opts.fallbackEmbedUrl;
    this.maxRetries = opts.maxRetries ?? 3;
    this.onFallback = opts.onFallback;
  }

  async handleFailure(): Promise<boolean> {
    if (!this.strategy) return false;
    this.retryCount++;

    log("FallbackManager: handling failure, attempt", this.retryCount);

    // Step 1: Try reload
    if (this.retryCount <= this.maxRetries) {
      log("FallbackManager: attempting reload");
      const success = this.strategy.reload();
      if (success) return true;
    }

    // Step 2: Try refetch
    if (this.retryCount <= this.maxRetries + 1) {
      log("FallbackManager: attempting refetch");
      const success = await this.strategy.refetch();
      if (success) return true;
    }

    // Step 3: Use embed fallback
    if (this.fallbackEmbedUrl) {
      warn("FallbackManager: all retries exhausted, falling back to embed");
      this.strategy.useFallbackEmbed(this.fallbackEmbedUrl);
      this.onFallback?.(this.fallbackEmbedUrl);
      return true;
    }

    warn("FallbackManager: all recovery options exhausted");
    return false;
  }

  reset() {
    this.retryCount = 0;
  }
}

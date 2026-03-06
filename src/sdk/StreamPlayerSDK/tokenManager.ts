import { log, warn } from "./utils";

export type TokenRefreshCallback = () => void;

export class TokenManager {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private healthCheckUrl: string = "";
  private onRefreshNeeded?: TokenRefreshCallback;
  private intervalMs: number;

  constructor(intervalMs: number = 30000) {
    this.intervalMs = intervalMs;
  }

  start(url: string, onRefreshNeeded: TokenRefreshCallback) {
    this.stop();
    this.healthCheckUrl = url;
    this.onRefreshNeeded = onRefreshNeeded;

    log("TokenManager: starting health monitor, interval:", this.intervalMs, "ms");

    this.intervalId = setInterval(() => {
      this.checkHealth();
    }, this.intervalMs);
  }

  private async checkHealth() {
    if (!this.healthCheckUrl) return;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(this.healthCheckUrl, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 403 || response.status === 401) {
        warn("TokenManager: auth error detected (", response.status, "), triggering refresh");
        this.onRefreshNeeded?.();
      }
    } catch (err) {
      // Network errors during health check are expected for streams
      log("TokenManager: health check failed (may be normal for streams)");
    }
  }

  stop() {
    if (this.intervalId !== null) {
      log("TokenManager: stopping health monitor");
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

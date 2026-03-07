import { log, warn } from "./utils";

export class DynamicSourceManager {
  private reloadAttempts = 0;
  private maxAttempts: number;
  private healthIntervalId: ReturnType<typeof setInterval> | null = null;
  private healthIntervalMs: number;
  private onReloadNeeded?: () => void;

  constructor(maxAttempts = 5, healthIntervalMs = 90000) {
    this.maxAttempts = maxAttempts;
    this.healthIntervalMs = healthIntervalMs;
  }

  canReload(): boolean {
    return this.reloadAttempts < this.maxAttempts;
  }

  registerReload() {
    this.reloadAttempts++;
    log(`DynamicSourceManager: reload attempt ${this.reloadAttempts}/${this.maxAttempts}`);
  }

  startHealthMonitor(url: string, onReloadNeeded: () => void) {
    this.stopHealthMonitor();
    this.onReloadNeeded = onReloadNeeded;

    log("DynamicSourceManager: starting health monitor, interval:", this.healthIntervalMs, "ms");

    this.healthIntervalId = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, { method: "HEAD", signal: controller.signal });
        clearTimeout(timeout);

        if (response.status === 403 || response.status === 401) {
          warn("DynamicSourceManager: auth error detected (", response.status, "), triggering reload");
          this.onReloadNeeded?.();
        }
      } catch {
        log("DynamicSourceManager: health check failed, may need reload");
      }
    }, this.healthIntervalMs);
  }

  stopHealthMonitor() {
    if (this.healthIntervalId !== null) {
      clearInterval(this.healthIntervalId);
      this.healthIntervalId = null;
    }
  }

  reset() {
    this.reloadAttempts = 0;
    this.stopHealthMonitor();
  }
}

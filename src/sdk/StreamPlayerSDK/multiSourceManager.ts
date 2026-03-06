import { log, warn } from "./utils";

export interface SourceHealthMetrics {
  errorCount: number;
  bufferStallCount: number;
  lastSwitchTimestamp: number | null;
}

export class MultiSourceManager {
  private sources: string[];
  private currentIndex: number = 0;
  private metrics: Map<number, SourceHealthMetrics> = new Map();

  constructor(sources: string[]) {
    this.sources = sources.length > 0 ? sources : [];
    this.initMetrics();
  }

  private initMetrics() {
    this.sources.forEach((_, i) => {
      this.metrics.set(i, { errorCount: 0, bufferStallCount: 0, lastSwitchTimestamp: null });
    });
  }

  getCurrentSource(): string {
    return this.sources[this.currentIndex] ?? "";
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getTotalSources(): number {
    return this.sources.length;
  }

  hasNext(): boolean {
    return this.currentIndex < this.sources.length - 1;
  }

  nextSource(): string | null {
    if (!this.hasNext()) {
      warn("MultiSourceManager: no more sources available");
      return null;
    }

    this.currentIndex++;
    const next = this.sources[this.currentIndex];
    log(`MultiSourceManager: switching to source ${this.currentIndex + 1}/${this.sources.length}: ${next.substring(0, 60)}...`);

    const m = this.metrics.get(this.currentIndex);
    if (m) m.lastSwitchTimestamp = Date.now();

    return next;
  }

  recordError() {
    const m = this.metrics.get(this.currentIndex);
    if (m) m.errorCount++;
  }

  recordBufferStall() {
    const m = this.metrics.get(this.currentIndex);
    if (m) m.bufferStallCount++;
  }

  getMetrics(): Map<number, SourceHealthMetrics> {
    return new Map(this.metrics);
  }

  reset(): void {
    this.currentIndex = 0;
    this.initMetrics();
  }
}

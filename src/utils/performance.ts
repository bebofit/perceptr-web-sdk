declare global {
  interface Performance {
    measureUserAgentSpecificMemory(): Promise<MemoryEstimate>;
    memory: Memory;
  }
}

export interface Memory {
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface MemoryEstimate {
  bytes: number;
  breakdown: Array<{
    bytes: number;
    attribution: Array<string>;
    types: Array<string>;
  }>;
}

export class PerformanceMonitor {
  private static readonly MB = 1024 * 1024;
  private static readonly DEFAULT_MEMORY_LIMIT = 50 * PerformanceMonitor.MB;
  private static readonly CHECK_INTERVAL = 5000;

  private memoryLimit: number;
  private checkInterval?: number;
  private onLimitExceeded: () => void;

  constructor(
    memoryLimit = PerformanceMonitor.DEFAULT_MEMORY_LIMIT,
    onLimitExceeded: () => void
  ) {
    if (!this.isMemoryAPIAvailable()) {
      console.warn("Memory API is not available");
    }
    this.memoryLimit = memoryLimit;
    this.onLimitExceeded = onLimitExceeded;
  }

  public getMemoryLimit(): number {
    return this.memoryLimit;
  }

  public setMemoryLimit(memoryLimit: number): void {
    this.memoryLimit = memoryLimit;
  }

  public start(): void {
    if (!this.isMemoryAPIAvailable()) return;

    this.checkInterval = window.setInterval(() => {
      this.checkMemoryUsage();
    }, PerformanceMonitor.CHECK_INTERVAL);
  }

  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private async checkMemoryUsage(): Promise<void> {
    try {
      const memory = await this.getMemoryInfo();
      if (memory && typeof memory === "object" && "usedJSHeapSize" in memory) {
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit) {
          this.onLimitExceeded();
        }
      } else if (memory && typeof memory === "object" && "bytes" in memory) {
        if (memory.bytes > this.memoryLimit) {
          this.onLimitExceeded();
        }
      }
    } catch (error) {
      console.warn("Memory measurement failed:", error);
    }
  }

  private async getMemoryInfo(): Promise<MemoryEstimate | Memory | null> {
    if (!this.isMemoryAPIAvailable()) return null;
    if (typeof window.performance.measureUserAgentSpecificMemory === "function") {
      return window.performance.measureUserAgentSpecificMemory();
    }
    return window.performance.memory;
  }

  private isMemoryAPIAvailable(): boolean {
    if (
      typeof window.performance.measureUserAgentSpecificMemory === "function" ||
      window.performance.memory
    ) {
      return true;
    }
    return false;
  }
}

export function scheduleIdleTask(task: () => void, timeout = 1000): void {
  if (typeof window.requestIdleCallback !== "undefined") {
    window.requestIdleCallback(task, { timeout });
  } else {
    setTimeout(task, timeout);
  }
}

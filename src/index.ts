import { Core } from "./SessionCore";
import type { CoreConfig, UserIdentity } from "./types";
import { logger } from "./utils/logger";

class PerceptrSDK {
  private static instance: PerceptrSDK;
  private core!: Core;
  private initialized = false;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): PerceptrSDK {
    if (!PerceptrSDK.instance) {
      PerceptrSDK.instance = new PerceptrSDK();
    }
    return PerceptrSDK.instance;
  }

  public init(config: CoreConfig): void {
    if (this.initialized) {
      logger.forceLog("warn", "SDK already initialized");
      return;
    }

    this.core = new Core(config);
    this.initialized = true;
    logger.configure({ debug: !!config.debug });
  }

  public start(): Promise<void> {
    this.ensureInitialized();
    return this.core.start();
  }

  public stop(): Promise<void> {
    this.ensureInitialized();
    return this.core.stop();
  }

  public pause(): void {
    this.ensureInitialized();
    this.core.pause();
  }

  public resume(): void {
    this.ensureInitialized();
    this.core.resume();
  }

  public identify(
    distinctId: string,
    traits: Record<string, any> = {}
  ): Promise<void> {
    this.ensureInitialized();
    return this.core.identify(distinctId, traits);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("[SDK] SDK not initialized. Call init() first");
    }
  }
}

// Export a singleton instance
export default PerceptrSDK.getInstance();

// Export types for consumers
export type { CoreConfig, UserIdentity };

import { Breadcrumbs } from "./Breadcrumbs";
import { ConsoleLogger } from "./ConsoleLogger";
import { NetworkMonitor } from "./NetworkMonitor";
import { DataAggregator } from "./SessionAggregator";
import { SessionExporter } from "./SessionExporter";
import { SessionRecorder } from "./SessionRecorder";
import { SessionCore, CoreConfig } from "./types";
import { PerformanceMonitor, scheduleIdleTask } from "./utils/performance";
import { v4 as uuidv4 } from "uuid";
import {
  ErrorCode,
  SDKErrorEvent,
  emitError,
  wrapWithErrorBoundary,
} from "./utils/errors";

export interface CoreOptions extends CoreConfig {
  debug?: boolean;
}

export class Core {
  private readonly components: SessionCore;
  private readonly config: CoreOptions;
  private isEnabled = false;
  private performanceMonitor?: PerformanceMonitor;

  constructor(config: CoreOptions = {}) {
    this.config = config;

    try {
      const sessionId = uuidv4();
      const startTime = Date.now();

      this.components = {
        sessionRecorder: new SessionRecorder(config.session),
        networkMonitor: new NetworkMonitor(config.network),
        consoleLogger: new ConsoleLogger(config.console),
        breadcrumbs: new Breadcrumbs(config.breadcrumbs),
        aggregator: new DataAggregator(sessionId, startTime),
      };

      this.performanceMonitor = new PerformanceMonitor(
        config.performance?.memoryLimit,
        () => this.handleMemoryLimit()
      );

      if (config.debug) {
        this.setupDebugListeners();
      }
    } catch (error) {
      emitError({
        code: ErrorCode.INITIALIZATION_FAILED,
        message: "Failed to initialize SDK",
        originalError: error,
      });
      throw error;
    }
  }

  private setupDebugListeners(): void {
    window.addEventListener("sdk-error", (event: SDKErrorEvent) => {
      const { code, message, context } = event.detail;
      console.error(`[SDK Error] ${code}: ${message}`, context);
    });

    if (this.config.debug) {
      console.debug("[SDK] Initialized with config:", this.config);
    }
  }

  public start(): void {
    if (this.isEnabled) return;

    try {
      this.performanceMonitor?.start();

      // Start components using idle scheduling
      scheduleIdleTask(() => {
        this.safelyEnableComponent("networkMonitor");
        this.safelyEnableComponent("consoleLogger");
      });

      // Start critical components immediately
      this.safelyEnableComponent("sessionRecorder", "startSession");
      this.safelyEnableComponent("breadcrumbs");

      this.isEnabled = true;

      if (this.config.debug) {
        console.debug("[SDK] Recording started");
      }
    } catch (error) {
      emitError({
        code: ErrorCode.RECORDING_FAILED,
        message: "Failed to start recording",
        originalError: error,
      });
      throw error;
    }
  }

  private safelyEnableComponent(
    componentName: keyof SessionCore,
    method: "enable" | "startSession" = "enable"
  ): void {
    try {
      const component = this.components[componentName];
      component[method]();
    } catch (error) {
      emitError({
        code: ErrorCode.API_ERROR,
        message: `Failed to ${method} ${componentName}`,
        originalError: error,
        context: { component: componentName },
      });

      if (this.config.debug) {
        console.warn(`[SDK] Failed to ${method} ${componentName}:`, error);
      }
    }
  }

  public async stop(): Promise<string> {
    if (!this.isEnabled) {
      throw new Error("Session not started");
    }

    try {
      this.performanceMonitor?.stop();

      // Stop all components
      this.components.sessionRecorder.stopSession();
      this.components.networkMonitor.disable();
      this.components.consoleLogger.disable();
      this.components.breadcrumbs.disable();

      // Aggregate and export data
      return new Promise<string>((resolve, reject) => {
        scheduleIdleTask(() => {
          try {
            this.components.aggregator.addSessionEvents(
              this.components.sessionRecorder.getCurrentSession()!
            );
            this.components.aggregator.addNetworkRequests(
              this.components.networkMonitor.getRequests()
            );
            this.components.aggregator.addConsoleLogs(
              this.components.consoleLogger.getLogs()
            );
            this.components.aggregator.addBreadcrumbs(
              this.components.breadcrumbs.getBreadcrumbs()
            );

            const exporter = SessionExporter.fromAggregator(
              this.components.aggregator.getAggregatedData()
            );

            this.isEnabled = false;
            resolve(exporter.exportSession());

            if (this.config.debug) {
              console.debug("[SDK] Recording stopped and data exported");
            }
          } catch (error) {
            emitError({
              code: ErrorCode.EXPORT_FAILED,
              message: "Failed to export session data",
              originalError: error,
            });
            reject(error);
          }
        });
      });
    } catch (error) {
      emitError({
        code: ErrorCode.API_ERROR,
        message: "Failed to stop recording",
        originalError: error,
      });
      throw error;
    }
  }

  private handleMemoryLimit(): void {
    emitError({
      code: ErrorCode.MEMORY_LIMIT_EXCEEDED,
      message: "Memory limit exceeded, pausing session recording",
      context: { limit: this.performanceMonitor?.getMemoryLimit() },
    });
    this.pause();
  }

  public pause(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    this.performanceMonitor?.stop();
  }

  // ... rest of the class implementation
}

export default Core;

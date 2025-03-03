import { Breadcrumbs } from "./Breadcrumbs";
import { ConsoleLogger } from "./ConsoleLogger";
import { NetworkMonitor } from "./NetworkMonitor";
import { SessionExporter } from "./SessionExporter";
import { SessionRecorder } from "./SessionRecorder";
import { SessionCore, CoreConfig, ExportedSession } from "./types";
import { PerformanceMonitor, scheduleIdleTask } from "./utils/performance";
import { v4 as uuidv4 } from "uuid";
import {
  ErrorCode,
  SDKErrorEvent,
  emitError,
} from "./utils/errors";


export class Core {
  private readonly components: SessionCore;
  private readonly config: CoreConfig;
  private readonly sessionId: string;
  private readonly startTime: number;
  private readonly performanceMonitor: PerformanceMonitor;
  private isEnabled = false;

  constructor(config: CoreConfig = {}) {
    this.config = config;
    this.sessionId = uuidv4();
    this.startTime = Date.now();

    try {
      this.components = {
        sessionRecorder: new SessionRecorder(config.session, config.debug),
        networkMonitor: new NetworkMonitor(config.network, config.debug),
        consoleLogger: new ConsoleLogger(config.console, config.debug),
        breadcrumbs: new Breadcrumbs(config.breadcrumbs, config.debug),
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
      this.performanceMonitor.start();

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

  public async stop(): Promise<ExportedSession> {
    if (!this.isEnabled) {
      throw new Error("Session not started");
    }

    try {
      // Aggregate and export data
      return new Promise<ExportedSession>((resolve, reject) => {
        scheduleIdleTask(() => {
          try {

            // Create the exporter
            const exporter = new SessionExporter(
              this.sessionId,
              this.startTime,
              Date.now(),
              this.components.sessionRecorder.getRecordingEvents(),
              this.components.networkMonitor.getRequests(),
              this.components.consoleLogger.getLogs(),
              this.components.breadcrumbs.getBreadcrumbs()
            );
            this.isEnabled = false;
            
          
            // Stop all components
            this.performanceMonitor.stop();
            this.components.sessionRecorder.stopSession();
            this.components.networkMonitor.disable();
            this.components.consoleLogger.disable();
            this.components.breadcrumbs.disable();

            // Export the session data
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

  // Handle memory limit exceeded
  private handleMemoryLimit(): void {
    emitError({
      code: ErrorCode.MEMORY_LIMIT_EXCEEDED,
      message: "Memory limit exceeded, pausing session recording",
      context: { limit: this.performanceMonitor.getMemoryLimit() },
    });
    this.pause();
  }

  public pause(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    this.components.sessionRecorder.pause();
    this.components.networkMonitor.disable();
    this.components.consoleLogger.disable();
    this.components.breadcrumbs.disable();
    this.performanceMonitor.stop();
  }

  public resume(): void {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.components.sessionRecorder.resume();
    this.components.networkMonitor.enable();
    this.components.consoleLogger.enable();
    this.components.breadcrumbs.enable();
    this.performanceMonitor.start();
  }

}

export default Core;

import { NetworkMonitor } from "./NetworkMonitor";
import { SessionExporter } from "./SessionExporter";
import { SessionRecorder } from "./SessionRecorder";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { EventBuffer } from "./EventBuffer";
import { ApiService } from "./common/services/ApiService";
import {
  CoreComponents,
  CoreConfig,
  ExportedSession,
  SnapshotBuffer,
  UserIdentity,
} from "./types";
import { scheduleIdleTask } from "./utils/sessionrecording-utils";
import { v4 as uuidv4 } from "uuid";
import { ErrorCode, SDKErrorEvent, emitError } from "./utils/errors";
import { logger } from "./utils/logger";

export class Core {
  private components!: CoreComponents;
  private config: CoreConfig;
  private sessionId!: string;
  private startTime!: number;
  private performanceMonitor!: PerformanceMonitor;
  private eventBuffer!: EventBuffer;
  private apiService!: ApiService;
  private isEnabled = false;
  private eventListeners: (() => void)[] = [];
  private userIdentity?: UserIdentity;
  private initPromise: Promise<void>;
  private isInitialized = false;

  constructor(config: CoreConfig) {
    this.config = config;
    this.initPromise = this.init();
  }

  private async init() {
    try {
      this.apiService = new ApiService(this.config);

      const valid = await this.apiService.checkValidProjectId();
      if (!valid) {
        throw new Error(`Invalid project ID: ${this.config.projectId}`);
      }
      this.sessionId = uuidv4();
      this.startTime = Date.now();
      this.eventListeners = [];
      this.userIdentity = this.config.userIdentity;
      this.components = {
        sessionRecorder: new SessionRecorder(this.config.session),
        networkMonitor: new NetworkMonitor(this.config.network, this.startTime),
      };

      this.performanceMonitor = new PerformanceMonitor(
        this.config.performance?.memoryLimit,
        () => this.handleMemoryLimit()
      );

      this.eventBuffer = new EventBuffer(this.sessionId, (buffer) =>
        this.sendBufferToServer(buffer)
      );

      if (this.config.debug) {
        this.setupDebugListeners();
      }

      this.isInitialized = true;
      logger.debug("SDK initialized successfully");
    } catch (error) {
      emitError({
        code: ErrorCode.API_ERROR,
        message: "Failed to initialize SDK",
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Identify the current user
   * @param distinctId - Unique identifier for the user
   * @param traits - Additional user properties
   */
  public async identify(
    distinctId: string,
    traits: Record<string, any> = {}
  ): Promise<void> {
    try {
      await this.initPromise;
      if (!this.isInitialized) {
        throw new Error("[SDK] Not properly initialized");
      }
      this.userIdentity = {
        distinctId,
        ...traits,
      };

      logger.debug(`User identified: ${distinctId}`, traits);

      // If we have an active buffer, update it with the user identity
      this.eventBuffer.setUserIdentity(this.userIdentity);

      // Send an identify event to the session recorder
      if (this.isEnabled && this.components.sessionRecorder) {
        this.components.sessionRecorder.addCustomEvent("$identify", {
          distinctId,
          ...traits,
        });
      }
    } catch (error) {
      emitError({
        code: ErrorCode.API_ERROR,
        message: "Failed to identify user",
        originalError: error,
      });
    }
  }

  private async sendBufferToServer(buffer: SnapshotBuffer): Promise<void> {
    try {
      // Add user identity to the buffer before sending
      if (this.userIdentity) {
        buffer.userIdentity = this.userIdentity;
      }
      await this.apiService.sendEvents(buffer);
    } catch (error) {
      emitError({
        code: ErrorCode.API_ERROR,
        message: "Failed to send events to server",
        originalError: error,
      });
      throw error;
    }
  }

  private setupDebugListeners(): void {
    window.addEventListener("sdk-error", (event: SDKErrorEvent) => {
      const { code, message, context } = event.detail;
      logger.error(`error: ${code}: ${message}`, context);
    });

    logger.debug("Initialized with config:", this.config);
  }

  public async start(): Promise<void> {
    if (this.isEnabled) return;

    try {
      // Wait for initialization to complete
      await this.initPromise;

      if (!this.isInitialized) {
        throw new Error("[SDK] Not properly initialized");
      }

      // Set up event listeners for buffer
      this.setupEventListeners();

      // Start performance monitor
      this.performanceMonitor.start();

      // Start components using idle scheduling
      scheduleIdleTask(() => {
        this.safelyEnableComponent("networkMonitor");
      });

      // Start critical components immediately
      this.safelyEnableComponent("sessionRecorder", "startSession");

      this.isEnabled = true;

      logger.debug("Recording started");
    } catch (error) {
      emitError({
        code: ErrorCode.RECORDING_FAILED,
        message: "Failed to start recording",
        originalError: error,
      });
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Subscribe to events from each component
    this.eventListeners.push(
      this.components.sessionRecorder.onEvent((event) => {
        this.eventBuffer.addEvent(event);
      })
    );

    this.eventListeners.push(
      this.components.networkMonitor.onRequest((request) => {
        this.eventBuffer.addEvent(request);
      })
    );
  }

  private safelyEnableComponent(
    componentName: keyof CoreComponents,
    method: "enable" | "startSession" = "enable"
  ): void {
    try {
      const component = this.components[componentName];
      if (method === "startSession" && componentName === "sessionRecorder") {
        (component as SessionRecorder).startSession();
      } else if (method === "enable") {
        (component as NetworkMonitor).enable();
      }
    } catch (error) {
      emitError({
        code: ErrorCode.API_ERROR,
        message: `Failed to ${method} ${componentName}`,
        originalError: error,
        context: { component: componentName },
      });

      logger.warn(`Failed to ${method} ${componentName}:`, error);
    }
  }

  public async stop(): Promise<ExportedSession> {
    if (!this.isEnabled) {
      throw new Error("[SDK] is not enabled");
    }

    try {
      // Force flush to ensure data is sent
      await this.eventBuffer.flush(true);

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
              this.config.metadata,
              this.userIdentity
            );
            this.isEnabled = false;

            // Stop all components
            this.eventListeners.forEach((listener) => listener());
            this.eventBuffer.destroy();
            this.performanceMonitor.stop();
            this.components.sessionRecorder.stopSession();
            this.components.networkMonitor.disable();

            // Export the session data
            resolve(exporter.exportSession());
            logger.debug("Recording stopped and data exported");
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
    this.performanceMonitor.stop();
  }

  public resume(): void {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.components.sessionRecorder.resume();
    this.components.networkMonitor.enable();
    this.performanceMonitor.start();
  }
}

export default Core;

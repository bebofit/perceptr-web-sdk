import { NetworkMonitor } from "./NetworkMonitor";
import { SessionRecorder } from "./SessionRecorder";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { EventBuffer } from "./EventBuffer";
import { ApiService } from "./common/services/ApiService";
import { SessionManager } from "./common/services/SessionManager";
import {
  CoreComponents,
  CoreConfig,
  SnapshotBuffer,
  UserIdentity,
} from "./types";
import { scheduleIdleTask } from "./utils/sessionrecording-utils";
import { debounce } from "./utils/debounce";
import { ErrorCode, SDKErrorEvent, emitError } from "./utils/errors";
import { logger } from "./utils/logger";

const VISIBILITY_DEBOUNCE_MS = 400;

export class Core {
  private components!: CoreComponents;
  private config: CoreConfig;
  private startTime!: number;
  private performanceMonitor!: PerformanceMonitor;
  private eventBuffer!: EventBuffer;
  private apiService!: ApiService;
  private sessionManager!: SessionManager;
  private isEnabled = false;
  private eventListeners: (() => void)[] = [];
  private visibilityCleanup: (() => void) | undefined;
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

      const sessionConfig = this.config.session ?? {};
      this.sessionManager = new SessionManager({
        inactivityTimeout: sessionConfig.inactivityTimeout,
        maxSessionDuration: sessionConfig.maxSessionDuration,
        staleThreshold: sessionConfig.staleThreshold,
      });
      this.eventBuffer = new EventBuffer(
        sessionConfig,
        (buffer) => this.sendBufferToServer(buffer),
        this.sessionManager
      );
      const sessionState = this.sessionManager.getOrCreateSession();
      this.eventBuffer.setSessionState(sessionState);
      await this.eventBuffer.flushPersistedBuffers();

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
    // Add user identity to the buffer before sending
    if (this.userIdentity) {
      buffer.userIdentity = this.userIdentity;
    }
    await this.apiService.sendEvents(buffer);
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

      this.setupEventListeners();
      this.setupVisibilityHandler();

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

  /**
   * Debounced visibility handler: on visible, resolve session from SessionManager
   * and set state on EventBuffer, then flush any persisted buffers.
   */
  private setupVisibilityHandler(): void {
    if (typeof document === "undefined") return;
    const handleVisible = debounce(() => {
      if (document.visibilityState !== "visible") return;
      const sessionState = this.sessionManager.getOrCreateSession();
      this.eventBuffer.setSessionState(sessionState);
      this.eventBuffer.flushPersistedBuffers();
    }, VISIBILITY_DEBOUNCE_MS);
    document.addEventListener("visibilitychange", handleVisible);
    this.visibilityCleanup = () => {
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }

  private removeVisibilityHandler(): void {
    if (this.visibilityCleanup) {
      this.visibilityCleanup();
      this.visibilityCleanup = undefined;
    }
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

  public async stop(): Promise<void> {
    if (!this.isEnabled) {
      throw new Error("[SDK] is not enabled");
    }

    try {
      // Force flush to ensure data is sent
      await this.eventBuffer.flush(true);

      // Aggregate and export data
      return new Promise<void>((resolve, reject) => {
        scheduleIdleTask(() => {
          try {
            this.isEnabled = false;

            // Stop all components
            this.eventListeners.forEach((listener) => listener());
            this.removeVisibilityHandler();
            this.eventBuffer.destroy();
            this.performanceMonitor.stop();
            this.components.sessionRecorder.stopSession();
            this.components.networkMonitor.disable();

            // Export the session data
            resolve();
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

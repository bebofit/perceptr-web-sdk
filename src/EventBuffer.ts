import { v4 as uuidv4 } from "uuid";
import type {
  BufferConfig,
  EventType,
  PersistedBufferData,
  PersistedSessionState,
  SnapshotBuffer,
  UserIdentity,
} from "./types";
import { estimateSize, scheduleIdleTask } from "./utils/sessionrecording-utils";
import {
  ACTIVE_SOURCES,
  CONSOLE_LOG_PLUGIN_NAME,
  INCREMENTAL_SNAPSHOT_EVENT_TYPE,
  SEVEN_MEGABYTES,
} from "./common/defaults";
import { LogData } from "@rrweb/rrweb-plugin-console-record";
import { logger } from "./utils/logger";
import type { SessionManager } from "./common/services/SessionManager";
import type { IncrementalSource } from "rrweb";

// Internal configuration - not exposed to users
interface InternalBufferConfig {
  maxBufferSize: number; // in bytes
  flushInterval: number; // in ms
  maxBufferAge: number; // in ms
  compressionThreshold: number; // in bytes
  useCompression: boolean;
  backoffInterval: number; // in ms
  maxBackoffInterval: number; // in ms
  persistenceEnabled: boolean; // whether to persist buffer data
  persistenceKey: string; // sessionStorage key for persisted data
}

export class EventBuffer {
  private buffer: EventType[] = [];
  private bufferSize = 0;
  private lastFlushTime!: number;
  private flushTimer?: ReturnType<typeof setTimeout>;
  private readonly config: InternalBufferConfig;
  private sessionId!: string;
  private startTime!: number;
  private readonly onFlush: (data: SnapshotBuffer) => Promise<void>;
  private userIdentity?: UserIdentity;
  private isFlushInProgress = false;
  private flushFailures = 0;
  private backoffUntil = 0;
  private unloadHandlerAttached = false;
  private lastBatchEndTime?: number;
  private readonly sessionManager?: SessionManager;

  constructor(
    config: BufferConfig,
    onFlush: (data: SnapshotBuffer) => Promise<void>,
    sessionManager?: SessionManager
  ) {
    this.onFlush = onFlush;
    this.sessionManager = sessionManager;
    // Internal configuration - not exposed to users
    this.config = {
      maxBufferSize: 1024 * 1024, // 1MB default
      flushInterval: 60000, // 1 minute default
      maxBufferAge: 300000, // 5 minutes default
      compressionThreshold: 100 * 1024, // 100KB
      useCompression: false,
      backoffInterval: 5000, // 5 seconds initial backoff
      maxBackoffInterval: 300000, // 5 minutes max backoff
      persistenceEnabled: true,
      persistenceKey: "perceptr_buffer_data",
    };
    this.startFlushTimer();
    this.setupUnloadHandler();
  }

  /**
   * Sets session identity from SessionManager. Call after getOrCreateSession().
   */
  public setSessionState(state: PersistedSessionState): void {
    this.sessionId = state.sessionId;
    this.startTime = state.startTime;
    if (this.lastFlushTime == null) {
      this.lastFlushTime = state.startTime;
    }
  }

  /**
   * Flushes any persisted buffers from sessionStorage. Call after setSessionState
   * when tab becomes visible or on init. Session identity is already set by Core.
   */
  public async flushPersistedBuffers(): Promise<void> {
    if (
      !this.config.persistenceEnabled ||
      typeof sessionStorage === "undefined"
    ) {
      return;
    }
    const persistedDataStr = sessionStorage.getItem(this.config.persistenceKey);
    if (!persistedDataStr) return;
    let persistedData: PersistedBufferData[];
    try {
      persistedData = JSON.parse(persistedDataStr);
      if (!Array.isArray(persistedData)) return;
    } catch {
      return;
    }
    await this.flushStoredBuffers(persistedData);
  }

  private getStorage(): Storage | undefined {
    if (typeof sessionStorage === "undefined") return undefined;
    return sessionStorage;
  }

  private setupUnloadHandler(): void {
    if (typeof window === "undefined" || this.unloadHandlerAttached) return;
    window.addEventListener("beforeunload", () => {
      this.persistBufferData();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.persistBufferData();
      }
    });
    this.unloadHandlerAttached = true;
  }

  private async flushStoredBuffers(
    storedBuffers: PersistedBufferData[]
  ): Promise<void> {
    try {
      logger.debug(`Found ${storedBuffers.length} persisted buffer(s) to send`);

      // Process each persisted buffer
      for (const data of [...storedBuffers]) {
        // Skip and remove empty buffers
        if (!Array.isArray(data.events) || data.events.length === 0) {
          storedBuffers.splice(storedBuffers.indexOf(data), 1);
          logger.debug(
            `Removed empty persisted buffer for session ${data.sessionId}`
          );
          continue;
        }
        try {
          // For persisted buffers from the current session, determine if we should use
          // continuous chronology or start fresh based on the stored start time
          const isSameSession = data.sessionId === this.sessionId;
          const useContiguousTime = isSameSession && this.lastBatchEndTime;

          // Choose appropriate start time
          // - For current session with lastBatchEndTime set: use lastBatchEndTime
          // - Otherwise: use the persisted start time
          const batchStartTime = useContiguousTime
            ? this.lastBatchEndTime
            : data.startTime;

          // Create a snapshot from the persisted data
          const snapshot: SnapshotBuffer = {
            isSessionEnded: !isSameSession,
            sessionId: data.sessionId,
            batchId: data.batchId,
            startTime: batchStartTime || data.startTime, // Fallback to original start time if needed
            endTime: data.endTime,
            size: data.size,
            data: data.events,
            metadata: {
              bufferCount: uuidv4(),
              eventCount: data.events.length,
              compressed: false,
              persisted: true,
            },
            userIdentity: data.userIdentity,
          };

          // Send the persisted data
          await this.onFlush(snapshot);

          // Update lastBatchEndTime only for current session
          if (isSameSession) {
            this.lastBatchEndTime = data.endTime;
          }

          storedBuffers.splice(storedBuffers.indexOf(data), 1);
          logger.debug(
            `Successfully sent persisted buffer for session ${data.sessionId}`
          );
        } catch (error) {
          logger.error(
            `Failed to send persisted buffer for session ${data.sessionId}:`,
            error
          );
        }
      }
      const storage = this.getStorage();
      if (storage) {
        if (storedBuffers.length > 0) {
          storage.setItem(
            this.config.persistenceKey,
            JSON.stringify(storedBuffers)
          );
        } else {
          storage.removeItem(this.config.persistenceKey);
        }
      }
      logger.debug(`Processed ${storedBuffers.length} persisted events`);
    } catch (error) {
      logger.error("Error processing persisted buffer data:", error);
      const storage = this.getStorage();
      if (storage) storage.removeItem(this.config.persistenceKey);
    }
  }

  private persistBufferData(): void {
    const storage = this.getStorage();
    if (
      !this.config.persistenceEnabled ||
      !storage ||
      this.buffer.length === 0
    ) {
      return;
    }
    try {
      let persistedData: PersistedBufferData[] = [];
      const existingData = storage.getItem(this.config.persistenceKey);
      if (existingData) {
        try {
          persistedData = JSON.parse(existingData);
          if (!Array.isArray(persistedData)) persistedData = [];
        } catch {
          persistedData = [];
        }
      }
      const now = Date.now();
      const lastActivityTime =
        this.sessionManager?.getCurrentState()?.lastActivityTime ?? now;
      const existingSession = persistedData.find(
        (data) => data.sessionId === this.sessionId
      );
      if (existingSession) {
        existingSession.events = [...this.buffer];
        existingSession.endTime = now;
        existingSession.lastActivityTime = lastActivityTime;
      } else {
        persistedData.push({
          sessionId: this.sessionId,
          batchId: uuidv4(),
          startTime: this.startTime,
          endTime: now,
          lastActivityTime,
          events: [...this.buffer],
          userIdentity: this.userIdentity,
          size: this.bufferSize,
        });
      }
      if (persistedData.length > 3) {
        persistedData = persistedData.slice(-3);
      }
      storage.setItem(
        this.config.persistenceKey,
        JSON.stringify(persistedData)
      );
      logger.debug(` Persisted ${this.buffer.length} events to storage`);
    } catch (error) {
      logger.error("Failed to persist buffer data:", error);
    }
  }

  public addEvent(event: EventType): void {
    if (this.isInternalSdkLog(event)) return;
    if (this.sessionManager && this.isInteractiveEvent(event)) {
      this.sessionManager.updateActivity();
    }
    const eventSize = estimateSize(event);
    const now = Date.now();
    this.buffer.push(event);
    this.bufferSize += eventSize;
    const shouldAttemptFlush =
      // Buffer is getting full
      this.bufferSize > this.config.maxBufferSize * 0.9 ||
      // Buffer is too old
      now - this.lastFlushTime > this.config.maxBufferAge;

    // Only attempt to flush if we're not in a backoff period and not already flushing
    if (
      shouldAttemptFlush &&
      !this.isFlushInProgress &&
      now > this.backoffUntil
    ) {
      logger.debug("Scheduling buffer flush");
      scheduleIdleTask(() => this.flush());
    }
  }

  public addEvents(events: EventType[]): void {
    for (const event of events) {
      this.addEvent(event);
    }
  }

  /**
   * Set the user identity for this buffer
   */
  public setUserIdentity(identity: UserIdentity): void {
    this.userIdentity = identity;
  }

  public async flush(isSessionEnded: boolean = false): Promise<void> {
    if (this.buffer.length === 0 || this.isFlushInProgress) return;

    const now = Date.now();

    // Check if we're in a backoff period
    if (now < this.backoffUntil && !isSessionEnded) {
      logger.debug(
        `In backoff period, skipping flush. Will retry in ${Math.ceil(
          (this.backoffUntil - now) / 1000
        )}s`
      );
      return;
    }

    this.isFlushInProgress = true;
    const bufferData = [...this.buffer];
    const bufferSize = this.bufferSize;

    logger.debug(
      `Flushing buffer with ${bufferData.length} events (${bufferSize} bytes)`
    );

    // Determine if compression should be used
    const shouldCompress =
      this.config.useCompression &&
      bufferSize > this.config.compressionThreshold;

    // Use appropriate startTime - either original session start time (for first batch)
    // or the end time of the last batch (for subsequent batches)
    const batchStartTime = this.lastBatchEndTime || this.startTime;

    // Create a single snapshot buffer
    const snapshot: SnapshotBuffer = {
      isSessionEnded,
      sessionId: this.sessionId,
      batchId: uuidv4(),
      startTime: batchStartTime,
      endTime: now,
      size: bufferSize,
      data: bufferData,
      metadata: {
        bufferSize: this.bufferSize,
        eventCount: bufferData.length,
        compressed: shouldCompress,
      },
      userIdentity: this.userIdentity,
    };

    // Compress data if needed
    if (shouldCompress) {
      await this.compressSnapshot(snapshot);
    }

    // Send the data to the server
    try {
      await this.onFlush(snapshot);

      // Update lastBatchEndTime for the next batch
      this.lastBatchEndTime = now;

      // Success! Clear the buffer and reset failure count
      this.buffer = [];
      this.bufferSize = 0;
      this.lastFlushTime = now;
      this.flushFailures = 0;
      this.backoffUntil = 0;

      // Reset the flush timer
      this.resetFlushTimer();
      logger.debug(`Flushing ${bufferData.length} events to server`);
    } catch (error) {
      // Increment failure count and implement exponential backoff
      this.flushFailures++;

      // Calculate backoff time with exponential increase
      const backoffTime = Math.min(
        this.config.backoffInterval * Math.pow(2, this.flushFailures - 1),
        this.config.maxBackoffInterval
      );

      this.backoffUntil = now + backoffTime;

      logger.error(
        `Failed to flush buffer (attempt ${
          this.flushFailures
        }). Backing off for ${backoffTime / 1000}s until ${new Date(
          this.backoffUntil
        ).toISOString()}`
      );

      // If buffer is getting too large despite failures, we might need to drop some events
      if (this.bufferSize > SEVEN_MEGABYTES * 20) {
        const eventsToKeep = Math.floor(this.buffer.length * 0.8); // Keep 80% of events
        logger.debug(
          `Buffer too large after flush failures. Dropping ${
            this.buffer.length - eventsToKeep
          } oldest events`
        );
        this.buffer = this.buffer.slice(-eventsToKeep);
        this.recalculateBufferSize();
      }
      logger.error("Failed to flush buffer:", error);
    } finally {
      this.isFlushInProgress = false;
    }
  }

  private recalculateBufferSize(): void {
    this.bufferSize = this.buffer.reduce(
      (size, event) => size + estimateSize(event),
      0
    );
  }

  private async compressSnapshot(snapshot: SnapshotBuffer): Promise<void> {
    if (!this.config.useCompression) return;

    try {
      // Use CompressionStream if available (modern browsers)
      if (typeof CompressionStream !== "undefined") {
        const jsonString = JSON.stringify(snapshot.data);
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(jsonString);

        const compressedStream = new Blob([uint8Array])
          .stream()
          .pipeThrough(new CompressionStream("gzip"));

        const compressedBlob = await new Response(compressedStream).blob();
        const compressedBuffer = await compressedBlob.arrayBuffer();

        // Convert to base64 for transmission
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(compressedBuffer))
        );

        // Replace data with compressed version
        snapshot.data = base64 as any;
        snapshot.metadata = {
          ...snapshot.metadata,
          compressed: true,
          originalSize: snapshot.size,
          compressionRatio: (
            compressedBuffer.byteLength / snapshot.size
          ).toFixed(2),
        };

        snapshot.size = compressedBuffer.byteLength;
      }
    } catch (error) {
      logger.debug(
        "[SDK] Compression failed, sending uncompressed data:",
        error
      );
      snapshot.metadata = {
        ...snapshot.metadata,
        compressed: false,
        originalSize: snapshot.size,
        compressionRatio: 0,
      };
    }
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    // Persist any remaining events before destroying
    if (this.buffer.length > 0) {
      this.flush(true);
    }

    // Reset batch time tracking
    this.lastBatchEndTime = undefined;
  }

  private startFlushTimer(): void {
    this.flushTimer = setTimeout(() => {
      logger.debug("[SDK] Flushing buffer due to timer");
      this.flush();
    }, this.config.flushInterval);
  }

  private resetFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    this.startFlushTimer();
  }

  private isInteractiveEvent(event: EventType): boolean {
    if (event.type !== INCREMENTAL_SNAPSHOT_EVENT_TYPE) return false;
    const source = (event as { data?: { source?: number } }).data?.source;
    return typeof source === "number" && ACTIVE_SOURCES.indexOf(source as IncrementalSource) !== -1;
  }

  /**
   * Check if an event is an internal SDK log that should be filtered out
   */
  private isInternalSdkLog(event: EventType): boolean {
    // Check if it's a console event (type 6 in rrweb)

    if (event.type === 6 && event.data.plugin === CONSOLE_LOG_PLUGIN_NAME) {
      // Check if it's a console log with SDK prefix
      const consoleData = event.data.payload as LogData;
      if (consoleData.payload && Array.isArray(consoleData.payload)) {
        // Check the first argument of the console log
        const firstArg = consoleData.payload[0];
        // If it's a string containing [SDK], it's an internal log
        if (typeof firstArg === "string" && firstArg.includes("[SDK]")) {
          return true;
        }
      }
    }

    return false;
  }
}

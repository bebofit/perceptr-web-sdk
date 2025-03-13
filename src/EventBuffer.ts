import { v4 as uuidv4 } from "uuid";
import type {
  EventType,
  PersistedBufferData,
  SnapshotBuffer,
  UserIdentity,
} from "./types";
import {
  estimateSize,
  scheduleIdleTask,
  splitBuffer,
} from "./utils/sessionrecording-utils";
import { CONSOLE_LOG_PLUGIN_NAME, SEVEN_MEGABYTES } from "./common/defaults";
import { LogData } from "@rrweb/rrweb-plugin-console-record";

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
  persistenceKey: string; // localStorage key for persisted data
}

export class EventBuffer {
  private buffer: EventType[] = [];
  private bufferSize = 0;
  private lastFlushTime: number;
  private flushTimer?: ReturnType<typeof setTimeout>;
  private readonly config: InternalBufferConfig;
  private readonly sessionId: string;
  private readonly startTime: number;
  private readonly debug: boolean;
  private readonly onFlush: (data: SnapshotBuffer) => Promise<void>;
  private userIdentity?: UserIdentity;
  private isFlushInProgress = false;
  private flushFailures = 0;
  private backoffUntil = 0;
  private unloadHandlerAttached = false;

  constructor(
    sessionId: string,
    onFlush: (data: SnapshotBuffer) => Promise<void>,
    debug: boolean = false
  ) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
    this.lastFlushTime = this.startTime;
    this.onFlush = onFlush;
    this.debug = debug;

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
    this.checkForPersistedData();
  }

  private setupUnloadHandler(): void {
    if (typeof window === "undefined" || this.unloadHandlerAttached) return;

    // Handle browser close/refresh
    window.addEventListener("beforeunload", () => {
      this.persistBufferData();
    });

    // Handle mobile browser pausing
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.persistBufferData();
      }
    });

    this.unloadHandlerAttached = true;
  }

  private async checkForPersistedData(): Promise<void> {
    if (!this.config.persistenceEnabled || typeof localStorage === "undefined")
      return;

    try {
      const persistedDataStr = localStorage.getItem(this.config.persistenceKey);
      if (!persistedDataStr) return;

      const persistedData: PersistedBufferData[] = JSON.parse(persistedDataStr);
      if (!Array.isArray(persistedData) || persistedData.length === 0) return;

      if (this.debug) {
        console.debug(
          `[SDK] Found ${persistedData.length} persisted buffer(s) to send`
        );
      }

      // Process each persisted buffer
      for (const data of persistedData) {
        try {
          // Create a snapshot from the persisted data
          const snapshot: SnapshotBuffer = {
            isSessionEnded: true,
            sessionId: data.sessionId,
            startTime: data.timestamp - 60000, // Approximate start time (1 minute before)
            endTime: data.timestamp,
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
          const splitSnapshots = splitBuffer(snapshot);
          for (const splitSnapshot of splitSnapshots) {
            await this.onFlush(splitSnapshot);
          }
          persistedData.splice(persistedData.indexOf(data), 1);
          if (this.debug) {
            console.debug(
              `[SDK] Successfully sent persisted buffer for session ${data.sessionId}`
            );
          }
        } catch (error) {
          if (this.debug) {
            console.error(
              `[SDK] Failed to send persisted buffer for session ${data.sessionId}:`,
              error
            );
          }
        }
      }
      if (persistedData.length > 0) {
        localStorage.setItem(
          this.config.persistenceKey,
          JSON.stringify(persistedData)
        );
      } else {
        localStorage.removeItem(this.config.persistenceKey);
      }
    } catch (error) {
      if (this.debug) {
        console.error("[SDK] Error processing persisted buffer data:", error);
      }
      // Clear potentially corrupted data
      localStorage.removeItem(this.config.persistenceKey);
    }
  }

  private persistBufferData(): void {
    if (
      !this.config.persistenceEnabled ||
      typeof localStorage === "undefined" ||
      this.buffer.length === 0
    )
      return;

    try {
      // Get existing persisted data
      let persistedData: PersistedBufferData[] = [];
      const existingData = localStorage.getItem(this.config.persistenceKey);

      if (existingData) {
        try {
          persistedData = JSON.parse(existingData);
          if (!Array.isArray(persistedData)) {
            persistedData = [];
          }
        } catch (e) {
          persistedData = [];
        }
      }

      const existingSession = persistedData.find(
        (data) => data.sessionId === this.sessionId
      );

      if (existingSession) {
        existingSession.events = [...this.buffer];
      } else {
        // Add current buffer to persisted data
        persistedData.push({
          sessionId: this.sessionId,
          timestamp: Date.now(),
          events: [...this.buffer],
          userIdentity: this.userIdentity,
          size: this.bufferSize,
        });
      }
      // Limit the number of persisted sessions (keep last 3)
      if (persistedData.length > 3) {
        persistedData = persistedData.slice(-3);
      }

      // Store the data
      // TODO: we can use IndexedDB instead of localStorage for persistence
      localStorage.setItem(
        this.config.persistenceKey,
        JSON.stringify(persistedData)
      );

      if (this.debug) {
        console.debug(
          `[SDK] Persisted buffer with ${this.buffer.length} events for session ${this.sessionId}`
        );
      }
    } catch (error) {
      if (this.debug) {
        console.error("[SDK] Failed to persist buffer data:", error);
      }
    }
  }

  public addEvent(event: EventType): void {
    // Skip internal SDK logs
    if (this.isInternalSdkLog(event)) {
      return;
    }

    // Estimate the size of the event
    const eventSize = estimateSize(event);
    const now = Date.now();

    // Add the event to the buffer
    this.buffer.push(event);
    this.bufferSize += eventSize;

    // Check if we should attempt to flush
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
      if (this.debug) {
        console.debug("[SDK] Scheduling buffer flush");
      }
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
      if (this.debug) {
        console.debug(
          `[SDK] In backoff period, skipping flush. Will retry in ${Math.ceil(
            (this.backoffUntil - now) / 1000
          )}s`
        );
      }
      return;
    }

    this.isFlushInProgress = true;
    const bufferData = [...this.buffer];
    const bufferSize = this.bufferSize;

    if (this.debug) {
      console.debug(
        `[SDK] Flushing buffer with ${bufferData.length} events (${bufferSize} bytes)`
      );
    }

    // Determine if compression should be used
    const shouldCompress =
      this.config.useCompression &&
      bufferSize > this.config.compressionThreshold;

    // Create the snapshot buffer
    const snapshot: SnapshotBuffer = {
      isSessionEnded,
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: now,
      size: bufferSize,
      data: bufferData,
      metadata: {
        bufferCount: uuidv4(),
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
      const splitSnapshots = splitBuffer(snapshot);
      for (const splitSnapshot of splitSnapshots) {
        await this.onFlush(splitSnapshot);
      }

      // Success! Clear the buffer and reset failure count
      this.buffer = [];
      this.bufferSize = 0;
      this.lastFlushTime = now;
      this.flushFailures = 0;
      this.backoffUntil = 0;

      // Reset the flush timer
      this.resetFlushTimer();
    } catch (error) {
      // Increment failure count and implement exponential backoff
      this.flushFailures++;

      // Calculate backoff time with exponential increase
      const backoffTime = Math.min(
        this.config.backoffInterval * Math.pow(2, this.flushFailures - 1),
        this.config.maxBackoffInterval
      );

      this.backoffUntil = now + backoffTime;

      if (this.debug) {
        console.error(
          `[SDK] Failed to flush buffer (attempt ${
            this.flushFailures
          }). Backing off for ${backoffTime / 1000}s until ${new Date(
            this.backoffUntil
          ).toISOString()}`
        );
      }

      // If buffer is getting too large despite failures, we might need to drop some events
      if (this.bufferSize > SEVEN_MEGABYTES * 20) {
        const eventsToKeep = Math.floor(this.buffer.length * 0.8); // Keep 80% of events
        if (this.debug) {
          console.warn(
            `[SDK] Buffer too large after flush failures. Dropping ${
              this.buffer.length - eventsToKeep
            } oldest events`
          );
        }
        this.buffer = this.buffer.slice(-eventsToKeep);
        this.recalculateBufferSize();
      }
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
      if (this.debug) {
        console.warn(
          "[SDK] Compression failed, sending uncompressed data:",
          error
        );
      }
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
      this.persistBufferData();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setTimeout(() => {
      if (this.debug) {
        console.debug("[SDK] Flushing buffer due to timer");
      }
      this.flush();
    }, this.config.flushInterval);
  }

  private resetFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    this.startFlushTimer();
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

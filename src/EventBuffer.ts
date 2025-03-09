import { v4 as uuidv4 } from "uuid";
import type { EventType, SnapshotBuffer, UserIdentity } from "./types";
import {
  estimateSize,
  scheduleIdleTask,
  splitBuffer,
} from "./utils/sessionrecording-utils";
import { SEVEN_MEGABYTES } from "./common/defaults";

// Internal configuration - not exposed to users
interface InternalBufferConfig {
  maxBufferSize: number; // in bytes
  flushInterval: number; // in ms
  maxBufferAge: number; // in ms
  compressionThreshold: number; // in bytes
  useCompression: boolean;
  backoffInterval: number; // in ms
  maxBackoffInterval: number; // in ms
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
    };

    this.startFlushTimer();
  }

  public addEvent(event: EventType): void {
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
    if (this.debug) {
      console.debug(
        `[SDK] Buffer updated with user identity: ${identity.distinctId}`
      );
    }
  }

  public async flush(force: boolean = false): Promise<void> {
    if (this.buffer.length === 0 || this.isFlushInProgress) return;

    const now = Date.now();

    // Check if we're in a backoff period
    if (now < this.backoffUntil && !force) {
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
}

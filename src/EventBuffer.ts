import { v4 as uuidv4 } from "uuid";
import type { 
    EventType,
  SnapshotBuffer,
  UserIdentity
} from "./types";
import { estimateSize, scheduleIdleTask } from "./utils/sessionrecording-utils";


// Internal configuration - not exposed to users
interface InternalBufferConfig {
  maxBufferSize: number; // in bytes
  flushInterval: number; // in ms
  maxBufferAge: number; // in ms
  compressionThreshold: number; // in bytes
  useCompression: boolean;
  retryAttempts: number;
  retryDelay: number; // in ms
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
      retryAttempts: 3,
      retryDelay: 5000, // 5 seconds
    };

    this.startFlushTimer();
  }

  public addEvent(event: EventType): void {
    // Estimate the size of the event
    const eventSize = estimateSize(event);
    const now = Date.now();

   // If buffer is getting close to max size (90%), schedule a flush
   if (this.bufferSize  + eventSize > this.config.maxBufferSize * 0.9) {
    console.debug("[SDK] Flushing buffer due to size");
    scheduleIdleTask(() => this.flush());
  }
    // Check if buffer is too old and should be flushed
    if (now - this.lastFlushTime > this.config.maxBufferAge) {
      console.debug("[SDK] Flushing buffer due to age");
      this.flush();
    }
    
    // Add the event to the buffer
    this.buffer.push(event);
    this.bufferSize += eventSize;
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
      console.debug(`[SDK] Buffer updated with user identity: ${identity.distinctId}`);
    }
  }

  public async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const now = Date.now();
    const bufferData = [...this.buffer];
    const bufferSize = this.bufferSize;
    
    // Clear the buffer
    this.buffer = [];
    this.bufferSize = 0;
    this.lastFlushTime = now;
    
    // Reset the flush timer
    this.resetFlushTimer();
    
    if (this.debug) {
      console.debug(`[SDK] Flushing buffer with ${bufferData.length} events (${bufferSize} bytes)`);
    }
    
    // Determine if compression should be used
    const shouldCompress = this.config.useCompression && bufferSize > this.config.compressionThreshold;
    
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
        compressed: shouldCompress
      },
      userIdentity: this.userIdentity
    };
    
    // Compress data if needed
    if (shouldCompress) {
      await this.compressSnapshot(snapshot);
    }
    
    // Send the data to the server
    try {
      await this.onFlushWithRetry(snapshot);
    } catch (error) {
      if (this.debug) {
        console.error("[SDK] Failed to flush buffer after retries:", error);
      }
      // Put the events back in the buffer for next flush
      this.buffer = [...bufferData, ...this.buffer];
      this.bufferSize = bufferSize + this.bufferSize;
    }
  }

  private async onFlushWithRetry(snapshot: SnapshotBuffer, attempt = 0): Promise<void> {
    try {
      await this.onFlush(snapshot);
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        if (this.debug) {
          console.warn(`[SDK] Retry attempt ${attempt + 1}/${this.config.retryAttempts} after ${this.config.retryDelay}ms`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        
        // Exponential backoff for retry delay
        const nextDelay = Math.min(this.config.retryDelay * Math.pow(2, attempt), 60000);
        this.config.retryDelay = nextDelay;
        
        // Retry
        return this.onFlushWithRetry(snapshot, attempt + 1);
      }
      
      // All retries failed
      throw error;
    }
  }

  private async compressSnapshot(snapshot: SnapshotBuffer): Promise<void> {
    if (!this.config.useCompression) return;
    
    try {
      // Use CompressionStream if available (modern browsers)
      if (typeof CompressionStream !== 'undefined') {
        const jsonString = JSON.stringify(snapshot.data);
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(jsonString);
        
        const compressedStream = new Blob([uint8Array]).stream().pipeThrough(
          new CompressionStream('gzip')
        );
        
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
          compressionRatio: (compressedBuffer.byteLength / snapshot.size).toFixed(2)
        };
        
        snapshot.size = compressedBuffer.byteLength;
      }
    } catch (error) {
      if (this.debug) {
        console.warn("[SDK] Compression failed, sending uncompressed data:", error);
      }
      snapshot.metadata = {
        ...snapshot.metadata,
        compressed: false,
        originalSize: snapshot.size,
        compressionRatio: 0
      };
    }
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    
    // Flush any remaining events
    if (this.buffer.length > 0) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setTimeout(() => {
        console.debug("[SDK] Flushing buffer due to timer");
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

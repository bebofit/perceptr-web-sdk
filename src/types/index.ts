import { NetworkMonitor } from "../NetworkMonitor";
import { SessionRecorder } from "../SessionRecorder";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";
import type { eventWithTime } from "@rrweb/types";

export interface SessionConfig {
  urlBlocklist?: SessionRecordingUrlTrigger[];
  maxEvents?: number;
  sampling?: {
    mousemove?: number;
    scroll?: number;
    input?: "all" | "last";
  };
  blockClass?: string;
  ignoreClass?: string;
  maskTextClass?: string;
  blockSelector?: string;
  maskTextSelector?: string;
  idleTimeout?: number;
  console?: Parameters<typeof getRecordConsolePlugin>[0];
}

// Internal configuration for mutation throttling
export interface MutationThrottlingConfig {
  enabled: boolean;
  bucketSize: number;
  refillRate: number;
}


export interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: eventWithTime[];
}

export interface NetworkRequest {
  type: 7,
  id: string;
  timestamp: number;
  duration: number;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  error?: string;
}

export interface NetworkMonitorConfig {
  maxRequests?: number;
  sanitizeHeaders?: string[];
  sanitizeParams?: string[];
  sanitizeBodyFields?: string[];
  captureRequestBody?: boolean;
  captureResponseBody?: boolean;
  maxBodySize?: number;
  excludeUrls?: RegExp[];
}



export interface PerformanceConfig {
  memoryLimit?: number; // in bytes
  throttle?: {
    mousemove?: number; // in ms
    scroll?: number; // in ms
    input?: number; // in ms
  };
}

export interface CoreConfig {
  debug?: boolean;
  session?: SessionConfig;
  network?: NetworkMonitorConfig;
  console?: Parameters<typeof getRecordConsolePlugin>[0];
  metadata?: Record<string, any>;
  performance?: PerformanceConfig;
}

export interface SessionCore {
  sessionRecorder: SessionRecorder;
  networkMonitor: NetworkMonitor;
}

export interface ExportedSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  metadata?: Record<string, any>;
  rrwebEvents: eventWithTime[];
  networkRequests: NetworkRequest[];
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

export type EventType = eventWithTime | NetworkRequest;

export interface SnapshotBuffer {
  size: number
  data: EventType[]
  startTime: number;
  endTime?: number;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface SessionRecordingUrlTrigger {
  url: string
  matching: 'regex'
}

import { ConsoleLogger } from "../ConsoleLogger";
import { NetworkMonitor } from "../NetworkMonitor";
import { SessionRecorder } from "../SessionRecorder";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";
import type { eventWithTime } from "@rrweb/types";

export interface SessionConfig {
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


export interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: eventWithTime[];
}

export interface NetworkRequest {
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
  captureRequestBody?: boolean;
  captureResponseBody?: boolean;
  excludeUrls?: RegExp[];
}

export interface ConsoleLog {
  id: string;
  timestamp: number;
  level: "log" | "info" | "warn" | "error" | "debug";
  args: any[];
  stack?: string;
}

export interface ConsoleLoggerConfig {
  maxLogs?: number;
  ignore?: ConsoleLog["level"][];
  maxPayloadSize?: number;
  captureStack?: boolean;
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
  console?: ConsoleLoggerConfig;
  metadata?: Record<string, any>;
  performance?: PerformanceConfig;
}

export interface SessionCore {
  sessionRecorder: SessionRecorder;
  networkMonitor: NetworkMonitor;
  consoleLogger: ConsoleLogger;
}

export interface ExportedSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  metadata?: Record<string, any>;
  rrwebEvents: eventWithTime[];
  networkRequests: NetworkRequest[];
  consoleLogs: ConsoleLog[];
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

export type EventType = eventWithTime | NetworkRequest | ConsoleLog;

export interface SnapshotBuffer {
  size: number
  data: EventType[]
  startTime: number;
  endTime?: number;
  sessionId: string;
  metadata?: Record<string, any>;
}

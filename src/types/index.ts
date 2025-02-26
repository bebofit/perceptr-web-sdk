import { Breadcrumbs } from "../Breadcrumbs";
import { ConsoleLogger } from "../ConsoleLogger";
import { NetworkMonitor } from "../NetworkMonitor";
import { DataAggregator } from "../SessionAggregator";
import { SessionRecorder } from "../SessionRecorder";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";

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

export interface SessionEvent {
  timestamp: number;
  type: string;
  data: any;
}

export interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: SessionEvent[];
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

export interface Breadcrumb {
  id: string;
  timestamp: number;
  category: "user" | "error" | "navigation" | "input" | "custom";
  type: string;
  message: string;
  level: "info" | "warning" | "error";
  data?: Record<string, any>;
}

export interface BreadcrumbsConfig {
  maxBreadcrumbs?: number;
  enableAutoCapture?: boolean;
  dom?: {
    clickTargets?: boolean;
    inputSummary?: boolean;
    inputDebounceMs?: number;
  };
  console?: {
    levels?: ("log" | "info" | "warn" | "error")[];
  };
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

export interface AggregatedEvent {
  timestamp: number;
  type: "rrweb" | "network" | "console" | "breadcrumb";
  data: SessionEvent | NetworkRequest | ConsoleLog | Breadcrumb;
}

export interface SessionAggregator {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: AggregatedEvent[];
}

export interface ExportedSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  metadata?: Record<string, any>;
  rrwebEvents: SessionEvent[];
  networkRequests: NetworkRequest[];
  breadcrumbs: Breadcrumb[];
  consoleLogs: ConsoleLog[];
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
  session?: SessionConfig;
  network?: NetworkMonitorConfig;
  console?: ConsoleLoggerConfig;
  breadcrumbs?: BreadcrumbsConfig;
  metadata?: Record<string, any>;
  performance?: PerformanceConfig;
}

export interface SessionCore {
  sessionRecorder: SessionRecorder;
  networkMonitor: NetworkMonitor;
  consoleLogger: ConsoleLogger;
  breadcrumbs: Breadcrumbs;
  aggregator: DataAggregator;
}

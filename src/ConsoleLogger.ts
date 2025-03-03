import { v4 as uuidv4 } from "uuid";
import type { ConsoleLog, ConsoleLoggerConfig } from "./types";

export class ConsoleLogger {
  private logs: ConsoleLog[] = [];
  private originalMethods: Partial<Console> = {};
  private isEnabled = false;
  private debug = false;

  private readonly config: Required<ConsoleLoggerConfig> = {
    maxLogs: 1000,
    ignore: [],
    maxPayloadSize: 1024,
    captureStack: true,
  };

  constructor(config: ConsoleLoggerConfig = {}, debug: boolean = false) {
    this.config = { ...this.config, ...config };
    this.debug = debug;
  }

  public enable(): void {
    if (this.isEnabled) {
      if(this.debug) {
        console.warn("[SDK] ConsoleLogger already enabled");
      }
      return;
    }

    // Store original methods
    this.originalMethods = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    // Patch console methods
    const levels: ConsoleLog["level"][] = [
      "log",
      "info",
      "warn",
      "error",
      "debug",
    ];

    levels.forEach((level) => {
      if (this.config.ignore.includes(level)) return;

      console[level] = (...args: any[]) => {
        this.captureLog(level, args);
        this.originalMethods[level]?.apply(console, args);
      };
    });

    this.isEnabled = true;
  }

  public disable(): void {
    if (!this.isEnabled) return;

    // Restore original methods
    Object.entries(this.originalMethods).forEach(([level, method]) => {
      if (method) {
        console[level] = method;
      }
    });

    this.isEnabled = false;
  }

  public getLogs(): ConsoleLog[] {
    return this.logs;
  }

  public clear(): void {
    this.logs = [];
  }

  private captureLog(level: ConsoleLog["level"], args: any[]): void {
    const log: ConsoleLog = {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      args: this.sanitizeArgs(args),
    };

    if (this.config.captureStack && level === "error") {
      const error = args.find((arg) => arg instanceof Error);
      if (error) {
        log.stack = error.stack;
      } else {
        log.stack = new Error().stack?.split("\n").slice(2).join("\n");
      }
    }

    this.logs.push(log);
    if (this.logs.length > this.config.maxLogs) {
      this.logs.shift();
    }
  }

  private sanitizeArgs(args: any[]): any[] {
    return args.map((arg) => {
      if (arg === null || arg === undefined) return arg;

      // Handle Error objects
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: arg.message,
          stack: arg.stack,
        };
      }

      // Handle circular references and large objects
      try {
        const str = JSON.stringify(arg);
        if (str.length > this.config.maxPayloadSize) {
          return `[Truncated payload: ${str.slice(
            0,
            this.config.maxPayloadSize
          )}...]`;
        }
        return JSON.parse(str);
      } catch (e) {
        // If JSON serialization fails (e.g., circular references)
        return String(arg);
      }
    });
  }
}

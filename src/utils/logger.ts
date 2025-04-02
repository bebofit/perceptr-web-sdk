export interface LoggerConfig {
  debug?: boolean;
}

class Logger {
  private static instance: Logger;
  private isDebugEnabled: boolean = false;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public configure(config: LoggerConfig): void {
    this.isDebugEnabled = !!config.debug;
  }

  public debug(...args: any[]): void {
    if (this.isDebugEnabled) {
      console.debug("[SDK] ", ...args);
    }
  }

  public warn(...args: any[]): void {
    if (this.isDebugEnabled) {
      console.warn("[SDK] ", ...args);
    }
  }

  public error(...args: any[]): void {
    if (this.isDebugEnabled) {
      console.error("[SDK] ", ...args);
    }
  }

  public forceLog(level: "debug" | "warn" | "error", ...args: any[]): void {
    console[level](...args);
  }
}

export const logger = Logger.getInstance();

import { record } from "rrweb";
import { v4 as uuidv4 } from "uuid";
import type { SessionConfig, SessionData, SessionEvent } from "./types";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";

export class SessionRecorder {
  private events: SessionEvent[] = [];
  private recording = false;
  private stopFn?: () => void;
  private sessionId: string = "";
  private startTime: number = 0;
  private idleTimeout?: any;
  private readonly config: Required<SessionConfig>;

  constructor(config: SessionConfig = {}) {
    this.config = {
      console: {
        level: config.console?.level ?? ["log", "info", "warn", "error"],
        logger: config.console?.logger ?? "console",
        stringifyOptions: config.console?.stringifyOptions ?? {
          stringLengthLimit: 1000,
          numOfKeysLimit: 100,
          depthOfLimit: 10,
        },
      },
      maxEvents: config.maxEvents ?? 10000,
      sampling: {
        mousemove: config.sampling?.mousemove ?? 50,
        scroll: config.sampling?.scroll ?? 50,
        input: config.sampling?.input ?? "all",
      },
      blockClass: config.blockClass ?? "perceptr-block",
      ignoreClass: config.ignoreClass ?? "perceptr-ignore",
      maskTextClass: config.maskTextClass ?? "perceptr-mask",
      blockSelector: config.blockSelector ?? "",
      maskTextSelector: config.maskTextSelector ?? "",
      idleTimeout: config.idleTimeout ?? 60000, // 1 minute default
    };
  }

  public startSession(): string {
    if (this.recording) {
      return this.sessionId;
    }

    this.sessionId = uuidv4();
    this.startTime = Date.now();
    this.events = [];

    this.stopFn = record({
      emit: (event) => {
        this.addEvent({
          timestamp: event.timestamp,
          type: event.type.toString(),
          data: event,
        });
      },
      plugins: [
        getRecordConsolePlugin({
          lengthThreshold: this.config.console?.lengthThreshold,
          level: this.config.console?.level,
          logger: this.config.console?.logger,
          stringifyOptions: this.config.console?.stringifyOptions,
        }),
      ],
      sampling: this.config.sampling,
      blockClass: this.config.blockClass,
      ignoreClass: this.config.ignoreClass,
      maskTextClass: this.config.maskTextClass,
      blockSelector: this.config.blockSelector,
      maskTextSelector: this.config.maskTextSelector,
      inlineStylesheet: true,
      recordCrossOriginIframes: true,
    });

    this.recording = true;
    this.resetIdleTimeout();

    return this.sessionId;
  }

  public stopSession(): SessionData {
    if (!this.recording || !this.stopFn) {
      throw new Error("No active recording session");
    }

    this.stopFn();
    this.recording = false;
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: Date.now(),
      events: this.events,
    };
  }

  public pause(): void {
    if (!this.recording || !this.stopFn) {
      return;
    }

    this.stopFn();
    this.recording = false;
  }

  public resume(): void {
    if (this.recording) {
      return;
    }

    this.startSession();
  }

  private addEvent(event: SessionEvent): void {
    this.events.push(event);
    if (this.events.length > this.config.maxEvents) {
      this.events.shift();
    }
    this.resetIdleTimeout();
  }

  private resetIdleTimeout(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => {
      this.pause();
    }, this.config.idleTimeout);
  }

  public getCurrentSession(): SessionData | null {
    if (!this.recording) {
      return null;
    }

    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      events: this.events,
    };
  }
}

import { record} from "rrweb";
import type { SessionConfig } from "./types";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";
import type { eventWithTime } from "@rrweb/types";

export class SessionRecorder {
  private events: eventWithTime[] = [];
  private isRecording = false;
  private stopFn?: () => void;
  private idleTimeout?: any;
  private readonly config: Required<SessionConfig>;
  private readonly debug: boolean;

  constructor(config: SessionConfig = {}, debug: boolean = false) {
    this.debug = debug;
    this.config = {
      console: {
        lengthThreshold: config.console?.lengthThreshold ?? 1000,
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

  public startSession(): void {
    if (this.isRecording) {
      return;
    }
    this.stopFn = record({
      emit: (event) => {
        this.addEvent(event);
      },
      plugins: [
        // event type === '6' is console log
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

    this.isRecording = true;
    this.resetIdleTimeout();
  }

  public stopSession(): void {
    if (!this.isRecording ) {
      if(this.debug) {
        console.warn("[SDK] No active recording session");
      }
      return;
    }
    if(this.stopFn) {
      this.stopFn();
    }
    this.events = [];
    this.isRecording = false;
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
  }

  public pause(): void {
    if (!this.isRecording || !this.stopFn) {
      return;
    }

    this.stopFn();
    this.isRecording = false;
  }

  public resume(): void {
    if (this.isRecording) {
      return;
    }

    this.startSession();
  }

  private addEvent(event: eventWithTime): void {
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
      // TODO: Uncomment this when we have a way to resume the recording
      // this.pause();
    }, this.config.idleTimeout);
  }

  public getRecordingEvents(): eventWithTime[] {
    if (!this.isRecording) {
      throw new Error("No active recording session");
    }
    return this.events;
  }
}

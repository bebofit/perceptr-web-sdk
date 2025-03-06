import { record} from "rrweb";
import type { SessionConfig } from "./types";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";
import type { eventWithTime, IncrementalSource } from "@rrweb/types";
import { ACTIVE_SOURCES, INCREMENTAL_SNAPSHOT_EVENT_TYPE } from "./common/defaults";

export class SessionRecorder {
  private events: eventWithTime[] = [];
  private isRecording = false;
  private isPaused = false;
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
      idleTimeout: config.idleTimeout ?? 10000, // 10 seconds default
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
      checkoutEveryNms: 10000, // takes a snapshot every 10 seconds event 2 
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
    this.isPaused = false;
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
    this.isPaused = false;
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
  }

  public pause(): void {
    if (!this.isRecording || this.isPaused) {
      return;
    }

    this.isPaused = true;
    if (this.debug) {
      console.debug("[SDK] Recording paused");
    }
  }

  public resume(): void {
    if (!this.isRecording || !this.isPaused) {
      return;
    }

    this.isPaused = false;
    this.resetIdleTimeout();
    if (this.debug) {
      console.debug("[SDK] Recording resumed");
    }
  }

  private addEvent(event: eventWithTime): void {
    // If the event is an interactive event, resume the recording
    // otherwise the idle timeout will pause the recording
    if (this.isInteractiveEvent(event)) {
      this.resume();
    }
    // If the recording is paused, don't add the event
    if(this.isRecording && this.isPaused) {
      return;
    }
    this.events.push(event);
    if (this.events.length > this.config.maxEvents) {
      this.events.shift();
    }
  }

  private resetIdleTimeout(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => {
      if (this.isRecording && !this.isPaused) {
        this.pause();
        this.idleTimeout = undefined;
      }
    }, this.config.idleTimeout);
  }

  public getRecordingEvents(): eventWithTime[] {
    if (!this.isRecording) {
      throw new Error("No active recording session");
    }
    return this.events;
  }

  private isInteractiveEvent(event: eventWithTime) {
    return (
        event.type === INCREMENTAL_SNAPSHOT_EVENT_TYPE &&
        ACTIVE_SOURCES.indexOf(event.data?.source as IncrementalSource) !== -1
    )
}
}

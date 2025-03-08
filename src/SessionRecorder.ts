import { EventType, record } from "rrweb";
import type { MutationThrottlingConfig, SessionConfig } from "./types";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";
import type { eventWithTime, IncrementalSource, metaEvent } from "@rrweb/types";
import {
  ACTIVE_SOURCES,
  INCREMENTAL_SNAPSHOT_EVENT_TYPE,
} from "./common/defaults";
import { sessionRecordingUrlTriggerMatches } from "./utils/sessionrecording-utils";
import { MutationRateLimiter } from "./common/services/mutationRateLimiter";

export class SessionRecorder {
  private events: eventWithTime[] = [];
  private _isRecording = false;
  private _isPaused = false;
  private stopFn?: () => void;
  private _idleTimeout?: any;
  private readonly config: Required<SessionConfig>;
  private readonly _debug: boolean;
  private readonly _mutationConfig: MutationThrottlingConfig;
  private _lastHref?: string;
  private _isUrlBlocked = false;
  private mutationRateLimiter: MutationRateLimiter;

  constructor(config: SessionConfig = {}, debug: boolean = false) {
    this._debug = debug;
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
      urlBlocklist: config.urlBlocklist ?? [],
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

    // Internal mutation throttling configuration
    this._mutationConfig = {
      enabled: true,
      bucketSize: 100,
      refillRate: 10
    };

    // Initialize the mutation rate limiter
    this.mutationRateLimiter = new MutationRateLimiter(record, {
      bucketSize: this._mutationConfig.bucketSize,
      refillRate: this._mutationConfig.refillRate,
      onBlockedNode: (id, node) => {
        if (this._debug) {
          console.debug(`[SDK] Throttling mutations for node ${id}`, node);
        }
      }
    });
  }

  public startSession(): void {
    if (this._isRecording) {
      return;
    }
    this.stopFn = record({
      emit: (event) => {
        // Apply mutation rate limiting before processing the event
        if (this._mutationConfig.enabled) {
          const throttledEvent = this.mutationRateLimiter.throttleMutations(event);
          // If the event was completely throttled, don't process it
          if (throttledEvent) return;
        }
        this._canAddEvent(event);
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

    this._isRecording = true;
    this._isPaused = false;
    this._resetIdleTimeout();
  }

  public stopSession(): void {
    if (!this._isRecording) {
      if (this._debug) {
        console.warn("[SDK] No active recording session");
      }
      return;
    }
    if (this.stopFn) {
      this.stopFn();
    }
    this.events = [];
    this._isRecording = false;
    this._isPaused = false;
    if (this._idleTimeout) {
      clearTimeout(this._idleTimeout);
    }
  }

  public pause(): void {
    if (!this._isRecording || this._isPaused) {
      return;
    }

    this._isPaused = true;
    if (this._debug) {
      console.debug("[SDK] Recording paused");
    }
  }

  public resume(): void {
    if (!this._isRecording || !this._isPaused) {
      return;
    }

    this._isPaused = false;
    if (this._debug) {
      console.debug("[SDK] Recording resumed");
    }
  }

  private _canAddEvent(event: eventWithTime): boolean {
    // If the event is an interactive event, resume the recording
    // otherwise the idle timeout will pause the recording
    if (this._isInteractiveEvent(event) && !this._isUrlBlocked) {
      this._resetIdleTimeout();
      this.resume();
    }
    // If the recording is paused, don't add the event
    if (this._isRecording && this._isPaused) {
      return false;
    }

    // Handle page view events
    if (event.type === EventType.Meta) {
      this._checkMetaEvent(event);
    } else {
      this._pageViewFallBack();
    }

    this.events.push(event);
    if (this.events.length > this.config.maxEvents) {
      this.events.shift();
    }
    return true;
  }

  private _checkMetaEvent(event: metaEvent) {
    const href = event.data.href;
    if (!href) {
      return false;
    }
    this._lastHref = href;
    this._shouldBlockUrl(href);
  }

  private _pageViewFallBack() {
    if (typeof window === "undefined" || !window.location.href) {
      return;
    }
    const currentUrl = window.location.href;
    if (this._lastHref !== currentUrl) {
      this._lastHref = currentUrl;
      this._tryAddCustomEvent("$url_changed", { href: currentUrl });
      this._shouldBlockUrl(currentUrl);
    }
  }

  private _shouldBlockUrl(url: string) {
    if (typeof window === "undefined" || !window.location.href) {
      return;
    }

    const isNowBlocked = sessionRecordingUrlTriggerMatches(
      url,
      this.config.urlBlocklist
    );
    this._isUrlBlocked = isNowBlocked;
    if (isNowBlocked && !this._isPaused) {
      this.pause();
    } else if (!isNowBlocked && this._isPaused) {
      this.resume();
    }
  }

  private _resetIdleTimeout(): void {
    if (this._idleTimeout) {
      clearTimeout(this._idleTimeout);
    }

    this._idleTimeout = setTimeout(() => {
      if (this._isRecording && !this._isPaused) {
        this.pause();
        this._idleTimeout = undefined;
      }
    }, this.config.idleTimeout);
  }

  private _isInteractiveEvent(event: eventWithTime) {
    return (
      event.type === INCREMENTAL_SNAPSHOT_EVENT_TYPE &&
      ACTIVE_SOURCES.indexOf(event.data?.source as IncrementalSource) !== -1
    );
  }

  private _tryAddCustomEvent(tag: string, payload: any) {
    record.addCustomEvent(tag, payload);
  }

  public getRecordingEvents(): eventWithTime[] {
    if (!this._isRecording) {
      throw new Error("No active recording session");
    }
    return this.events;
  }

  public onEvent(callback: (event: eventWithTime) => void): () => void {
    const originalAddEvent = this._canAddEvent;
    this._canAddEvent = (event) => {
      const canBeAdded = originalAddEvent.call(this, event);
      if (canBeAdded) {
        // if the event can be added, call the callback to add it to the buffer
        callback(event);
      }
      return canBeAdded;
    };

    // Return a function to unsubscribe
    return () => {
      this._canAddEvent = originalAddEvent;
    };
  }
}

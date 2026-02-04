import { v4 as uuidv4 } from "uuid";
import type { PersistedSessionState, UserIdentity } from "../../types";
import {
  DEFAULT_INACTIVITY_TIMEOUT_MS,
  DEFAULT_MAX_SESSION_DURATION_MS,
} from "../defaults";
import { logger } from "../../utils/logger";

/** Config for SessionManager; maps from session/buffer config with backward compat for staleThreshold. */
export interface SessionManagerConfig {
  /** Inactivity timeout in ms. If not set, staleThreshold is used; else default 30 min. */
  inactivityTimeout?: number;
  /** Max session duration in ms. Default 24 hours. */
  maxSessionDuration?: number;
  /** @deprecated Maps to inactivityTimeout when inactivityTimeout is not provided. */
  staleThreshold?: number;
}

const SESSION_STORAGE_KEY = "perceptr_session_state";
const BROADCAST_CHANNEL_NAME = "perceptr_session";

/**
 * Centralized activity-based session state. Uses sessionStorage (tab-specific)
 * and optionally BroadcastChannel for coordination. Session continuation is
 * decided by lastActivityTime and simple time thresholds.
 */
export class SessionManager {
  private readonly inactivityTimeout: number;
  private readonly maxSessionDuration: number;
  private readonly persistenceKey: string;
  private readonly broadcastChannel: BroadcastChannel | null = null;
  private currentState: PersistedSessionState | null = null;

  constructor(config: SessionManagerConfig = {}) {
    const inactivityFromStale =
      config.staleThreshold != null && config.inactivityTimeout == null
        ? config.staleThreshold
        : undefined;
    this.inactivityTimeout =
      config.inactivityTimeout ??
      inactivityFromStale ??
      DEFAULT_INACTIVITY_TIMEOUT_MS;
    this.maxSessionDuration =
      config.maxSessionDuration ?? DEFAULT_MAX_SESSION_DURATION_MS;
    this.persistenceKey = SESSION_STORAGE_KEY;
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    }
  }

  /**
   * Returns true if the session should continue: user was active recently
   * and session has not exceeded max duration.
   */
  public shouldContinueSession(
    lastActivityTime: number,
    sessionStartTime: number,
    currentTime: number
  ): boolean {
    const timeSinceActivity = currentTime - lastActivityTime;
    const sessionDuration = currentTime - sessionStartTime;
    return (
      timeSinceActivity < this.inactivityTimeout &&
      sessionDuration < this.maxSessionDuration
    );
  }

  /**
   * Returns existing session state if it should continue, otherwise creates
   * a new session. Persists to sessionStorage and optionally broadcasts.
   */
  public getOrCreateSession(): PersistedSessionState {
    if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
      const newState = this.createNewSessionState();
      this.currentState = newState;
      return newState;
    }
    const existing = this.readPersistedState();
    const now = Date.now();
    if (
      existing &&
      this.shouldContinueSession(
        existing.lastActivityTime,
        existing.startTime,
        now
      )
    ) {
      this.currentState = existing;
      logger.debug("Continuing previous session (activity within threshold)");
      return existing;
    }
    const newState = this.createNewSessionState();
    this.currentState = newState;
    this.persistState(newState);
    this.broadcastSessionStart(newState);
    logger.debug("Starting new session");
    return newState;
  }

  /**
   * Updates last activity timestamp, persists to sessionStorage, and
   * optionally broadcasts so other tabs can react.
   */
  public updateActivity(): void {
    if (!this.currentState) {
      return;
    }
    const now = Date.now();
    this.currentState = {
      ...this.currentState,
      lastActivityTime: now,
    };
    this.persistState(this.currentState);
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: "activity",
          lastActivityTime: now,
          sessionId: this.currentState.sessionId,
        });
      } catch {
        // Ignore broadcast errors
      }
    }
  }

  /**
   * Sets the current in-memory session state (e.g. after getOrCreateSession
   * was called elsewhere). Used when Core passes state into EventBuffer and
   * we need SessionManager to track the same session for updateActivity().
   */
  public setCurrentState(state: PersistedSessionState): void {
    this.currentState = state;
  }

  /** Returns the current in-memory session state, if any. */
  public getCurrentState(): PersistedSessionState | null {
    return this.currentState;
  }

  private createNewSessionState(
    userIdentity?: UserIdentity
  ): PersistedSessionState {
    const now = Date.now();
    return {
      sessionId: uuidv4(),
      startTime: now,
      lastActivityTime: now,
      userIdentity,
    };
  }

  private readPersistedState(): PersistedSessionState | null {
    try {
      const raw = sessionStorage.getItem(this.persistenceKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedSessionState;
      if (
        typeof parsed.sessionId === "string" &&
        typeof parsed.startTime === "number" &&
        typeof parsed.lastActivityTime === "number"
      ) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  private persistState(state: PersistedSessionState): void {
    if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
      return;
    }
    try {
      sessionStorage.setItem(this.persistenceKey, JSON.stringify(state));
    } catch (err) {
      logger.error("Failed to persist session state", err);
    }
  }

  private broadcastSessionStart(state: PersistedSessionState): void {
    if (!this.broadcastChannel) return;
    try {
      this.broadcastChannel.postMessage({
        type: "session_start",
        sessionId: state.sessionId,
        startTime: state.startTime,
        lastActivityTime: state.lastActivityTime,
      });
    } catch {
      // Ignore broadcast errors
    }
  }
}

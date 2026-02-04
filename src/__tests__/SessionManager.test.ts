/**
 * SessionManager: activity-based session decision and persistence.
 * Tests shouldContinueSession logic and getOrCreateSession behavior.
 */

import { SessionManager } from "../common/services/SessionManager";

const THIRTY_MIN_MS = 30 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

describe("SessionManager", () => {
  describe("shouldContinueSession", () => {
    const inactivityTimeout = THIRTY_MIN_MS;
    const maxSessionDuration = TWENTY_FOUR_HOURS_MS;

    test("returns true when within inactivity timeout and max duration", () => {
      const manager = new SessionManager({
        inactivityTimeout,
        maxSessionDuration,
      });
      const now = Date.now();
      const lastActivityTime = now - 5 * 60 * 1000; // 5 min ago
      const sessionStartTime = now - 60 * 60 * 1000; // 1 hour ago
      expect(
        manager.shouldContinueSession(
          lastActivityTime,
          sessionStartTime,
          now
        )
      ).toBe(true);
    });

    test("returns false when inactivity exceeds timeout", () => {
      const manager = new SessionManager({
        inactivityTimeout,
        maxSessionDuration,
      });
      const now = Date.now();
      const lastActivityTime = now - 35 * 60 * 1000; // 35 min ago
      const sessionStartTime = now - 60 * 60 * 1000;
      expect(
        manager.shouldContinueSession(
          lastActivityTime,
          sessionStartTime,
          now
        )
      ).toBe(false);
    });

    test("returns false when session duration exceeds max", () => {
      const manager = new SessionManager({
        inactivityTimeout,
        maxSessionDuration,
      });
      const now = Date.now();
      const lastActivityTime = now - 60 * 1000; // 1 min ago
      const sessionStartTime = now - 25 * 60 * 60 * 1000; // 25 hours ago
      expect(
        manager.shouldContinueSession(
          lastActivityTime,
          sessionStartTime,
          now
        )
      ).toBe(false);
    });

    test("uses staleThreshold as inactivityTimeout when provided without inactivityTimeout", () => {
      const oneHour = 60 * 60 * 1000;
      const manager = new SessionManager({
        staleThreshold: oneHour,
        maxSessionDuration,
      });
      const now = Date.now();
      const lastActivityTime = now - 45 * 60 * 1000; // 45 min ago - within 1h
      const sessionStartTime = now - 2 * 60 * 60 * 1000;
      expect(
        manager.shouldContinueSession(
          lastActivityTime,
          sessionStartTime,
          now
        )
      ).toBe(true);
      const lastActivityTimeStale = now - 65 * 60 * 1000; // 65 min - over 1h
      expect(
        manager.shouldContinueSession(
          lastActivityTimeStale,
          sessionStartTime,
          now
        )
      ).toBe(false);
    });
  });

  describe("getOrCreateSession", () => {
    test("returns new session state with required fields when no storage", () => {
      const manager = new SessionManager({
        inactivityTimeout: THIRTY_MIN_MS,
        maxSessionDuration: TWENTY_FOUR_HOURS_MS,
      });
      const state = manager.getOrCreateSession();
      expect(state).toMatchObject({
        sessionId: expect.any(String),
        startTime: expect.any(Number),
        lastActivityTime: expect.any(Number),
      });
      expect(state.sessionId.length).toBeGreaterThan(0);
      expect(state.startTime).toBeLessThanOrEqual(Date.now());
      expect(state.lastActivityTime).toBeLessThanOrEqual(Date.now());
    });

    test("getCurrentState returns null until getOrCreateSession or setCurrentState", () => {
      const manager = new SessionManager({});
      expect(manager.getCurrentState()).toBeNull();
      manager.getOrCreateSession();
      expect(manager.getCurrentState()).not.toBeNull();
    });

    test("updateActivity updates lastActivityTime when current state exists", () => {
      const manager = new SessionManager({});
      const state = manager.getOrCreateSession();
      const before = state.lastActivityTime;
      manager.updateActivity();
      const after = manager.getCurrentState()?.lastActivityTime;
      expect(after).toBeDefined();
      expect((after as number) >= before).toBe(true);
    });
  });

  describe("setCurrentState", () => {
    test("sets in-memory state for updateActivity", () => {
      const manager = new SessionManager({});
      const state = {
        sessionId: "test-session-id",
        startTime: 1000,
        lastActivityTime: 2000,
      };
      manager.setCurrentState(state);
      expect(manager.getCurrentState()).toEqual(state);
      manager.updateActivity();
      const updated = manager.getCurrentState();
      expect(updated?.sessionId).toBe("test-session-id");
      expect(updated?.lastActivityTime).toBeGreaterThanOrEqual(2000);
    });
  });
});

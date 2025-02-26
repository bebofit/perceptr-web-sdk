/**
 * @jest-environment jsdom
 */
import { PerformanceMonitor } from "../utils/performance";
import { mockPerformanceAPI } from "./testHelpers";

describe("PerformanceMonitor", () => {
  beforeEach(() => {
    mockPerformanceAPI();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("verifies memory API is available", () => {
    expect(typeof window.performance.measureUserAgentSpecificMemory).toBe(
      "function"
    );
  });

  test("triggers callback when memory limit exceeded", async () => {
    const onLimitExceeded = jest.fn();
    const monitor = new PerformanceMonitor(20000000, onLimitExceeded);

    monitor.start();
    await jest.runOnlyPendingTimersAsync();

    expect(onLimitExceeded).toHaveBeenCalled();
  });

  test("stops monitoring when disabled", async () => {
    const onLimitExceeded = jest.fn();
    const monitor = new PerformanceMonitor(20000000, onLimitExceeded);

    monitor.start();
    monitor.stop();
    await jest.runOnlyPendingTimersAsync();

    expect(onLimitExceeded).not.toHaveBeenCalled();
  });

  test("handles unavailable memory API gracefully", async () => {
    // Remove the memory API mock
    delete (window as any).performance.measureUserAgentSpecificMemory;

    const consoleSpy = jest.spyOn(console, "warn");
    const onLimitExceeded = jest.fn();
    const monitor = new PerformanceMonitor(20000000, onLimitExceeded);

    monitor.start();
    await jest.runOnlyPendingTimersAsync();

    expect(consoleSpy).toHaveBeenCalledWith("Memory API is not available");
    expect(onLimitExceeded).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

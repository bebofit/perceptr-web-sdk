/**
 * @jest-environment jsdom
 */

import { NetworkMonitor } from "../NetworkMonitor";
import { createMockXHR, flushPromises } from "./testHelpers";

describe("NetworkMonitor", () => {
  let monitor: NetworkMonitor;
  let originalXHR: typeof XMLHttpRequest;
  let originalFetch: typeof window.fetch;

  beforeEach(() => {
    originalXHR = window.XMLHttpRequest;
    originalFetch = window.fetch;
    monitor = new NetworkMonitor();
  });

  afterEach(() => {
    window.XMLHttpRequest = originalXHR;
    window.fetch = originalFetch;
    monitor.disable();
  });

  test("captures fetch requests", async () => {
    monitor.enable();
    const mockResponse = new Response("{}", { status: 200 });
    window.fetch = jest.fn().mockResolvedValue(mockResponse);

    await fetch("https://api.example.com/data");
    await flushPromises();

    const requests = monitor.getRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      method: "GET",
      url: "https://api.example.com/data",
      status: 200,
    });
  });

  test("sanitizes sensitive headers", () => {
    monitor = new NetworkMonitor({
      sanitizeHeaders: ["authorization"],
    });
    monitor.enable();

    const mockXHR = createMockXHR();
    window.XMLHttpRequest = jest.fn(() => mockXHR) as any;

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.example.com");
    xhr.setRequestHeader("Authorization", "Bearer secret");
    xhr.send();

    const requests = monitor.getRequests();
    expect(requests[0].requestHeaders.authorization).toBe("[REDACTED]");
  });
});

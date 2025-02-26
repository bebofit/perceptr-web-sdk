export function createMockXHR(): Partial<XMLHttpRequest> {
  return {
    open: jest.fn(),
    send: jest.fn(),
    addEventListener: jest.fn(),
    getAllResponseHeaders: jest.fn().mockReturnValue(""),
    status: 200,
    statusText: "OK",
    responseText: "{}",
  };
}

export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

export function mockPerformanceAPI(): void {
  // Mock the new memory measurement API
  window.performance.measureUserAgentSpecificMemory = jest
    .fn()
    .mockResolvedValue({
      bytes: 25000000,
      breakdown: [
        {
          bytes: 25000000,
          attribution: ["window"],
          types: ["JavaScript"],
        },
      ],
    });
}

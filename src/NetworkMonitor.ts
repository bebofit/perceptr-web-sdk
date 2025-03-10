import { v4 as uuidv4 } from "uuid";
import type { NetworkRequest, NetworkMonitorConfig } from "./types";

export class NetworkMonitor {
  private requests: NetworkRequest[] = [];
  private originalFetch: typeof window.fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;
  private isEnabled = false;
  private debug = false;

  private readonly config: Required<NetworkMonitorConfig> = {
    maxRequests: 1000,
    sanitizeHeaders: ["authorization", "cookie", "x-auth-token"],
    sanitizeParams: [
      "password",
      "token",
      "secret",
      "key",
      "apikey",
      "api_key",
      "access_token",
    ],
    sanitizeBodyFields: [
      "password",
      "token",
      "secret",
      "key",
      "apikey",
      "api_key",
      "access_token",
      "credit_card",
      "creditCard",
      "cvv",
      "ssn",
    ],
    captureRequestBody: true,
    captureResponseBody: true,
    maxBodySize: 100 * 1024, // 100KB default
    excludeUrls: [/\/logs$/, /\/health$/],
  };

  constructor(config: NetworkMonitorConfig = {}, debug: boolean = false) {
    this.debug = debug;
    this.config = { ...this.config, ...config };
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
  }

  public enable(): void {
    if (this.isEnabled) {
      if (this.debug) {
        console.warn("[SDK] NetworkMonitor already enabled");
      }
      return;
    }
    this.patchFetch();
    this.patchXHR();
    this.isEnabled = true;
  }

  public disable(): void {
    if (!this.isEnabled) {
      if (this.debug) {
        console.warn("[SDK] NetworkMonitor already disabled");
      }
      return;
    }
    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
    this.isEnabled = false;
  }

  public getRequests(): NetworkRequest[] {
    return this.requests;
  }

  public clearRequests(): void {
    this.requests = [];
  }

  private shouldCaptureUrl(url: string): boolean {
    return (
      !this.config.excludeUrls.some((pattern) => pattern.test(url)) &&
      !url.includes("/per/")
    );
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      let sanitized = false;

      for (const [key] of params.entries()) {
        if (this.shouldSanitizeParam(key)) {
          params.set(key, "[REDACTED]");
          sanitized = true;
        }
      }

      if (sanitized) {
        urlObj.search = params.toString();
        return urlObj.toString();
      }
    } catch (e) {
      // If URL parsing fails, return the original URL
    }
    return url;
  }

  private shouldSanitizeParam(param: string): boolean {
    return this.config.sanitizeParams.some((pattern) =>
      param.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private sanitizeHeaders(
    headers: Record<string, string>
  ): Record<string, string> {
    const sanitized = { ...headers };
    for (const key of Object.keys(sanitized)) {
      if (this.config.sanitizeHeaders.includes(key.toLowerCase())) {
        sanitized[key] = "[REDACTED]";
      }
    }
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    // Handle string bodies (try to parse as JSON)
    if (typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        return JSON.stringify(this.sanitizeObjectBody(parsed));
      } catch (e) {
        // Not JSON, return as is or truncate if too large
        return this.truncateBody(body);
      }
    }

    // Handle FormData
    if (body instanceof FormData) {
      const sanitized = new FormData();
      for (const [key, value] of body.entries()) {
        if (this.shouldSanitizeBodyField(key)) {
          sanitized.append(key, "[REDACTED]");
        } else {
          sanitized.append(key, value);
        }
      }
      return sanitized;
    }

    // Handle URLSearchParams
    if (body instanceof URLSearchParams) {
      const sanitized = new URLSearchParams();
      for (const [key, value] of body.entries()) {
        if (this.shouldSanitizeBodyField(key)) {
          sanitized.append(key, "[REDACTED]");
        } else {
          sanitized.append(key, value);
        }
      }
      return sanitized;
    }

    // Handle plain objects
    if (typeof body === "object" && body !== null) {
      return this.sanitizeObjectBody(body);
    }

    return this.truncateBody(body);
  }

  private sanitizeObjectBody(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObjectBody(item));
    }

    if (typeof obj === "object" && obj !== null) {
      const result = { ...obj };
      for (const key in result) {
        if (this.shouldSanitizeBodyField(key)) {
          result[key] = "[REDACTED]";
        } else if (typeof result[key] === "object" && result[key] !== null) {
          result[key] = this.sanitizeObjectBody(result[key]);
        }
      }
      return result;
    }

    return obj;
  }

  private shouldSanitizeBodyField(field: string): boolean {
    return this.config.sanitizeBodyFields.some((pattern) =>
      field.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private truncateBody(body: any): any {
    if (typeof body === "string" && body.length > this.config.maxBodySize) {
      return body.substring(0, this.config.maxBodySize) + "... [truncated]";
    }
    return body;
  }

  private addRequest(request: NetworkRequest): void {
    this.requests.push(request);
    if (this.requests.length > this.config.maxRequests) {
      this.requests.shift();
    }
  }

  private patchFetch(): void {
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!this.shouldCaptureUrl(input.toString())) {
        return this.originalFetch(input, init);
      }

      const startTime = Date.now();
      const requestId = uuidv4();
      let requestBody: any = undefined;

      // Capture and sanitize request body if enabled
      if (this.config.captureRequestBody && init?.body) {
        requestBody = this.sanitizeBody(init.body);
      }

      try {
        const response = await this.originalFetch(input, init);
        const duration = Date.now() - startTime;

        const requestHeaders = init?.headers
          ? this.sanitizeHeaders(
              Object.fromEntries(new Headers(init.headers).entries())
            )
          : {};

        const responseHeaders = this.sanitizeHeaders(
          Object.fromEntries(response.headers.entries())
        );

        const request: NetworkRequest = {
          type: 7,
          id: requestId,
          timestamp: startTime,
          duration,
          method: init?.method || "GET",
          url: this.sanitizeUrl(input.toString()),
          status: response.status,
          statusText: response.statusText,
          requestHeaders,
          responseHeaders,
        };

        if (requestBody) {
          request.requestBody = requestBody;
        }

        if (this.config.captureResponseBody) {
          const clonedResponse = response.clone();
          try {
            const responseText = await clonedResponse.text();
            request.responseBody = this.sanitizeBody(responseText);
          } catch (e) {
            // Ignore response body capture errors
          }
        }

        this.addRequest(request);
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addRequest({
          type: 7,
          id: requestId,
          timestamp: startTime,
          duration,
          method: init?.method || "GET",
          url: this.sanitizeUrl(input.toString()),
          requestHeaders: init?.headers
            ? this.sanitizeHeaders(
                Object.fromEntries(new Headers(init.headers).entries())
              )
            : {},
          responseHeaders: {},
          requestBody: requestBody,
          error: error,
        });
        throw error;
      }
    };
  }

  private patchXHR(): void {
    const self = this; // Store reference to class instance
    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest & { __requestData?: any },
      method: string,
      url: string,
      ...args: any[]
    ): void {
      this.__requestData = {
        id: uuidv4(),
        method,
        url,
        startTime: Date.now(),
      };
      return self.originalXHROpen.apply(this, [method, url, ...args] as any);
    };

    XMLHttpRequest.prototype.send = function (
      this: XMLHttpRequest & { __requestData?: any },
      body?: Document | XMLHttpRequestBodyInit | null
    ): void {
      if (
        !this.__requestData ||
        !self.shouldCaptureUrl(this.__requestData.url)
      ) {
        return self.originalXHRSend.call(this, body);
      }

      const requestData = this.__requestData;
      let sanitizedBody: any = undefined;

      // Capture and sanitize request body if enabled
      if (self.config.captureRequestBody && body) {
        sanitizedBody = self.sanitizeBody(body);
      }

      this.addEventListener("load", function () {
        const duration = Date.now() - requestData.startTime;
        const request: NetworkRequest = {
          type: 7,
          id: requestData.id,
          timestamp: requestData.startTime,
          duration,
          method: requestData.method,
          url: self.sanitizeUrl(requestData.url),
          status: this.status,
          statusText: this.statusText,
          requestHeaders: self.sanitizeHeaders(
            this.getAllResponseHeaders()
              .split("\r\n")
              .reduce((acc, line) => {
                const [key, value] = line.split(": ");
                if (key && value) acc[key] = value;
                return acc;
              }, {} as Record<string, string>)
          ),
          responseHeaders: {},
        };

        if (sanitizedBody) {
          request.requestBody = sanitizedBody;
        }

        if (self.config.captureResponseBody) {
          request.responseBody = self.sanitizeBody(this.responseText);
        }

        self.addRequest(request);
      });

      this.addEventListener("error", function () {
        const duration = Date.now() - requestData.startTime;
        self.addRequest({
          type: 7,
          id: requestData.id,
          timestamp: requestData.startTime,
          duration,
          method: requestData.method,
          url: self.sanitizeUrl(requestData.url),
          requestHeaders: {},
          responseHeaders: {},
          requestBody: sanitizedBody,
          error: "Network error",
        });
      });

      return self.originalXHRSend.call(this, body);
    };
  }

  public onRequest(callback: (request: NetworkRequest) => void): () => void {
    const originalAddRequest = this.addRequest;
    this.addRequest = (request) => {
      originalAddRequest.call(this, request);
      callback(request);
    };

    // Return a function to unsubscribe
    return () => {
      this.addRequest = originalAddRequest;
    };
  }
}

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
    sanitizeParams: ["password", "token", "secret"],
    captureRequestBody: false,
    captureResponseBody: false,
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
      if(this.debug) {
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
      if(this.debug) {
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
    return !this.config.excludeUrls.some((pattern) => pattern.test(url));
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

  private sanitizeUrl(url: string): string {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    this.config.sanitizeParams.forEach((param) => {
      if (params.has(param)) {
        params.set(param, "[REDACTED]");
      }
    });

    urlObj.search = params.toString();
    return urlObj.toString();
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

        if (this.config.captureRequestBody && init?.body) {
          request.requestBody = init.body;
        }

        if (this.config.captureResponseBody) {
          const clonedResponse = response.clone();
          try {
            request.responseBody = await clonedResponse.text();
          } catch (e) {
            // Ignore response body capture errors
          }
        }

        this.addRequest(request);
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addRequest({
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
          error: error.message,
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
      return self.originalXHROpen.apply(this, [method, url, ...args]);
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

      this.addEventListener("load", function () {
        const duration = Date.now() - requestData.startTime;
        const request: NetworkRequest = {
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

        if (self.config.captureRequestBody && body) {
          request.requestBody = body;
        }

        if (self.config.captureResponseBody) {
          request.responseBody = this.responseText;
        }

        self.addRequest(request);
      });

      this.addEventListener("error", function () {
        const duration = Date.now() - requestData.startTime;
        self.addRequest({
          id: requestData.id,
          timestamp: requestData.startTime,
          duration,
          method: requestData.method,
          url: self.sanitizeUrl(requestData.url),
          requestHeaders: {},
          responseHeaders: {},
          error: "Network error",
        });
      });

      return self.originalXHRSend.call(this, body);
    };
  }
}

declare global {
  interface WindowEventMap {
    "sdk-error": SDKErrorEvent;
  }
}

export enum ErrorCode {
  INITIALIZATION_FAILED = "INITIALIZATION_FAILED",
  RECORDING_FAILED = "RECORDING_FAILED",
  MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
  EXPORT_FAILED = "EXPORT_FAILED",
  API_ERROR = "API_ERROR",
}

export interface SDKError {
  code: ErrorCode;
  message: string;
  originalError?: unknown;
  context?: Record<string, any>;
}

export class SDKErrorEvent extends CustomEvent<SDKError> {
  constructor(error: SDKError) {
    super("sdk-error", { detail: error });
  }
}

export function emitError(error: SDKError): void {
  window.dispatchEvent(new SDKErrorEvent(error));
}

export function wrapWithErrorBoundary<T extends (...args: any[]) => any>(
  fn: T,
  errorCode: ErrorCode,
  context?: Record<string, any>
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (error) {
      emitError({
        code: errorCode,
        message: error instanceof Error ? error.message : "Unknown error",
        originalError: error,
        context,
      });
      throw error;
    }
  }) as T;
}

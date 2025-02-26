import { v4 as uuidv4 } from "uuid";
import type { Breadcrumb, BreadcrumbsConfig } from "./types";
import { debounce } from "./utils/debounce";

export class Breadcrumbs {
  private breadcrumbs: Breadcrumb[] = [];
  private readonly config: Required<BreadcrumbsConfig>;
  private isEnabled = false;
  private cleanupFns: (() => void)[] = [];

  constructor(config: BreadcrumbsConfig = {}) {
    this.config = {
      maxBreadcrumbs: config.maxBreadcrumbs ?? 100,
      enableAutoCapture: config.enableAutoCapture ?? true,
      dom: {
        clickTargets: config.dom?.clickTargets ?? true,
        inputSummary: config.dom?.inputSummary ?? true,
        inputDebounceMs: config.dom?.inputDebounceMs ?? 1000,
      },
      console: {
        levels: config.console?.levels ?? ["error", "warn"],
      },
    };
  }

  public enable(): void {
    if (this.isEnabled) return;
    this.isEnabled = true;

    if (this.config.enableAutoCapture) {
      this.setupClickCapture();
      this.setupInputCapture();
      this.setupNavigationCapture();
      this.setupErrorCapture();
    }
  }

  public disable(): void {
    if (!this.isEnabled) return;
    this.cleanupFns.forEach((cleanup) => cleanup());
    this.cleanupFns = [];
    this.isEnabled = false;
  }

  public addBreadcrumb(
    type: string,
    message: string,
    options: {
      category?: Breadcrumb["category"];
      level?: Breadcrumb["level"];
      data?: Record<string, any>;
    } = {}
  ): void {
    const breadcrumb: Breadcrumb = {
      id: uuidv4(),
      timestamp: Date.now(),
      category: options.category ?? "custom",
      type,
      message,
      level: options.level ?? "info",
      data: options.data,
    };

    this.breadcrumbs.push(breadcrumb);
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  public getBreadcrumbs(): Breadcrumb[] {
    return this.breadcrumbs;
  }

  public clear(): void {
    this.breadcrumbs = [];
  }

  private setupClickCapture(): void {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const selector = this.getElementSelector(target);
      this.addBreadcrumb("click", `Clicked ${selector}`, {
        category: "user",
        data: {
          selector,
          text: target.textContent?.trim().slice(0, 50),
        },
      });
    };

    document.addEventListener("click", handler, true);
    this.cleanupFns.push(() => {
      document.removeEventListener("click", handler, true);
    });
  }

  private setupInputCapture(): void {
    const debouncedInput = debounce((target: HTMLElement) => {
      const selector = this.getElementSelector(target);
      this.addBreadcrumb("input", `Input in ${selector}`, {
        category: "input",
        data: { selector },
      });
    }, this.config.dom.inputDebounceMs ?? 1000);

    const handler = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target || !["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      debouncedInput(target);
    };

    document.addEventListener("input", handler, true);
    this.cleanupFns.push(() => {
      document.removeEventListener("input", handler, true);
    });
  }

  private setupNavigationCapture(): void {
    const handleNavigation = (url: string, type: string) => {
      this.addBreadcrumb("navigation", `Navigated to ${url}`, {
        category: "navigation",
        data: { url, type },
      });
    };

    // Hash change
    const hashChangeHandler = () => {
      handleNavigation(window.location.href, "hashchange");
    };
    window.addEventListener("hashchange", hashChangeHandler);

    // History API
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      const url = args[2] as string;
      handleNavigation(url, "pushState");
      return originalPushState.apply(this, args);
    };

    this.cleanupFns.push(() => {
      window.removeEventListener("hashchange", hashChangeHandler);
      history.pushState = originalPushState;
    });
  }

  private setupErrorCapture(): void {
    const handleError = (
      error: Error | ErrorEvent | PromiseRejectionEvent,
      type: string
    ) => {
      const errorObj =
        error instanceof Error
          ? error
          : error instanceof ErrorEvent
          ? error.error
          : error.reason;

      this.addBreadcrumb("error", errorObj.message || "Unknown error", {
        category: "error",
        level: "error",
        data: { type, name: errorObj.name, stack: errorObj.stack },
      });
    };

    const errorHandler = (event: ErrorEvent) => handleError(event, "error");
    const rejectionHandler = (event: PromiseRejectionEvent) =>
      handleError(event, "unhandledrejection");

    window.addEventListener("error", errorHandler);
    window.addEventListener("unhandledrejection", rejectionHandler);

    this.cleanupFns.push(() => {
      window.removeEventListener("error", errorHandler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    });
  }

  private getElementSelector(element: HTMLElement): string {
    const parts: string[] = [];
    let current: HTMLElement | null = element;

    while (current && parts.length < 3) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
        parts.unshift(selector);
        break;
      }

      if (current.className) {
        selector += `.${current.className.split(" ").join(".")}`;
      }

      parts.unshift(selector);
      current = current.parentElement;
    }

    return parts.join(" > ");
  }
}

import { SessionRecorder } from "./SessionRecorder";
import { NetworkMonitor } from "./NetworkMonitor";
import { ConsoleLogger } from "./ConsoleLogger";
import { Breadcrumbs } from "./Breadcrumbs";
import { DataAggregator } from "./SessionAggregator";
import { SessionExporter } from "./SessionExporter";
import type { CoreConfig, SessionCore } from "./types";
import { v4 as uuidv4 } from "uuid";

export class Core {
  private readonly components: SessionCore;
  private readonly config: CoreConfig;
  private isEnabled = false;

  constructor(config: CoreConfig = {}) {
    this.config = config;
    const sessionId = uuidv4();
    const startTime = Date.now();

    this.components = {
      sessionRecorder: new SessionRecorder(config.session),
      networkMonitor: new NetworkMonitor(config.network),
      consoleLogger: new ConsoleLogger(config.console),
      breadcrumbs: new Breadcrumbs(config.breadcrumbs),
      aggregator: new DataAggregator(sessionId, startTime),
    };
  }

  public start(): void {
    if (this.isEnabled) return;

    // Start all components
    this.components.sessionRecorder.startSession();
    this.components.networkMonitor.enable();
    this.components.consoleLogger.enable();
    this.components.breadcrumbs.enable();

    this.isEnabled = true;
  }

  public stop(): string {
    if (!this.isEnabled) {
      throw new Error("Session not started");
    }

    // Stop all components
    const sessionData = this.components.sessionRecorder.stopSession();
    this.components.networkMonitor.disable();
    this.components.consoleLogger.disable();
    this.components.breadcrumbs.disable();

    // Aggregate data
    this.components.aggregator.addSessionEvents(sessionData);
    this.components.aggregator.addNetworkRequests(
      this.components.networkMonitor.getRequests()
    );
    this.components.aggregator.addConsoleLogs(
      this.components.consoleLogger.getLogs()
    );
    this.components.aggregator.addBreadcrumbs(
      this.components.breadcrumbs.getBreadcrumbs()
    );

    // Export data
    const exporter = SessionExporter.fromAggregator(
      this.components.aggregator.getAggregatedData()
    );

    this.isEnabled = false;
    return exporter.exportSession();
  }

  public pause(): void {
    if (!this.isEnabled) return;
    this.components.sessionRecorder.pause();
  }

  public resume(): void {
    if (!this.isEnabled) return;
    this.components.sessionRecorder.resume();
  }

  public getComponents(): SessionCore {
    return this.components;
  }

  public addBreadcrumb(
    type: string,
    message: string,
    options?: Parameters<Breadcrumbs["addBreadcrumb"]>[2]
  ): void {
    this.components.breadcrumbs.addBreadcrumb(type, message, options);
  }
}

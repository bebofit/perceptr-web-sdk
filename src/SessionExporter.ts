import type {
  ExportedSession,
  SessionData,
  NetworkRequest,
  ConsoleLog,
  Breadcrumb,
  SessionAggregator,
  SessionEvent,
} from "./types";

export class SessionExporter {
  private readonly sessionData: SessionData;
  private readonly networkRequests: NetworkRequest[];
  private readonly consoleLogs: ConsoleLog[];
  private readonly breadcrumbs: Breadcrumb[];
  private readonly metadata?: Record<string, any>;

  constructor(
    sessionData: SessionData,
    networkRequests: NetworkRequest[] = [],
    consoleLogs: ConsoleLog[] = [],
    breadcrumbs: Breadcrumb[] = [],
    metadata?: Record<string, any>
  ) {
    this.sessionData = sessionData;
    this.networkRequests = networkRequests;
    this.consoleLogs = consoleLogs;
    this.breadcrumbs = breadcrumbs;
    this.metadata = metadata;
  }

  public exportSession(): string {
    const exportData: ExportedSession = {
      sessionId: this.sessionData.sessionId,
      startTime: this.sessionData.startTime,
      endTime: this.sessionData.endTime,
      metadata: this.metadata,
      rrwebEvents: this.sessionData.events,
      networkRequests: this.networkRequests,
      breadcrumbs: this.breadcrumbs,
      consoleLogs: this.consoleLogs,
    };

    return JSON.stringify(exportData);
  }

  public static fromAggregator(aggregator: SessionAggregator): SessionExporter {
    const events = aggregator.events;

    return new SessionExporter(
      {
        sessionId: aggregator.sessionId,
        startTime: aggregator.startTime,
        endTime: aggregator.endTime,
        events: events
          .filter((e) => e.type === "rrweb")
          .map((e) => e.data) as SessionEvent[],
      },
      events
        .filter((e) => e.type === "network")
        .map((e) => e.data) as NetworkRequest[],
      events
        .filter((e) => e.type === "console")
        .map((e) => e.data) as ConsoleLog[],
      events
        .filter((e) => e.type === "breadcrumb")
        .map((e) => e.data) as Breadcrumb[]
    );
  }
}

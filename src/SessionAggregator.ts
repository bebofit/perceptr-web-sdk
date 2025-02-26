import type {
  SessionAggregator,
  AggregatedEvent,
  SessionData,
  NetworkRequest,
  ConsoleLog,
  Breadcrumb,
} from "./types";

export class DataAggregator {
  private sessionId: string;
  private startTime: number;
  private events: AggregatedEvent[] = [];

  constructor(sessionId: string, startTime: number) {
    this.sessionId = sessionId;
    this.startTime = startTime;
  }

  public addSessionEvents(sessionData: SessionData): void {
    sessionData.events.forEach((event) => {
      this.events.push({
        timestamp: event.timestamp,
        type: "rrweb",
        data: event,
      });
    });
  }

  public addNetworkRequests(requests: NetworkRequest[]): void {
    requests.forEach((request) => {
      this.events.push({
        timestamp: request.timestamp,
        type: "network",
        data: request,
      });
    });
  }

  public addConsoleLogs(logs: ConsoleLog[]): void {
    logs.forEach((log) => {
      this.events.push({
        timestamp: log.timestamp,
        type: "console",
        data: log,
      });
    });
  }

  public addBreadcrumbs(breadcrumbs: Breadcrumb[]): void {
    breadcrumbs.forEach((breadcrumb) => {
      this.events.push({
        timestamp: breadcrumb.timestamp,
        type: "breadcrumb",
        data: breadcrumb,
      });
    });
  }

  public getAggregatedData(): SessionAggregator {
    // Sort all events by timestamp
    this.events.sort((a, b) => a.timestamp - b.timestamp);

    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: this.events[this.events.length - 1]?.timestamp,
      events: this.events,
    };
  }

  public clear(): void {
    this.events = [];
  }
}

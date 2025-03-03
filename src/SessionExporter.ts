import type {
  ExportedSession,
  NetworkRequest,
  ConsoleLog,
  Breadcrumb,
} from "./types";
import type { eventWithTime } from "@rrweb/types";
export class SessionExporter {
  private readonly sessionId: string;
  private readonly startTime: number;
  private readonly endTime: number;
  private readonly sessionEvents: eventWithTime[];
  private readonly networkRequests: NetworkRequest[];
  private readonly consoleLogs: ConsoleLog[];
  private readonly breadcrumbs: Breadcrumb[];
  private readonly metadata?: Record<string, any>;

  constructor(
    sessionId: string,
    startTime: number,
    endTime: number,
    sessionEvents: eventWithTime[],
    networkRequests: NetworkRequest[] = [],
    consoleLogs: ConsoleLog[] = [],
    breadcrumbs: Breadcrumb[] = [],
    metadata?: Record<string, any>
  ) {
    this.sessionId = sessionId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.sessionEvents = sessionEvents;
    this.networkRequests = networkRequests;
    this.consoleLogs = consoleLogs;
    this.breadcrumbs = breadcrumbs;
    this.metadata = metadata;
  }

  public sendEventToServer() {
    // TODO: Implement this
  }

   public exportSession(): ExportedSession {
    const exportData: ExportedSession = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: this.endTime,
      metadata: this.metadata,
      rrwebEvents: this.sessionEvents,
      networkRequests: this.networkRequests,
      breadcrumbs: this.breadcrumbs,
      consoleLogs: this.consoleLogs,
    };
    return exportData;
  }
}

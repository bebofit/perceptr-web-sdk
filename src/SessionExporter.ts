import type {
  ExportedSession,
  NetworkRequest,
  ConsoleLog,
} from "./types";
import type { eventWithTime } from "@rrweb/types";
export class SessionExporter {
  private readonly sessionId: string;
  private readonly startTime: number;
  private readonly endTime: number;
  private readonly sessionEvents: eventWithTime[];
  private readonly networkRequests: NetworkRequest[];
  private readonly consoleLogs: ConsoleLog[];
  private readonly metadata?: Record<string, any>;

  constructor(
    sessionId: string,
    startTime: number,
    endTime: number,
    sessionEvents: eventWithTime[],
    networkRequests: NetworkRequest[] = [],
    consoleLogs: ConsoleLog[] = [],
    metadata?: Record<string, any>
  ) {
    this.sessionId = sessionId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.sessionEvents = sessionEvents;
    this.networkRequests = networkRequests;
    this.consoleLogs = consoleLogs;
    this.metadata = metadata;
  }

  public sendEventsToServer() {
    // TODO: Implement this in a buffer for performance
  }

   public exportSession(): ExportedSession {
    const exportData: ExportedSession = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: this.endTime,
      metadata: this.metadata,
      rrwebEvents: this.sessionEvents,
      networkRequests: this.networkRequests,
      consoleLogs: this.consoleLogs,
    };
    return exportData;
  }
}

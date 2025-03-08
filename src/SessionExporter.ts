import type {
  ExportedSession,
  NetworkRequest,
} from "./types";
import type { eventWithTime } from "@rrweb/types";
export class SessionExporter {
  private readonly sessionId: string;
  private readonly startTime: number;
  private readonly endTime: number;
  private readonly sessionEvents: eventWithTime[];
  private readonly networkRequests: NetworkRequest[];
  private readonly metadata?: Record<string, any>;

  constructor(
    sessionId: string,
    startTime: number,
    endTime: number,
    sessionEvents: eventWithTime[],
    networkRequests: NetworkRequest[] = [],
    metadata?: Record<string, any>
  ) {
    this.sessionId = sessionId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.sessionEvents = sessionEvents;
    this.networkRequests = networkRequests;
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
    };
    return exportData;
  }
}

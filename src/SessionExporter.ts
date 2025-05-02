import type { ExportedSession, NetworkRequest, UserIdentity } from "./types";
import type { eventWithTime } from "@rrweb/types";
export class SessionExporter {
  private readonly sessionId: string;
  private readonly startTime: number;
  private readonly endTime: number;
  private readonly sessionEvents: eventWithTime[];
  private readonly networkRequests: NetworkRequest[];
  private readonly metadata?: Record<string, any>;
  private readonly userIdentity?: UserIdentity;

  constructor(
    sessionId: string,
    startTime: number,
    endTime: number,
    sessionEvents: eventWithTime[],
    networkRequests: NetworkRequest[] = [],
    metadata?: Record<string, any>,
    userIdentity?: UserIdentity
  ) {
    this.sessionId = sessionId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.sessionEvents = sessionEvents;
    this.networkRequests = networkRequests;
    this.metadata = metadata;
    this.userIdentity = userIdentity;
  }

  public exportSession(): ExportedSession {
    const exportData: ExportedSession = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: this.endTime,
      metadata: this.metadata,
      rrwebEvents: this.sessionEvents,
      networkRequests: this.networkRequests,
      userIdentity: this.userIdentity,
    };
    return exportData;
  }
}

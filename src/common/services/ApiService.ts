import axios from "axios";
import type { CoreConfig, SnapshotBuffer } from "../../types";

export class ApiService {
  private readonly host: string = "http://localhost:8000";
  private readonly apiUrl: string;
  private readonly debug: boolean;

  constructor(config: CoreConfig) {
    this.apiUrl = `${this.host}/v1/per/r/${config.projectId}`;
    this.debug = config.debug ?? false;
  }

  public async sendEvents(buffer: SnapshotBuffer): Promise<void> {
    if (this.debug) {
      console.debug(
        `[SDK] Sending ${buffer.data.length} events to ${this.apiUrl}`
      );
    }

    await axios.post(this.apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buffer),
    });
    if (this.debug) {
      console.debug(`[SDK] Successfully sent events to server`);
    }
  }
}

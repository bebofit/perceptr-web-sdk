import axios from "axios";
import type { CoreConfig, SnapshotBuffer } from "../../types";

const HOST = process?.env?.PERCEPTR_HOST || "http://localhost:8000";

export class ApiService {
  private readonly host: string = HOST;
  private readonly apiUrl: string;
  private readonly debug: boolean;

  constructor(config: CoreConfig) {
    this.apiUrl = `${this.host}/v1/per/${config.projectId}/r`;
    this.debug = config.debug ?? false;
  }

  public async sendEvents(buffer: SnapshotBuffer): Promise<void> {
    const url = `${this.apiUrl}/events`;
    await axios.post(url, {
      headers: {
        "Content-Type": "application/json",
      },
      body: buffer,
    });
    if (this.debug) {
      console.debug(`[SDK] Successfully sent events to server`);
    }
  }
}

import axios from "axios";
import type { CoreConfig, SnapshotBuffer } from "../../types";

const HOST = "http://localhost:8000";

export class ApiService {
  private readonly host: string = HOST;
  private readonly apiUrl: string;
  private readonly debug: boolean;

  constructor(config: CoreConfig) {
    this.apiUrl = `${this.host}/v1/per/${config.projectId}`;
    this.debug = config.debug ?? false;
  }

  public async checkValidProjectId(): Promise<boolean> {
    const url = `${this.apiUrl}/check`;
    const response = await axios.get(url);
    return response.data.success;
  }

  public async sendEvents(buffer: SnapshotBuffer): Promise<void> {
    const url = `${this.apiUrl}/r/events`;
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

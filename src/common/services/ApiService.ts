import axios from "axios";
import type { CoreConfig, SnapshotBuffer } from "../../types";
import { logger } from "../../utils/logger";

const HOST = "http://localhost:8000";

export class ApiService {
  private readonly host: string = HOST;
  private readonly apiUrl: string;

  constructor(config: CoreConfig) {
    this.apiUrl = `${this.host}/api/v1/per/${config.projectId}`;
  }

  public async checkValidProjectId(): Promise<boolean> {
    try {
      const url = `${this.apiUrl}/check`;
      const response = await axios.get(url);
      return response.data.success;
    } catch (error) {
      logger.error(`Error checking project ID:`, error);
      return false;
    }
  }

  public async sendEvents(buffer: SnapshotBuffer): Promise<void> {
    try {
      const url = `${this.apiUrl}/r/events`;
      await axios.post(url, {
        headers: {
          "Content-Type": "application/json",
        },
        body: buffer,
      });
      logger.debug(`Successfully sent events to server`);
    } catch (error) {
      logger.error(`Error sending events:`, error);
    }
  }
}

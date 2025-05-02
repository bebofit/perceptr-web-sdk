import axios, { AxiosError } from "axios";
import type { CoreConfig, SnapshotBuffer } from "../../types";
import { logger } from "../../utils/logger";

export class ApiService {
  private readonly host: string;
  private readonly apiUrl: string;

  constructor(config: CoreConfig) {
    this.host = this.getHost(config.env);
    this.apiUrl = `${this.host}/api/v1/per/${config.projectId}`;
  }

  private getHost(env?: "local" | "dev" | "stg" | "prod"): string {
    switch (env) {
      case "local":
        return "http://localhost:8000";
      case "dev":
        return "https://api-dev.perceptr.io";
      case "stg":
        return "https://api-stg.perceptr.io";
      case "prod":
        return "https://api.perceptr.io";
      default:
        return "https://api.perceptr.io";
    }
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

  private async getUploadBufferUrl(sessionId: string): Promise<string | null> {
    try {
      const url = `${this.apiUrl}/r/${sessionId}/batch`;
      const response = await axios.get(url);
      return response.data.url;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (
          error.response?.status === 400 &&
          error.response?.data.detail === "processing already started"
        ) {
          logger.debug(
            `Processing already started for session ${sessionId} skipping...`
          );
          return null;
        }
      }
      throw error;
    }
  }

  async processSession(sessionId: string): Promise<void> {
    try {
      const url = `${this.apiUrl}/r/${sessionId}/process`;
      await axios.post(url);
    } catch (error) {
      // we assume this is because the session is already being processed
      logger.error(`Error processing session ${sessionId}:`, error);
    }
  }

  public async sendEvents(buffer: SnapshotBuffer): Promise<void> {
    const url = await this.getUploadBufferUrl(buffer.sessionId);
    if (!url) {
      return;
    }
    await axios.put(url, buffer, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    logger.debug(
      `Successfully uploaded events to S3 ${buffer.sessionId} (${buffer.size} bytes)`
    );
    if (buffer.isSessionEnded) {
      await this.processSession(buffer.sessionId);
      logger.debug(`Session ${buffer.sessionId} triggered`);
    }
  }
}

import axios from "axios";
import type { SnapshotBuffer } from "../../types";

export class ApiService {
  private readonly apiUrl: string;
  private readonly debug: boolean;

  constructor(debug: boolean = false) {
    this.apiUrl = `http://localhost:8000/v1/per/r/`;
    this.debug = debug;
  }

  public async sendEvents(buffer: SnapshotBuffer): Promise<void> {
    try {
      if (this.debug) {
        console.debug(`[SDK] Sending ${buffer.data.length} events to ${this.apiUrl}`);
      }

      // Use window.fetch explicitly to avoid context issues
      await axios.post(this.apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buffer),
      });
      if (this.debug) {
        console.debug(`[SDK] Successfully sent events to server`);
      }
    } catch (error) {
      if (this.debug) {
        console.error("[SDK] Failed to send events to server:", error);
      }
      throw error;
    }
  }
} 

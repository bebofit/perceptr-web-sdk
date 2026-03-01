/**
 * Extension service worker. Holds EventBuffer + ApiService, injects recorder,
 * and forwards events to Perceptr.
 */
import { EventBuffer, ApiService } from "../src/upload";

let eventBuffer: EventBuffer | null = null;
let apiService: ApiService | null = null;
let currentTabId: number | null = null;

function initBuffer(projectId: string, env: "local" | "dev" | "stg" | "prod") {
  apiService = new ApiService({ projectId, env });
  eventBuffer = new EventBuffer({ persistenceEnabled: false }, (snapshot) =>
    apiService!.sendEvents(snapshot),
  );
}

function destroyBuffer() {
  if (eventBuffer) {
    eventBuffer.destroy();
    eventBuffer = null;
  }
  apiService = null;
  currentTabId = null;
}

chrome.runtime.onMessage.addListener(
  (
    msg: {
      type: string;
      projectId?: string;
      env?: "local" | "dev" | "stg" | "prod";
      tabId?: number;
      events?: unknown[];
    },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    if (msg.type === "START_RECORDING" && msg.projectId && msg.tabId) {
      // Respond immediately so popup can close without "message channel closed" error
      sendResponse({ ok: true });
      (async () => {
        try {
          destroyBuffer();
          initBuffer(msg.projectId!, msg.env || "prod");
          currentTabId = msg.tabId!;
          // Ensure content script is in the tab (e.g. tab was open before extension load)
          await chrome.scripting.executeScript({
            target: { tabId: msg.tabId! },
            files: ["content.js"],
          });
          await chrome.scripting.executeScript({
            target: { tabId: msg.tabId! },
            files: ["injected.js"],
            world: "MAIN",
          });
          await chrome.tabs.sendMessage(msg.tabId!, {
            type: "START_RECORDING",
          });
        } catch (e) {
          console.error("[Perceptr extension] Start recording failed:", e);
        }
      })();
      return false;
    }

    if (msg.type === "STOP_RECORDING") {
      if (currentTabId != null) {
        chrome.tabs
          .sendMessage(currentTabId, { type: "STOP_RECORDING" })
          .catch(() => {});
      }
      sendResponse({ ok: true });
      return false;
    }

    if (msg.type === "RECORDER_EVENTS" && msg.events?.length && eventBuffer) {
      eventBuffer.addEvents(
        msg.events as Parameters<EventBuffer["addEvents"]>[0],
      );
      return false;
    }

    if (msg.type === "RECORDER_ENDED") {
      if (eventBuffer) {
        eventBuffer.flush(true).catch(() => {});
        destroyBuffer();
      }
      chrome.runtime.sendMessage({ type: "RECORDING_STOPPED" }).catch(() => {});
      return false;
    }

    return false;
  },
);

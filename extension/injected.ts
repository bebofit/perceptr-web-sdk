/**
 * Injected into the page (MAIN world). Listens for start/stop from content script
 * and runs SessionRecorder + NetworkMonitor, forwarding events via custom events.
 */
import { SessionRecorder, NetworkMonitor } from "../src/recorder";

const EVENT_NAME_START = "perceptr-recorder-start";
const EVENT_NAME_STOP = "perceptr-recorder-stop";
const EVENT_NAME_EVENTS = "perceptr-recorder-events";
const EVENT_NAME_ENDED = "perceptr-recorder-ended";

const BATCH_SIZE = 25;
const BATCH_MS = 500;

let recorder: SessionRecorder | null = null;
let networkMonitor: NetworkMonitor | null = null;
let eventBatch: unknown[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

function flushBatch() {
  if (eventBatch.length === 0) return;
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME_EVENTS, { detail: { events: [...eventBatch] } })
  );
  eventBatch = [];
  batchTimer = null;
}

function scheduleFlush() {
  if (batchTimer) return;
  batchTimer = setTimeout(() => {
    flushBatch();
  }, BATCH_MS);
}

function onRecorderEvent(ev: unknown) {
  eventBatch.push(ev);
  if (eventBatch.length >= BATCH_SIZE) flushBatch();
  else scheduleFlush();
}

function start() {
  if (recorder) return;
  const startTime = Date.now();
  recorder = new SessionRecorder({});
  recorder.startSession();
  recorder.onEvent(onRecorderEvent);

  networkMonitor = new NetworkMonitor({}, startTime);
  networkMonitor.enable();
  networkMonitor.onRequest((request: unknown) => onRecorderEvent(request));
}

function stop() {
  if (!recorder) return;
  flushBatch();
  if (networkMonitor) {
    networkMonitor.disable();
    networkMonitor = null;
  }
  try {
    const remaining = recorder.getRecordingEvents();
    if (remaining.length) {
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME_EVENTS, { detail: { events: remaining } })
      );
    }
  } catch (_) {
    // ignore
  }
  recorder.stopSession();
  recorder = null;
  window.dispatchEvent(new CustomEvent(EVENT_NAME_ENDED));
}

window.addEventListener(EVENT_NAME_START, start);
window.addEventListener(EVENT_NAME_STOP, stop);

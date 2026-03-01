# Perceptr Session Recorder (Chrome Extension)

Record session and DOM on any page and send to the Perceptr backend for live analysis. Uses the same recording pipeline as the SDK (`SessionRecorder` + rrweb) and the same upload API (`EventBuffer` + `ApiService`).

## Setup

1. Build the SDK and extension from repo root:
   ```bash
   npm run build:extension
   ```
   Or from this folder after building the SDK:
   ```bash
   npm install && npm run build
   ```

2. Load in Chrome: open `chrome://extensions`, enable "Developer mode", "Load unpacked", and select the **perceptr-web-sdk/extension** folder (the one containing `manifest.json`, `injected.js`, `background.js`).

## Usage

1. Open the extension popup and enter your **Project ID** (from your Perceptr project).
2. Choose **Environment** (prod/stg/dev) if needed.
3. Open the tab you want to record and click **Start recording**.
4. Use the page as normal; events are batched and sent to Perceptr.
5. Click **Stop recording** when done. The final buffer is flushed and the session is triggered for analysis.

Sessions appear in Perceptr like any session recorded with the SDK on a site using the same project ID.

**Note:** Recording does not work on restricted pages (e.g. `chrome://`, `edge://`, the Chrome Web Store). Use a normal website tab.

## Debugging

- **Background (service worker):** Open `chrome://extensions`, find "Perceptr Session Recorder", and click the **"Service worker"** (or "Inspect views: service worker") link. DevTools opens for the background script; use Console and breakpoints as usual.
- **Content script:** Open the page you are recording, then right‑click the page → **Inspect** → **Console**. The content script runs in the same page context; you’ll see its logs and any errors there. In **Sources**, look for your extension’s files under the page.
- **Popup:** Right‑click the extension icon in the toolbar → **Inspect popup**. DevTools opens for the popup; use Console and Sources to debug.
- **Injected page script:** Runs in the page’s main world. Use the same page DevTools (Inspect → Console) to see `console.log` and errors from the injected script.

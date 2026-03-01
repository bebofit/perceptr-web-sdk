const EVENT_NAME_START = 'perceptr-recorder-start';
const EVENT_NAME_STOP = 'perceptr-recorder-stop';
const EVENT_NAME_EVENTS = 'perceptr-recorder-events';
const EVENT_NAME_ENDED = 'perceptr-recorder-ended';

function dispatchToPage(eventName, detail = {}) {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'START_RECORDING') {
    dispatchToPage(EVENT_NAME_START);
    sendResponse({ ok: true });
    return false;
  }
  if (msg.type === 'STOP_RECORDING') {
    dispatchToPage(EVENT_NAME_STOP);
    sendResponse({ ok: true });
    return false;
  }
  return false;
});

window.addEventListener(EVENT_NAME_EVENTS, (e) => {
  if (e.detail?.events?.length) {
    chrome.runtime.sendMessage({ type: 'RECORDER_EVENTS', events: e.detail.events });
  }
});

window.addEventListener(EVENT_NAME_ENDED, () => {
  chrome.runtime.sendMessage({ type: 'RECORDER_ENDED' });
});

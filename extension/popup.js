const projectIdEl = document.getElementById('projectId');
const envEl = document.getElementById('env');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');

async function loadStored() {
  const { projectId, env } = await chrome.storage.local.get(['projectId', 'env']);
  if (projectId) projectIdEl.value = projectId;
  if (env) envEl.value = env;
}

function setStatus(msg, className = 'idle') {
  statusEl.textContent = msg;
  statusEl.className = 'status ' + className;
}

async function updateRecordingState() {
  const { recording } = await chrome.storage.session.get(['recording']);
  const isRecording = !!recording;
  startBtn.disabled = isRecording;
  stopBtn.disabled = !isRecording;

  // Toggle body recording class for visual effects
  document.body.classList.toggle('recording', isRecording);

  if (isRecording) setStatus('Recording… Open a tab and use the page.', 'recording');
}

projectIdEl.addEventListener('input', () => {
  chrome.storage.local.set({ projectId: projectIdEl.value });
});
envEl.addEventListener('change', () => {
  chrome.storage.local.set({ env: envEl.value });
});

startBtn.addEventListener('click', async () => {
  const projectId = projectIdEl.value.trim();
  if (!projectId) {
    setStatus('Please enter a project ID.', 'error');
    return;
  }
  await chrome.storage.local.set({ projectId, env: envEl.value });
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setStatus('No active tab.', 'error');
      return;
    }
    await chrome.runtime.sendMessage({
      type: 'START_RECORDING',
      projectId,
      env: envEl.value || 'prod',
      tabId: tab.id,
    });
    await chrome.storage.session.set({ recording: true });
    setStatus('Recording started.', 'recording');
    updateRecordingState();
  } catch (e) {
    setStatus('Error: ' + (e.message || String(e)), 'error');
  }
});

stopBtn.addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
    await chrome.storage.session.remove(['recording']);
    setStatus('Recording stopped. Session sent to Perceptr.', 'idle');
    updateRecordingState();
  } catch (e) {
    setStatus('Error: ' + (e.message || String(e)), 'error');
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'RECORDING_STOPPED') {
    updateRecordingState();
  }
});

loadStored();
updateRecordingState();

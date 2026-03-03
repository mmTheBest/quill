const DEFAULT_MODEL = "claude-sonnet-4-20250514";

function showStatus(message, isError = false) {
  const statusEl = document.getElementById("status");
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
  if (message) {
    setTimeout(() => {
      if (statusEl.textContent === message) {
        statusEl.textContent = "";
      }
    }, 2000);
  }
}

function saveSettings() {
  const settings = {
    apiEndpoint: document.getElementById("endpoint").value.trim(),
    apiKey: document.getElementById("apiKey").value.trim(),
    model: document.getElementById("model").value.trim() || DEFAULT_MODEL
  };

  chrome.storage.sync.set(settings, () => {
    if (chrome.runtime.lastError) {
      showStatus(`Error: ${chrome.runtime.lastError.message}`, true);
      return;
    }
    showStatus("Settings saved");
  });
}

function loadSettings() {
  chrome.storage.sync.get(["apiEndpoint", "apiKey", "model"], (data) => {
    if (chrome.runtime.lastError) {
      showStatus(`Error: ${chrome.runtime.lastError.message}`, true);
      return;
    }

    document.getElementById("endpoint").value = data.apiEndpoint || "";
    document.getElementById("apiKey").value = data.apiKey || "";
    document.getElementById("model").value = data.model || DEFAULT_MODEL;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  document.getElementById("settingsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveSettings();
  });
});

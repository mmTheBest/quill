document.getElementById("save").addEventListener("click", () => {
  const settings = {
    apiKey: document.getElementById("apiKey").value,
    model: document.getElementById("model").value || "gemini-2.0-flash"
  };
  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById("status");
    status.textContent = "Saved!";
    status.className = "status success";
    setTimeout(() => { status.textContent = ""; }, 2000);
  });
});

chrome.storage.sync.get(["apiKey", "model"], (data) => {
  if (data.apiKey) document.getElementById("apiKey").value = data.apiKey;
  if (data.model) document.getElementById("model").value = data.model;
});

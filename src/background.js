// Quill background service worker.
// Handles API requests and extension-wide messaging.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateReply") {
    generateReply(request.tweetText, request.author, request.tone)
      .then((reply) => sendResponse({ success: true, reply }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep the message channel open for async response.
  }

  return false;
});

async function generateReply(tweetText, author, tone = "insightful") {
  const { apiEndpoint, apiKey, model } = await chrome.storage.sync.get([
    "apiEndpoint",
    "apiKey",
    "model"
  ]);

  if (!apiEndpoint || !apiKey) {
    throw new Error("Please configure API settings in Quill popup");
  }

  const systemPrompt =
    `You are a reply drafting assistant for X (Twitter). Generate a single reply to the given tweet. ` +
    `The reply should be ${tone}, concise (under 280 characters ideally), and show genuine engagement with the content. ` +
    `Do not use hashtags. Do not start with "Great" or generic praise. Just output the reply text, nothing else.`;

  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model || "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: `Tweet by ${author}:\n\n${tweetText}\n\nDraft a reply:` }]
    })
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.content[0].text;
}

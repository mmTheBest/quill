// Quill background service worker.
// Handles API requests via Google Gemini API.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateReply") {
    generateReply(request.tweetText, request.author, request.tone)
      .then((reply) => sendResponse({ success: true, reply }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
  return false;
});

async function generateReply(tweetText, author, tone = "insightful") {
  const { apiKey, model } = await chrome.storage.sync.get(["apiKey", "model"]);

  if (!apiKey) {
    throw new Error("Please configure your Gemini API key in Quill settings");
  }

  const modelName = model || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const systemPrompt = `You are a reply drafting assistant for X (Twitter). Generate a single reply to the given tweet. The reply should be ${tone}, concise (under 280 characters ideally), and show genuine engagement with the content. Do not use hashtags. Do not start with "Great" or generic praise. Just output the reply text, nothing else.`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [
        {
          role: "user",
          parts: [{ text: `Tweet by ${author}:\n\n${tweetText}\n\nDraft a reply:` }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.8
      }
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "Gemini API error");
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No response from Gemini");
  }

  return text.trim();
}

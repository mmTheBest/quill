// Quill content script.
// Injects UI into X timelines and coordinates user interactions.

function handleQuillClick(article) {
  const tweetText = extractTweetText(article);
  const author = extractTweetAuthor(article);
  const overlay = createOverlay(article);
  const draftEl = overlay.querySelector(".quill-draft-text");
  setLoadingState(draftEl);

  chrome.runtime.sendMessage(
    { action: "generateReply", tweetText, author, tone: "insightful" },
    (response) => {
      if (chrome.runtime.lastError) {
        setDraftText(draftEl, `Error: ${chrome.runtime.lastError.message}`);
        return;
      }

      if (response && response.success) {
        setDraftText(draftEl, response.reply);
      } else {
        setDraftText(draftEl, `Error: ${response ? response.error : "Unknown error"}`);
      }
    }
  );

  overlay.querySelector(".quill-close").addEventListener("click", () => {
    overlay.remove();
  });

  overlay.querySelector(".quill-regenerate").addEventListener("click", () => {
    setLoadingState(draftEl);
    chrome.runtime.sendMessage(
      { action: "generateReply", tweetText, author, tone: "insightful" },
      (response) => {
        if (chrome.runtime.lastError) {
          setDraftText(draftEl, `Error: ${chrome.runtime.lastError.message}`);
          return;
        }

        setDraftText(
          draftEl,
          response && response.success ? response.reply : `Error: ${response ? response.error : "Unknown error"}`
        );
      }
    );
  });

  overlay.querySelector(".quill-insert").addEventListener("click", async () => {
    const draft = overlay.querySelector(".quill-draft-text").textContent || "";
    clickReplyButton(article);
    const success = await insertReplyText(draft);
    if (success) {
      overlay.remove();
    }
  });
}

function createOverlay(article) {
  const existing = document.querySelector(".quill-overlay");
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement("div");
  overlay.className = "quill-overlay";
  overlay.innerHTML = `
    <div class="quill-overlay-header">
      <span class="quill-title">Quill Draft</span>
      <button class="quill-close" type="button">✕</button>
    </div>
    <div class="quill-draft-text"></div>
    <div class="quill-overlay-actions">
      <button class="quill-regenerate" type="button">↻ Regenerate</button>
      <button class="quill-insert" type="button">Insert Reply</button>
    </div>
  `;

  article.style.position = "relative";
  article.appendChild(overlay);
  return overlay;
}

function setLoadingState(draftEl) {
  draftEl.classList.add("quill-loading");
  draftEl.innerHTML = `
    <span class="quill-spinner" aria-hidden="true"></span>
    <span>Generating...</span>
  `;
}

function setDraftText(draftEl, text) {
  draftEl.classList.remove("quill-loading");
  draftEl.textContent = text;
}

function injectQuillButton(article) {
  const actionBar = article.querySelector('[role="group"]');
  if (!actionBar) return;

  if (actionBar.querySelector(".quill-btn")) return;

  const btn = document.createElement("button");
  btn.className = "quill-btn";
  btn.innerHTML = "✎";
  btn.title = "Generate reply with Quill";
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleQuillClick(article);
  });

  actionBar.appendChild(btn);
}

function extractTweetText(article) {
  const tweetTextEl = article.querySelector('[data-testid="tweetText"]');
  return tweetTextEl ? tweetTextEl.innerText : "";
}

function extractTweetAuthor(article) {
  const userNameEl = article.querySelector('[data-testid="User-Name"]');
  return userNameEl ? userNameEl.innerText : "";
}

function clickReplyButton(article) {
  const replyBtn = article.querySelector('[data-testid="reply"]');
  if (replyBtn) {
    replyBtn.click();
  }
}

async function insertReplyText(text) {
  await new Promise((resolve) => {
    const check = setInterval(() => {
      const textarea = document.querySelector('[data-testid="tweetTextarea_0"]');
      if (textarea) {
        clearInterval(check);
        resolve(textarea);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(check);
      resolve(null);
    }, 3000);
  });

  const textarea = document.querySelector('[data-testid="tweetTextarea_0"]');
  if (!textarea) {
    return false;
  }

  textarea.focus();

  const clipboardData = new DataTransfer();
  clipboardData.setData("text/plain", text);
  const pasteEvent = new ClipboardEvent("paste", {
    bubbles: true,
    cancelable: true,
    clipboardData
  });
  textarea.dispatchEvent(pasteEvent);

  return true;
}

function scanAndInjectButtons() {
  const articles = document.querySelectorAll('article[data-testid="tweet"]');
  articles.forEach((article) => {
    if (!article.querySelector(".quill-btn")) {
      injectQuillButton(article);
    }
  });
}

const observer = new MutationObserver(() => {
  scanAndInjectButtons();
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
  scanAndInjectButtons();
}

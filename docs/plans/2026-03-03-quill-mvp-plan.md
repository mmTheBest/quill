# Quill MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working Chrome extension that injects a "Quill" button next to tweets on X, generates AI reply drafts via Anthropic API, and inserts them into the reply box.

**Architecture:** Manifest V3 Chrome extension. Content script observes DOM and injects buttons. Background service worker proxies LLM calls. Popup page for settings. Overlay panel for draft preview.

**Tech Stack:** Chrome Manifest V3, vanilla JS, CSS, Anthropic Messages API via configurable proxy endpoint.

---

### Task 1: Extension Skeleton

**Files:**
- Create: `src/manifest.json`
- Create: `src/content.js`
- Create: `src/background.js`
- Create: `src/popup.html`
- Create: `src/popup.js`
- Create: `src/styles.css`
- Create: `src/icons/` (placeholder 16/48/128 png icons)

**Step 1: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Quill",
  "version": "0.1.0",
  "description": "AI-powered reply drafting for X",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://x.com/*", "https://twitter.com/*"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://x.com/*", "https://twitter.com/*"],
      "js": ["content.js"],
      "css": ["styles.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**Step 2: Create placeholder icons**

Generate simple colored square PNGs at 16x16, 48x48, 128x128 using canvas or any tool.

**Step 3: Create empty content.js, background.js, popup.html, popup.js, styles.css**

Stub files with comments explaining their purpose.

**Step 4: Verify extension loads**

Load unpacked in chrome://extensions. Confirm no errors.

**Step 5: Commit**

```bash
git add src/
git commit -m "feat: extension skeleton with manifest v3"
```

---

### Task 2: Settings Popup

**Files:**
- Modify: `src/popup.html`
- Modify: `src/popup.js`
- Create: `src/popup.css`

**Step 1: Build popup UI**

Simple form with:
- API Endpoint URL input (default: empty, placeholder text explains format)
- API Key input (password field)
- Model selector (text input, default: "claude-sonnet-4-20250514")
- Save button
- Status indicator

**Step 2: Implement save/load with chrome.storage.sync**

```javascript
// Save settings
document.getElementById('save').addEventListener('click', () => {
  const settings = {
    apiEndpoint: document.getElementById('endpoint').value,
    apiKey: document.getElementById('apiKey').value,
    model: document.getElementById('model').value || 'claude-sonnet-4-20250514'
  };
  chrome.storage.sync.set(settings, () => {
    showStatus('Settings saved');
  });
});

// Load settings on open
chrome.storage.sync.get(['apiEndpoint', 'apiKey', 'model'], (data) => {
  // populate fields
});
```

**Step 3: Verify settings persist**

Open popup, enter values, save, close popup, reopen — values should persist.

**Step 4: Commit**

```bash
git add src/popup*
git commit -m "feat: settings popup with API config"
```

---

### Task 3: Content Script — Button Injection

**Files:**
- Modify: `src/content.js`
- Modify: `src/styles.css`

**Step 1: Write MutationObserver to detect tweet articles**

X renders tweets as `article` elements. Observe `document.body` for added nodes, find `article` elements, inject button if not already present.

```javascript
const observer = new MutationObserver((mutations) => {
  const articles = document.querySelectorAll('article[data-testid="tweet"]');
  articles.forEach(article => {
    if (!article.querySelector('.quill-btn')) {
      injectQuillButton(article);
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
```

**Step 2: Implement injectQuillButton**

Find the tweet's action bar (the row with reply/retweet/like buttons). Insert a small feather/quill icon button at the end.

```javascript
function injectQuillButton(article) {
  const actionBar = article.querySelector('[role="group"]');
  if (!actionBar) return;

  const btn = document.createElement('button');
  btn.className = 'quill-btn';
  btn.innerHTML = '✎';
  btn.title = 'Generate reply with Quill';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleQuillClick(article);
  });

  actionBar.appendChild(btn);
}
```

**Step 3: Style the button to match X's action bar**

```css
.quill-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgb(113, 118, 123);
  font-size: 16px;
  padding: 8px;
  border-radius: 50%;
  transition: color 0.2s, background-color 0.2s;
}
.quill-btn:hover {
  color: rgb(29, 155, 240);
  background-color: rgba(29, 155, 240, 0.1);
}
```

**Step 4: Verify button appears on X timeline**

Load extension, go to x.com, confirm quill button appears next to each tweet.

**Step 5: Commit**

```bash
git add src/content.js src/styles.css
git commit -m "feat: inject quill button into tweet action bars"
```

---

### Task 4: Tweet Text Extraction

**Files:**
- Modify: `src/content.js`

**Step 1: Implement extractTweetText**

Given an article element, extract the tweet's text content. X stores tweet text in a specific div structure.

```javascript
function extractTweetText(article) {
  const tweetTextEl = article.querySelector('[data-testid="tweetText"]');
  return tweetTextEl ? tweetTextEl.innerText : '';
}
```

**Step 2: Implement extractTweetAuthor**

```javascript
function extractTweetAuthor(article) {
  const userNameEl = article.querySelector('[data-testid="User-Name"]');
  return userNameEl ? userNameEl.innerText : '';
}
```

**Step 3: Wire into handleQuillClick**

```javascript
function handleQuillClick(article) {
  const tweetText = extractTweetText(article);
  const author = extractTweetAuthor(article);
  console.log('Quill:', { author, tweetText });
  // Next: send to background for API call
}
```

**Step 4: Test extraction**

Click quill button, check console for extracted text.

**Step 5: Commit**

```bash
git add src/content.js
git commit -m "feat: extract tweet text and author"
```

---

### Task 5: Background Service Worker — API Call

**Files:**
- Modify: `src/background.js`

**Step 1: Implement message listener**

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateReply') {
    generateReply(request.tweetText, request.author, request.tone)
      .then(reply => sendResponse({ success: true, reply }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }
});
```

**Step 2: Implement generateReply**

```javascript
async function generateReply(tweetText, author, tone = 'insightful') {
  const { apiEndpoint, apiKey, model } = await chrome.storage.sync.get([
    'apiEndpoint', 'apiKey', 'model'
  ]);

  if (!apiEndpoint || !apiKey) {
    throw new Error('Please configure API settings in Quill popup');
  }

  const systemPrompt = `You are a reply drafting assistant for X (Twitter). Generate a single reply to the given tweet. The reply should be ${tone}, concise (under 280 characters ideally), and show genuine engagement with the content. Do not use hashtags. Do not start with "Great" or generic praise. Just output the reply text, nothing else.`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Tweet by ${author}:\n\n${tweetText}\n\nDraft a reply:` }
      ]
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}
```

**Step 3: Add host_permissions for API endpoint**

Update manifest.json to add the API endpoint domain to host_permissions, or use `<all_urls>` for flexibility during dev.

**Step 4: Test API call**

Click quill button, verify reply comes back in console.

**Step 5: Commit**

```bash
git add src/background.js src/manifest.json
git commit -m "feat: background worker API call to generate replies"
```

---

### Task 6: Overlay Panel

**Files:**
- Modify: `src/content.js`
- Modify: `src/styles.css`

**Step 1: Create overlay HTML structure**

```javascript
function createOverlay(article) {
  const existing = document.querySelector('.quill-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'quill-overlay';
  overlay.innerHTML = `
    <div class="quill-overlay-header">
      <span class="quill-title">Quill Draft</span>
      <button class="quill-close">✕</button>
    </div>
    <div class="quill-draft-text">Generating...</div>
    <div class="quill-overlay-actions">
      <button class="quill-regenerate">↻ Regenerate</button>
      <button class="quill-insert">Insert Reply</button>
    </div>
  `;

  article.style.position = 'relative';
  article.appendChild(overlay);
  return overlay;
}
```

**Step 2: Style the overlay**

Dark-themed floating panel, positioned below the tweet, matching X's design language. Rounded corners, subtle shadow.

**Step 3: Wire up handleQuillClick to show overlay and populate draft**

```javascript
async function handleQuillClick(article) {
  const tweetText = extractTweetText(article);
  const author = extractTweetAuthor(article);
  const overlay = createOverlay(article);

  const draftEl = overlay.querySelector('.quill-draft-text');

  chrome.runtime.sendMessage(
    { action: 'generateReply', tweetText, author, tone: 'insightful' },
    (response) => {
      if (response.success) {
        draftEl.textContent = response.reply;
      } else {
        draftEl.textContent = 'Error: ' + response.error;
      }
    }
  );

  // Close button
  overlay.querySelector('.quill-close').addEventListener('click', () => overlay.remove());

  // Regenerate
  overlay.querySelector('.quill-regenerate').addEventListener('click', () => {
    draftEl.textContent = 'Generating...';
    chrome.runtime.sendMessage(
      { action: 'generateReply', tweetText, author, tone: 'insightful' },
      (response) => {
        draftEl.textContent = response.success ? response.reply : 'Error: ' + response.error;
      }
    );
  });
}
```

**Step 4: Verify overlay appears with draft**

**Step 5: Commit**

```bash
git add src/content.js src/styles.css
git commit -m "feat: overlay panel with draft preview"
```

---

### Task 7: Insert Reply into X's Reply Box

**Files:**
- Modify: `src/content.js`

**Step 1: Implement clickReplyButton**

First, programmatically click X's native reply button to open the reply compose area.

```javascript
function clickReplyButton(article) {
  const replyBtn = article.querySelector('[data-testid="reply"]');
  if (replyBtn) replyBtn.click();
}
```

**Step 2: Implement insertReplyText**

X uses a contenteditable div with `[data-testid="tweetTextarea_0"]`. Need to:
1. Wait for the reply modal/inline compose to appear
2. Focus the textarea
3. Use execCommand or input event simulation to insert text

```javascript
async function insertReplyText(text) {
  // Wait for reply compose to appear
  await new Promise(resolve => {
    const check = setInterval(() => {
      const textarea = document.querySelector('[data-testid="tweetTextarea_0"]');
      if (textarea) {
        clearInterval(check);
        resolve(textarea);
      }
    }, 100);
    setTimeout(() => { clearInterval(check); resolve(null); }, 3000);
  });

  const textarea = document.querySelector('[data-testid="tweetTextarea_0"]');
  if (!textarea) return false;

  textarea.focus();

  // Use clipboard API to paste text (most reliable for contenteditable)
  const clipboardData = new DataTransfer();
  clipboardData.setData('text/plain', text);
  const pasteEvent = new ClipboardEvent('paste', {
    bubbles: true,
    cancelable: true,
    clipboardData
  });
  textarea.dispatchEvent(pasteEvent);

  return true;
}
```

**Step 3: Wire Insert button**

```javascript
overlay.querySelector('.quill-insert').addEventListener('click', async () => {
  const draft = overlay.querySelector('.quill-draft-text').textContent;
  clickReplyButton(article);
  const success = await insertReplyText(draft);
  if (success) overlay.remove();
});
```

**Step 4: Test end-to-end**

Click Quill → see draft → click Insert → reply box opens with draft text.

**Step 5: Commit**

```bash
git add src/content.js
git commit -m "feat: insert draft reply into X reply box"
```

---

### Task 8: Final Polish & README

**Files:**
- Modify: `src/styles.css` (final polish)
- Modify: `README.md` (accurate setup instructions)

**Step 1: Polish overlay styling**

Ensure overlay looks good in both light and dark mode on X. Test positioning doesn't break with different tweet lengths.

**Step 2: Add loading spinner/animation**

Replace "Generating..." text with a subtle animation.

**Step 3: Update README with accurate setup steps**

**Step 4: Final commit and push**

```bash
git add -A
git commit -m "feat: quill mvp v0.1 complete"
git push origin main
```

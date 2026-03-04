# Quill

Quill is a Chrome Manifest V3 extension that drafts AI replies for X (Twitter). It keeps humans in the loop: Quill generates a draft, you review and decide what to post.

## MVP Features (v0.1)

- Injects a `✎` Quill button into each tweet action bar on `x.com` and `twitter.com`
- Extracts tweet text + author from the selected tweet
- Calls a configurable Anthropic-compatible Messages API endpoint from the background service worker
- Shows a floating draft overlay with:
  - loading spinner while generating
  - regenerate action
  - insert action to open X reply compose and paste the draft
- Stores endpoint/API key/model in `chrome.storage.sync` via extension popup

## Setup

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select the `src/` directory from this repo
5. Open the Quill extension popup
6. Configure:
   - `API Endpoint URL` (your proxy or Anthropic-compatible `/v1/messages` endpoint)
   - `API Key`
   - `Model` (default: `claude-sonnet-4-20250514`)
7. Save settings
8. Open `https://x.com`, click the Quill button on a tweet, then generate and insert a draft

## API Request Format

Quill sends an Anthropic Messages-style JSON payload:

- `model`
- `max_tokens`
- `system`
- `messages`

Headers:

- `Content-Type: application/json`
- `x-api-key: <your key>`
- `anthropic-version: 2023-06-01`

## Development Notes

- No build step; source files in `src/`
- Load/unload as unpacked extension during development
- Manifest includes `<all_urls>` in `host_permissions` for configurable endpoint flexibility in MVP

# Quill

AI-powered reply drafting for X (Twitter). You stay in control — Quill just writes the first draft.

## What It Does

Quill is a Chrome extension that adds a small button next to every tweet. Click it, and AI generates a thoughtful reply based on the post content. It auto-fills the reply box. You review, edit, and post — or don't.

**AI drafts. You decide.**

## Features

- **Smart reply drafting** — Generates context-aware replies, not generic filler
- **Paper/article reading** — Detects links, reads the content, replies with actual insights
- **Thread awareness** — Reads full thread context before drafting
- **Tone control** — Insightful, casual, contrarian, or supportive
- **Human-in-the-loop** — AI never posts. You always have final say.

## Setup

1. Clone this repo
2. Open `chrome://extensions` → Enable Developer Mode
3. Click "Load unpacked" → Select the `src/` folder
4. Click the Quill extension icon → Enter your API endpoint and key
5. Browse X and start drafting

## Architecture

Chrome Manifest V3 extension. Content script injects UI into X, background service worker handles API calls through your configured endpoint. No backend needed.

## License

MIT

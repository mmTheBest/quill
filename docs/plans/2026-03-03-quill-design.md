# Quill — Design Document

**Date:** 2026-03-03
**Status:** Approved

## Overview

Quill is a Chrome extension that drafts AI-powered replies for posts on X (Twitter). The human stays in full control — browsing, choosing which posts to reply to, reviewing and editing drafts before posting. AI only generates the draft text.

## Core User Flow

1. User scrolls X, sees a post they want to reply to
2. Clicks the Quill button (injected near each tweet's action bar)
3. Quill reads the post content (+ linked content if applicable)
4. A small overlay shows the generated draft
5. User clicks "Insert" → draft is pasted into X's reply box
6. User reviews, edits if needed, posts manually

**Key principle:** Human controls every step. AI never posts.

## Reply Modes

Auto-detected based on tweet content:

1. **Standard reply** — Tweet is text only. AI reads it, drafts a relevant reply.
2. **Paper/article reply** — Tweet contains a link (arxiv, blog, news). Quill fetches and reads the linked content, generates a reply with actual insights — not generic responses.
3. **Thread reply** — Tweet is part of a thread. Quill reads full thread context before drafting.
4. **Image/media reply** — Tweet has images. Quill uses vision API to understand the image and incorporate it into the reply.

### Tone Options (user-selected)

- **Insightful** (default) — adds value, demonstrates understanding
- **Casual** — conversational, light
- **Contrarian** — respectful disagreement, alternative perspective
- **Supportive** — amplifying, agreeing with additions

Mode is auto-detected; tone is always user's choice.

## Architecture

### Extension Components

- **Content script** — Injects Quill button into X's DOM via MutationObserver (handles dynamic SPA loading). Extracts tweet text, links, thread context, images. Handles inserting draft into X's reply box (contenteditable div).
- **Background service worker** — Orchestrates API calls. Fetches linked content (papers, articles). Sends assembled context to LLM. Returns draft.
- **Popup UI** — Settings: API endpoint config, API key, default tone, custom persona/style.
- **Overlay panel** — Floating panel on Quill button click. Shows: detected mode, tone selector, generated draft, "Regenerate" / "Insert" buttons.

### Backend

No dedicated backend. Routes through existing Vercel proxy to Anthropic API.

- Link fetching in background service worker (fetch URL, extract readable text)
- PDF/arxiv: grab abstract from arxiv HTML page
- No X API needed

### Tech Stack

- Chrome Manifest V3
- Vanilla JS or Preact for overlay UI
- CSS for injected UI styling
- No build step for v1

### Data Flow

```
Tweet content + linked content + tone selection
    → Background service worker
    → Vercel proxy → Anthropic API
    → Draft reply text
    → Overlay preview
    → User clicks "Insert" → X reply box
```

## Phasing

### v0.1 — MVP

- Quill button injected next to each tweet's reply icon
- Click → overlay with draft reply
- Standard text reply mode only
- Single tone: insightful
- "Regenerate" and "Insert" buttons
- Settings popup: API endpoint + API key
- Works on X home timeline and individual tweet pages

### v0.2 — Context-Aware

- Link detection + content fetching (papers, articles, blogs)
- Thread context reading
- Tone selector (insightful / casual / contrarian / supportive)

### v0.3 — Polish

- Image understanding via vision API
- Custom persona (example tweets to match user's style)
- Keyboard shortcut to trigger Quill
- Reply history

### Out of Scope

- Auto-posting (never — core principle)
- X API integration (not needed)
- Other platforms (LinkedIn, Reddit — future consideration)
- Chrome Web Store publishing (unpacked for now)
- User accounts or cloud sync

## Technical Notes

- X uses React SPA with dynamic DOM — MutationObserver required to catch new tweets
- X's reply input is a contenteditable div — inserting text requires simulating input events
- Manifest V3 uses service workers (no persistent background page)
- chrome.storage.sync for settings, chrome.runtime.sendMessage for content ↔ background communication

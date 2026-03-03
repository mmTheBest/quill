# Quill — Agent Context

## What This Is
Chrome Manifest V3 extension that drafts AI replies for tweets on X (Twitter). Human-in-the-loop: AI drafts, human reviews and posts.

## Key Docs
- Design: `docs/plans/2026-03-03-quill-design.md`
- Implementation plan: `docs/plans/2026-03-03-quill-mvp-plan.md`

## Structure
All source code goes in `src/`. No build step. Load unpacked in Chrome.

## Important Technical Notes
- X is a React SPA — use MutationObserver for DOM changes
- X reply box is contenteditable div, not regular input
- Use `data-testid` attributes for reliable selectors
- Manifest V3: service worker, not background page
- API calls go through a configurable proxy endpoint (Anthropic Messages API format)

## Commit Convention
Commit after each task. Use conventional commits: `feat:`, `fix:`, `docs:`.
Push to origin/main after each task.

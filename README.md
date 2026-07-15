# Spells

A custom Magic: The Gathering card editor. Spells lets you lay out a card — title, mana cost, type line, rules text, flavor text, power/toughness, and cover art — onto a frame template and export it as an image or JSON, or share a permanent link others can view.

## What it does

- **Visual card editor** — each field is an absolutely-positioned, directly-editable text layer over the frame image, with inline bold/italic support and rules/flavor text that auto-shrinks to fit its box, so what you see while editing is what gets exported.
- **Frame templates** — any image dropped into `assets/` at the repo root becomes a selectable frame automatically, using a shared field layout calibrated for standard MTG card proportions. No config needed to add a new frame.
- **Cover art** — upload an image, paste a URL, or generate one from the card's own text (title/type/rules/flavor) via an LLM image model over OpenRouter. Model choice for both the image generator and the text-prompting model is configurable per-session.
- **Library** — cards save to `localStorage` for instant local editing, and are separately persisted to a small server-side SQLite database (`cardsDb`) whenever you explicitly save. This split means the library works fully offline, while saved cards also get a stable, shareable identity.
- **Sharable read-only view** — every saved card gets a permanent `/card/<uuid>` link that renders the exact same canvas as the editor (same layout, sizing, and text-fitting logic) but non-interactive, with **Fork** (clone it into your own library and start editing), Export PNG, and Export JSON actions. An `/edit/<uuid>` link opens a card you own directly in the editor.
- **Import/export** — cards round-trip as JSON (single card or whole-library), and export to PNG at fixed high resolution regardless of on-screen zoom.

## Project shape

- `src/routes/` — TanStack Router file-based routes: `/` (library grid), `/edit` and `/edit/$id` (editor), `/card/$id` (read-only view), `/admin/cards` (all cards saved server-side, for debugging).
- `src/components/` — `CardCanvas` is the single source of truth for rendering a card (editable or read-only via a `readOnly` prop); `Toolbar`, `Gallery`, and the sidebar panels build the surrounding editor chrome.
- `src/lib/cardStore.ts` — a small Zustand store holding the in-progress card, undo/redo history, and the library array, backed by `src/lib/persistence.ts` for `localStorage` I/O.
- `src/server/` — TanStack Start server functions for saving/listing/fetching cards from SQLite and for cover-image generation/upload.
- `nix/` — a NixOS module and package derivation for running Spells as a systemd service, with card data and generated images under `$STATE_DIRECTORY`.

## Running it

This is a Vite + TanStack Start app, managed with `pnpm` inside the Nix flake's dev shell (`direnv` picks it up automatically via `.envrc`).

```sh
pnpm install
pnpm dev      # local dev server
pnpm build    # production build
```

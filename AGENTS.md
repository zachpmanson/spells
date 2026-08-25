# spells — Agent Context

Custom Magic: The Gathering card editor. Visual card editor + shareable read-only views.
Live at https://spells.zachmanson.com | GitHub: `zachpmanson/spells`

## Overview

- **Status:** Active
- **Tech:** TypeScript, TanStack Start, CSS, SQLite, Nix
- **Runtime:** Node.js via NixOS systemd service (`spells.service`) on naboo

## Features (single source of truth in `src/components/CardCanvas.tsx`)

- **Visual card editor** — absolutely-positioned, directly-editable text layers over the frame image with inline bold/italic, auto-shrinking rules/flavor text
- **Frame templates** — any image in `assets/` becomes a selectable frame automatically, using standard MTG card proportions
- **Cover art** — upload, paste a URL, or LLM-generate from card text via OpenRouter (configurable model)
- **Library** — dual persistence: `localStorage` for offline editing + server-side SQLite for stable shareable cards
- **Shareable read-only view** — `/card/<uuid>` with Fork, Export PNG, and Export JSON actions; `/edit/<uuid>` opens owned cards in the editor
- **Import/export** — JSON round-trip (single card or whole library), PNG export at fixed high resolution

## Project Structure

| Path | Purpose |
|------|---------|
| `src/routes/` | TanStack Router routes: `/` (library), `/edit`/`/edit/$id` (editor), `/card/$id` (read-only), `/admin/cards` (debug) |
| `src/components/` | `CardCanvas` (single source of truth, `readOnly` prop), `Toolbar`, `Gallery`, sidebar panels |
| `src/lib/cardStore.ts` | Zustand store for in-progress card, undo/redo, library; backed by `persistence.ts` |
| `src/server/` | TanStack Start server functions for SQLite CRUD + cover image generation/upload |
| `nix/` | NixOS module & derivation for systemd deployment (`nix/package.nix`, `nix/module.nix`) |

## Dev

Use the flake devshell: `nix develop` (provides `nodejs_24`, `pnpm`).

```bash
pnpm install      # deps
pnpm dev          # local dev
pnpm build        # production build -> dist/
```

## Build & Deploy

- **Build:** `pnpm build`; the Nix derivation (`nix/package.nix`) packages it.
- **Deploy:** `make deploy` — pushes nothing itself; it asks naboo to `nix flake lock --update-input spells` and rebuild. Requires:
  - clean working tree (no uncommitted changes)
  - branch already **pushed** to GitHub (dependency is `github:zachpmanson/spells`, not a local path)
  - `spells` SSH alias on PATH to naboo

## Related

- Deployment infra shared conventions: see `~/beltino/AGENTS.md` [[Deployment-Infrastructure]]
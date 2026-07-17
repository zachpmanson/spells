# Migrate spells to Tailwind CSS v4

## Context

The project currently styles everything through one hand-written stylesheet, `src/App.css` (666 lines, ~85 rule blocks), with no CSS-in-JS, no CSS modules, and no utility framework. As the app grows (decks, library, admin views, card editor) this file is becoming a single point of contention and it's hard to see which rules are still used by which component. Moving to Tailwind v4 gives per-component, colocated styling and a real design-token system, while keeping a small amount of raw CSS for the handful of things Tailwind utilities can't express (container-query font sizing, `@font-face`, the deck-stack fan transform).

Chosen approach: Tailwind **v4** (CSS-first `@theme`, `@tailwindcss/vite` plugin, no `postcss.config`/`tailwind.config.ts` needed), migrated **incrementally route-by-route** so the app keeps working throughout, with a **separate prep PR** to split `Gallery.tsx` and `ImageLayer.tsx` into smaller components before any Tailwind class conversion touches them.

## Codebase facts that shape the plan

- Only stylesheet: `src/App.css` (666 lines). No `clsx`/`classnames`, only one template-literal className (`src/components/fields/TextLayer.tsx:41`) — conditional-class logic is minimal, so conversion is mostly static-string swaps.
- Components are already mostly small (<150 lines) except `src/components/fields/ImageLayer.tsx` (190 lines, bundles 4 visual states: empty/loading/url-input/error) and `src/components/Gallery.tsx` (170 lines, renders both the deck grid and card grid with sync badges and the fan-stack visual inline).
- Things that don't map to plain Tailwind utility classes and need special handling:
  - `.deck-stack-card` transform using CSS custom prop `--fan-i` + `calc()` (`Gallery.tsx:80`, `App.css` ~603-608) — keep as a React inline `style` (already computed per-index), not a utility.
  - Container queries: `.card-canvas { container-type: inline-size }` plus `cqw`-unit font sizes — use Tailwind v4 arbitrary values (`text-[2.8cqw]`) and its native `@container`/`@min-*` variant support; if that reads worse than plain CSS, leave a small scoped stylesheet just for this rule (acceptable escape hatch, not a blocker).
  - `:empty::before { content: attr(data-placeholder) }` on `.text-layer-content` — Tailwind v4 supports arbitrary `empty:before:content-[attr(data-placeholder)]`.
  - Two `@font-face` blocks (Beleren, MPlantin) and one `@keyframes spin` — move into the new global stylesheet's `@theme`/top-level CSS (Tailwind v4 lets you keep raw CSS alongside `@theme`), register fonts via `theme.fontFamily`.
  - One `!important` (`.card-sync-badge` font-size) — Tailwind arbitrary values support a trailing `!` modifier.
- Reused hex values in `App.css` form an implicit token set (backgrounds `#111`/`#1c1c1c`/`#181818`/`#222`/`#2a2a2a`, borders `#333`/`#3a3a3a`/`#4a4a4a`/`#555`, text `#eee`/`#aaa`/`#999`/`#666`, plus green "saved" and amber "local" badge accents) — becomes a `@theme` color palette so components use `bg-surface-800`, `text-text-muted`, etc. instead of raw hex.

## Steps

### 1. Install and wire up Tailwind v4 (no visual change)
- `npm install tailwindcss @tailwindcss/vite`
- Add the `@tailwindcss/vite` plugin to `vite.config.ts`.
- Create `src/styles/tailwind.css` with `@import "tailwindcss";` plus a `@theme { ... }` block encoding the color palette above, and keep the two `@font-face` blocks + `@keyframes spin` there too (copied from `App.css`, not yet removed from there).
- Import `src/styles/tailwind.css` from the app entry (alongside the existing `App.css` import) so both systems coexist during the migration.
- Verify: `npx tsc --noEmit`, `npm run dev`, confirm the app renders unchanged (Tailwind's reset (`preflight`) can shift default margins/font — check headings/buttons don't visibly jump).

### 2. Prep PR: split the two mixed-concern components (CSS untouched)
- `src/components/Gallery.tsx` → extract a `DeckTile` component (the fan-stack deck card + its footer) and a `CardTile` component (card preview + sync badge + footer), keeping the existing `App.css` classNames as-is. `Gallery.tsx` becomes just the two `<ul>` grids mapping over these.
- `src/components/fields/ImageLayer.tsx` → extract the 4 overlay states (`ImageLayerEmpty`, `ImageLayerLoading`, `ImageLayerUrlInput`, `ImageLayerError`) into their own small components, same classNames retained.
- No behavior or styling change in this step — pure extraction. Verify with `npx tsc --noEmit` and a manual click-through of the library page and image field (add/replace image, trigger an error) to confirm nothing regressed.

### 3. Convert the library/admin views
Files: `src/routes/admin/cards.tsx`, `src/components/Gallery.tsx` + its new `DeckTile`/`CardTile`, `src/routes/deck/$id.tsx`, `src/routes/card/$id.tsx` (the `.library-*`, `.card-sync-badge*`, `.deck-stack*` classes).
- Replace each className with Tailwind utilities; keep the `--fan-i` inline transform as-is.
- Delete the corresponding rule blocks from `App.css` once converted (`.library-header`, `.library-content`, `.library-grid`, `.library-grid-item*`, `.card-sync-badge*`, `.deck-stack*`).
- Verify: `npx tsc --noEmit`, then visually diff the library page, admin cards page, and a deck view page before/after (screenshot or manual check — see Verification section).

### 4. Convert the editor shell
Files: `src/App.tsx`, `src/components/Toolbar.tsx` (`.app-layout`, `.app-body`, `.app-sidebar`, `.app-canvas-area`, `.toolbar`, `.editor-toolbar-title`, `.undo-redo-row`, `.toolbar-spacer-btn`).
- Convert classNames, delete matching `App.css` rules.
- Verify: open `/edit`, confirm the two-row toolbar (Library/New card/Save top row, Settings/Copy link/Export/Import/Export PNG second row) and title still lay out correctly.

### 5. Convert shared sidebar components
Files: `src/components/Button.tsx` (shared — converting this once benefits every consumer), `src/components/sidebar/CardFieldsPanel.tsx`, `src/components/sidebar/TemplatePicker.tsx`, `src/components/ModelSettingsModal.tsx` (`.btn`, `.btn:hover:not(:disabled)`, `.card-fields-panel`, modal overlay styles).
- `:hover:not(:disabled)` becomes Tailwind's `enabled:hover:` variant.
- Verify: open the model settings modal, toggle a disabled button state, confirm hover/disabled styling still correct.

### 6. Convert the card canvas and its fields (trickiest step — do last)
Files: `src/components/CardCanvas.tsx`, `src/components/fields/ImageLayer.tsx` (+ its new split components), `src/components/fields/TextLayer.tsx`, `src/components/CardPreview.tsx`.
- Container-query font sizing (`cqw` units) and `container-type: inline-size` — attempt Tailwind v4 arbitrary values/native container-query variants first; if the resulting utility soup is unreadable, keep a small scoped `card-canvas.css` for just this rule and say so in the PR description (documented exception, not a silent one).
- `:empty::before` placeholder → `empty:before:content-[attr(data-placeholder)]`.
- `image-layer:hover .image-layer-controls` → Tailwind `group`/`group-hover:` pattern.
- Verify: open the editor, type into every text field, upload/replace/clear a card image, confirm the placeholder text shows on empty fields and the card preview text scales correctly at different card sizes.

### 7. Delete `App.css` and the coexistence import
- Grep for any remaining `className="..."` strings referencing classes still defined in `App.css` (safety net for missed spots).
- Delete `src/App.css` and its import once empty (or empty except for the documented container-query exception, in which case rename/keep only that rule in a small file and drop the rest).
- Final pass: `npx tsc --noEmit`, `npm run lint`.

## Verification (end to end, each step)

- `npx tsc --noEmit` after every step (type safety, especially for prop changes from the componentization prep).
- `npm run lint` (oxlint) at the end of each step.
- Quick sanity load via `npm run dev` for the route(s) touched that step, confirming the page renders with no console errors. No formal before/after visual diffing — the user will flag anything that looks wrong after the fact.

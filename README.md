# Commander Tinder

A web app for Magic: The Gathering Commander players:

1. **Deckbuilding Tinder** (live): pick a commander and a bracket, then swipe through cards that fit.
   The deck keeps its mana curve, ramp, draw, interaction and board wipes in balance and respects the
   bracket's Game Changer, mass land denial and extra-turn limits. Finish with basics, edit, import and export.
2. **Goldfish** (live): an MTG Arena-style sandbox to test a deck. Drag cards between zones, click to
   play or tap, right-click for counters, tokens, flip and zone moves. London mulligan (first one free),
   scry/surveil/mill/search, commander tax, undo, keyboard shortcuts (D, U, N, S, M, ⌘Z) and an
   opening-hand simulator.
3. **Playstyle quiz** (later): find commanders that match your colors, creatures and play style.

Decks are stored in the browser (localStorage); there are no accounts.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) ·
Motion · dnd-kit · Zustand · TanStack Query · Zod · Recharts · Vitest · Playwright. Deploys to Vercel as is.

## Getting started

```bash
pnpm install
pnpm dev
```

`pnpm dev` and `pnpm build` first run `scripts/build-card-db.ts`, which downloads Scryfall's bulk data
(about 30 MB, cached in `.cache/`) and writes:

| File | Used by |
| --- | --- |
| `data/cards.json` | API routes: every Commander-legal card with roles (ramp, draw, removal, …) |
| `data/tokens.json` | API routes: tokens for the goldfish sandbox (`/api/tokens`) |
| `public/data/commanders.json` | Client: all legal commanders with themes and tribes |

The data is rebuilt when it is older than a week; `pnpm data --force` rebuilds it now.

Other scripts: `pnpm test` (Vitest), `pnpm test:e2e` (Playwright smoke test; needs network for EDHREC and
Scryfall, run `pnpm exec playwright install chromium` once; `PORT=3001 pnpm test:e2e` runs it against a dev
server on another port), `pnpm lint`, `pnpm typecheck`.

## Design

A tabletop look rather than stock shadcn: warm ink surfaces, parchment text, an ember accent and a green
felt playmat for the goldfish table. Tokens live in `app/globals.css`.

- **Type:** Alegreya for headings, Archivo (with its width axis) for UI and body text. The `.eyebrow`
  utility gives condensed upper-case labels, `.numeral` big tabular counters.
- **Shape:** small radii (3px controls, 6px panels, 8px dialogs); cards keep their printed 4.75% corner.
  Shadows are hard ink edges plus a short drop (`shadow-sm` … `shadow-2xl` are redefined), no glows.
- **Surfaces:** `.panel` (raised), `.panel-inset` (recessed well), `.felt` (goldfish table).
- **Icons:** [Phosphor](https://phosphoricons.com) in the bold weight via `components/icons.tsx`, plus
  the [Mana](https://mana.andrewgioia.com) font (SIL OFL) for tap and card type symbols (`ManaGlyph`).
  Mana costs stay Scryfall's SVGs. Import icons from `@/components/icons`, not from an icon package.

## Data sources

- **[Scryfall](https://scryfall.com/docs/api)**: card data, images and the Game Changer flag
  (`game_changer`). Card roles come from Scryfall Tagger oracle tags (`oracle_tags` bulk file).
- **[EDHREC](https://edhrec.com)**: per-commander card suggestions with synergy and inclusion,
  filtered by bracket and theme. EDHREC has no official API; the app reads the JSON its own site uses
  (`json.edhrec.com/pages/commanders/{slug}[/{bracket}][/{theme}].json`) through a cached server
  route and falls back to its own popularity/theme scoring when EDHREC has no data.

## Project layout

```
app/                 pages and API routes (api/candidates, api/commander-insights, api/cards/*)
components/          UI: build/ (commander + bracket picker), swipe/, deck/ (editor), goldfish/, card/, ui/ (shadcn),
                     icons.tsx (Phosphor + Mana font)
lib/cards/           card types, names/slugs, mana helpers, image URLs
lib/tagging/         roles (Tagger tags), commander themes and tribes
lib/deckbuilder/     deck template, bracket rules, scoring, swipe session, basic land fill
lib/deck-io/         deck list import/export
lib/goldfish/        pure game actions (zones, mulligan, tokens, …) and the opening-hand simulator
lib/server/          server-only card database and candidate pool
stores/              decks.ts (persisted decks and swipe sessions), game.ts (goldfish game with undo)
scripts/             card database build
```

## Deployment

Import the repository in Vercel; no environment variables are needed. To refresh card data weekly,
create a Deploy Hook in Vercel and store its URL as the `VERCEL_DEPLOY_HOOK_URL` repository secret
(used by `.github/workflows/refresh-card-data.yml`).

## Legal

Commander Tinder is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed
by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.

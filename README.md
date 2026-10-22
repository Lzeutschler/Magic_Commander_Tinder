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
Scryfall, run `pnpm exec playwright install chromium` once), `pnpm lint`, `pnpm typecheck`.

## Data sources

- **[Scryfall](https://scryfall.com/docs/api)**: card data, images and the Game Changer flag
  (`game_changer`). Card roles come from Scryfall Tagger oracle tags (`oracle_tags` bulk file).
- **[EDHREC](https://edhrec.com)**: per-commander card suggestions with synergy and inclusion,
  filtered by bracket and theme. EDHREC has no official API; the app reads the JSON its own site uses
  (`json.edhrec.com/pages/commanders/{slug}[/{bracket}][/{theme}].json`) through a cached server
  route and falls back to its own popularity/theme scoring when EDHREC has no data.

## Project layout

```
app/                 pages and API routes (api/candidates, api/commander-insights, api/cards/*), legal pages, metadata routes
components/          UI: build/ (commander + bracket picker), swipe/, deck/ (editor), goldfish/, card/, ui/ (shadcn)
lib/cards/           card types, names/slugs, mana helpers, image URLs
lib/tagging/         roles (Tagger tags), commander themes and tribes
lib/deckbuilder/     deck template, bracket rules, scoring, swipe session, basic land fill
lib/deck-io/         deck list import/export
lib/goldfish/        pure game actions (zones, mulligan, tokens, …) and the opening-hand simulator
lib/server/          server-only card database and candidate pool
lib/site.ts          site URL, description and the provider details for Impressum and privacy policy
stores/              decks.ts (persisted decks and swipe sessions), game.ts (goldfish game with undo)
scripts/             card database build
```

## Deployment

The app deploys to Vercel as is: import the repository, keep the detected Next.js preset and the default
build command (`pnpm build`, which first downloads the Scryfall bulk data).

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | recommended | Public origin without trailing slash, e.g. `https://commander-tinder.com`. Used for `metadataBase` (canonical and Open Graph URLs), `robots.txt` and `sitemap.xml`. |

Without `NEXT_PUBLIC_SITE_URL`, `lib/site.ts` falls back to Vercel's `VERCEL_PROJECT_PRODUCTION_URL`
(the production domain, set automatically) and then to `http://localhost:3000`. Set it for Production
in *Project Settings → Environment Variables* once the custom domain is live, then redeploy.

### Domain

Add the domain in *Project Settings → Domains*, point DNS to Vercel as shown there, and redirect the
`www` variant (or the apex) to the primary domain. Vercel issues the TLS certificate. Then set
`NEXT_PUBLIC_SITE_URL` to the primary domain.

Optional: set *Functions → Region* to Frankfurt (`fra1`) so API routes run in the EU.

### Weekly card data refresh (Deploy Hook)

1. In Vercel, *Project Settings → Git → Deploy Hooks*, create a hook for the `main` branch.
2. In GitHub, *Settings → Secrets and variables → Actions*, add the hook URL as `VERCEL_DEPLOY_HOOK_URL`.

`.github/workflows/refresh-card-data.yml` calls the hook every week, which rebuilds the site with fresh
Scryfall data.

### Security headers

`next.config.ts` sends a Content Security Policy (images and mana symbols only from `cards.scryfall.io`
and `svgs.scryfall.io`, no framing), `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`,
`Cross-Origin-Opener-Policy` and HSTS. Preview deployments additionally allow `vercel.live` for the
Vercel Toolbar. If you add a third-party script, image host or API that the browser calls directly,
extend the CSP there and update the privacy policy (`app/datenschutz/page.tsx`).

### Before going live

- Commander Tinder runs as Leonard's private, non-commercial hobby project, which fits Vercel's Hobby plan.
  Provider details for `/impressum` and `/datenschutz` live in `lib/site.ts` (`OPERATOR`).
- If the project ever earns money (ads, donations, paid features) or moves to a company, revisit the
  Impressum, the privacy policy and the Vercel plan.

## Pages and SEO

`/about`, `/impressum` and `/datenschutz` (German, with an English translation; `/imprint` and `/privacy`
redirect there). Metadata, Open Graph and Twitter cards are set in `app/layout.tsx`; the social image
(`app/opengraph-image.tsx`), favicon (`app/icon.svg`), Apple touch icon, `robots.txt`, `sitemap.xml` and
the web app manifest are generated from `app/`.

## Legal

Commander Tinder is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed
by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.

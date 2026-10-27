# Working in this repo

Read `README.md` first. This is YGO Compare (Yu-Gi-Oh! TCG); Gundam Compare and
Lorcana Compare run the same engine. Engine code (`src/lib`, `src/app`,
`src/components`, `scripts`) must stay game-agnostic: anything game-specific
goes in `src/site.config.ts` or `src/content/`. When you change the engine,
make the same change in the other two repos.

## One engine, three repos

Gundam Compare, Lorcana Compare and YGO Compare run ONE engine. `engine.json`
lists its files (the code, tests and build config; never `src/site.config.ts`,
`src/content/`, icons, share images, workflows or `data/`), and they must be
byte-identical in all three repos. After an engine change here, copy it with
`scripts/engine-sync.sh ../<sister> ../<sister>`, run the checks in each and
open the three PRs together; `npx tsx scripts/engine-drift.ts ../<sister>…`
shows what still differs. The weekly *Engine drift* workflow fails (and
emails the owner) if `main` differs from a sister's `main`. Anything one game
needs is an option in `site.config.ts`, off by default.

## Deploys are gated — do not add `[deploy]` to commit subjects

Production builds only when the commit SUBJECT carries `[deploy]`
(`scripts/vercel-ignore-build.sh`). The daily data commit from
`refresh-prices.yml` carries it; that is the one build a day. Never put
`[deploy]` in a subject on your own initiative. "Push to prod" means land on
`main` and ride the next daily release, unless the owner says it is urgent.
Previews build only with `[preview]` in the subject, when the owner asks.

## No accounts, no database, no email

The site is price comparison only: no sign-in, no Premium, no alerts, no
email service and no database. Everything it serves is the committed JSON
under `data/` (`src/lib/data.ts`).

## Size: Yu-Gi-Oh! has tens of thousands of printings

`SITE.catalogMinCardCents` (US$1) keeps cards worth under a dollar in every
printing out of the catalogue, except in sets released in the last 120 days.
Every server function bundles `data/`, so lowering the floor grows every
function and every cold start. Don't lower it, and don't pass catalogue-sized
lists to a client component, without measuring `data/` first.

## Cost rules (from Rift Compare, where breaking them exhausted Neon projects)

1. Public data stays in committed files under `data/`; don't add a database
   read to any page or route.
2. No `generateStaticParams` that prerenders database- or data-heavy pages at
   build. Card and set pages use an empty list (cached on first visit).
3. No page or route handler revalidates under 21600 seconds (six hours);
   86400 for slow content. A route handler caches through its CDN header.
4. Every database query selects only the columns it needs and is bounded.
5. Never write anything private to `data/` — it is public with the source.

## eBay

One eBay app (5,000 Browse calls/day) is shared with Gundam Compare and
Lorcana Compare: 1,500 each (owner, 2026-10-26), counted in
`data/state/ebay-usage.json`. Cards under $20 get no call; every sealed product
does. The plan is `planEbayRefresh` in `src/lib/import/ebay.ts`, pinned by
`tests/ebay-plan.test.ts`. Do not raise `SITE.ebay.dailyBudget` without moving
another site's down by the same amount; the three must total 4,500 or less.

## Matching

`src/lib/import/match.ts`: a wrong match is worse than none. Every card match
needs the number AND the name (or an exact name inside a named set); ties are
no match; a title that names a rarity must name the product's own (one
Yu-Gi-Oh! number exists in several rarities); the edition (1st / Unlimited) is
taken from the title, never guessed; foreign-language products are never matched; a store price under a
quarter or over four times TCGplayer's is dropped. Add a test in
`tests/match.test.ts` for every new title format.

## The site watches itself

`ops-monitor.yml` runs `scripts/ops-monitor.ts` every three hours; a failing
check fails the run, and GitHub emails the owner. When you add a scheduled job,
external API or anything with a limit, add a check there.

## Checks

```
npm run typecheck
npm run lint
npm test
```

Record non-obvious decisions in `DECISIONS.md` (newest at the bottom).

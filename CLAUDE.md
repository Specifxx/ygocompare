# Working in this repo

Read `README.md` first. This is YGO Compare (Yu-Gi-Oh! TCG), **sealed only** since
2026-11-06 (owner): booster boxes, packs, tins, decks and collections, no single cards.
It runs the **Dex / MTG Compare engine's look** on its own data layer, as Gundam Compare
(2026-11-04) and WargameCompare do. It is NO LONGER a sister of the Lorcana /
Cyberpunk / Bandai card engine: there is no `engine.json`, no engine-drift check and
nothing to sync. Change this repo on its own; port engine presentation changes by hand.
Game-specific facts still live in `src/site.config.ts` and `src/content/`.

## Sealed only (owner, 2026-11-06; DECISIONS.md)

- `SITE.sealedOnly`: the import drops cards after every slug is settled (a sealed slug never
  changes; `keepSlugs` in `scripts/import-all.ts` keeps yesterday's slug by product id), and
  `sealedOnlyCatalog` in `lib/data.ts` drops any card a data file still holds.
- Every single-card URL the site had is in `data/redirects/cards.json` (frozen; never edit,
  never grow). `/card/<slug>` is still the sealed product page; a card slug found there gets a
  permanent redirect to its set, or `/sealed` (`lib/card-redirects.ts`). `/cards/*`, the card
  tools, `/list` and the card-table guides 301 from `next.config.js` (`RETIRED`). Never let an
  old URL 404, and never put a card, a card hub or a retired page back in the sitemap
  (`tests/sealed-only.test.ts`). The ops monitor checks one old card URL redirects.
- A set page exists only for a set with sealed product (`sealedSets()`); others 301 to `/sealed`.

## Deploys are gated — do not add `[deploy]` to commit subjects

**One production build per 12 hours, and production only (owner, 2026-11-02: Vercel spend capped at $5–6 a
day).** `scripts/vercel-ignore-build.sh` skips a `[deploy]` commit within 12 hours of the last production
deployment (it rides the next release); `[urgent]` in the subject overrides that, only when the owner says
so. `vercel.json` disables every branch except production (`"**": false`), so no preview is ever built.
Never dispatch a manual release just to ship a merge. DECISIONS.md, 2026-11-02.

Production builds only when the commit SUBJECT carries `[deploy]`
(`scripts/vercel-ignore-build.sh`). The daily data commit from
`refresh-prices.yml` carries it; that is the one build a day. Never put
`[deploy]` in a subject on your own initiative. "Push to prod" means land on
`main` and ride the next daily release, unless the owner says it is urgent.
Previews build only with `[preview]` in the subject, when the owner asks.

## No accounts, no database, no email

The site is price comparison only: no sign-in, no Premium, no
email service and no database. Everything it serves is the committed JSON
under `data/` (`src/lib/data.ts`).

**Price alerts are the one exception (owner, 2026-11-02):** the card page's
"Email me when the price drops" form (`PriceAlertForm.tsx`, `SITE.priceAlerts`)
posts to RiftCompare's shared alert service, which keeps the address, emails
and reads this site's static `/alert-feed.json` (`src/lib/alert-feed.ts`) once
a day. This site still stores no address and holds no mail key; never add one.
Keep the feed's price the lowest in-stock store price, never eBay or converted.

## Size

Every server function bundles `data/`. Before sealed-only, ~15,000 cards made it ~49 MB
(7.8 MB catalogue, 7.6 MB summary, 29 MB price shards), and every one of ~16,500 product
URLs was an ISR render and write after each release. Don't add cards back, and don't pass catalogue-sized lists to a
client component, without measuring `data/` first.

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
Lorcana Compare: Lorcana and Gundam 1,150 each, YGO
2,200 (2026-10-28; 1,500 each from the owner's 2026-10-26 split), counted in
`data/state/ebay-usage.json`. Every sealed product
gets calls; there are no cards. Sealed only (2026-11-06): the plan is `planSealedCoverage` in
`src/lib/import/ebay.ts` (every sealed product except inserts, in the US, UK, Canada and
Australia; every US product every 24 h, first and uncapped, then daily ceilings of Canada 400, UK 300,
Australia 277 at 48/72 h, spare calls spent on the most overdue pairs; owner's region split 2026-11-10), pinned by
`tests/ebay-plan.test.ts`. Do not raise `SITE.ebay.dailyBudget` without moving
another site's down by the same amount; the three must total 4,500 or less.

## Amazon's price on sealed pages (owner, 2026-11-05)

`scripts/amazon-asins.ts` (daily refresh) finds each sealed product's ASIN on each market's own Amazon, kept only when
`matchSealed` lands on that product; `scripts/fetch-amazon-prices.ts` (first in every build) fetches those prices into the
git-ignored `data/amazon-live/`; `lib/amazon-live.ts` gives the card page its Amazon row's link and 24-hour price. Prices
are never committed, never a sort, cheapest, deal, feed or quick view. Credentials `AMAZON_CREATORS_AU_*` (GitHub + Vercel)
serve every store; a store without API access is skipped. `tests/amazon-api.test.ts`; the ops monitor reads the status.

## Matching

`src/lib/import/match.ts`: a wrong match is worse than none. Sealed titles match by set,
product type and edition (`matchSealed`); the edition (1st / Unlimited) is taken from the
title, never guessed; foreign-language products are never matched; a store price under a
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

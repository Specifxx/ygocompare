# YGO Compare

Free Yu-Gi-Oh! TCG **sealed** price comparison: every booster box, pack, tin,
structure deck and collection, compared across TCGplayer, eBay, Amazon and Yu-Gi-Oh!
game stores (US, UK, Canada, Australia), updated daily. No single cards since
2026-11-06 (owner): every old card URL 301s to its set (`data/redirects/cards.json`).

Built on the Rift Compare playbook (riftcompare.com, repo `Specifxx/TCGEmpire`). It
runs the Dex / MTG Compare engine's look on its own data layer, like Gundam Compare
and WargameCompare, and is no longer a sister of the Lorcana / Cyberpunk / Bandai card
engine: change this repo on its own.

## How it works

```
GitHub Actions, daily 12:17 UTC (refresh-prices.yml)
  TCGCSV (TCGplayer catalogue + prices, category 2; sealed products only)
  + every Shopify store in src/content/stores.ts  (products.json)
  + eBay Browse API, budgeted (2,200 calls/day, every sealed product in US/UK/CA/AU)
  → data/public/*.json, data/history/<set>.json, data/state/*.json
  → commit to main with "[deploy]" in the subject  → one Vercel build a day
  → IndexNow ping
```

* **Public pages never touch the database.** They read the committed JSON
  (`src/lib/data.ts`), shipped with the deployment. Product, set, sealed-type
  and pre-order pages are one Vercel CDN copy a day each (`force-dynamic` +
  `CDN_PAGES` in next.config.js), nothing prerendered at build.
* **There is no database.** No accounts, no Premium, no email: the site
  compares prices and earns through affiliate links (eBay, TCGplayer, Amazon).
* **Deploys are gated** (`scripts/vercel-ignore-build.sh`): production builds
  only when the commit subject has `[deploy]`; previews need `[preview]`;
  `claude/*` branches never deploy.

## Features

Sealed product pages with a price row per store (cheapest in-stock first,
affiliate buy links through `/go`, each click a Vercel `buy_click` event),
price history charts, set pages, movers, a pre-order tracker, guides, the daily
Price Duel, Deal Finder and a selling-fee calculator. Dark theme by default with
a light toggle, and a Halloween theme that switches itself off at the
visitor's midnight on 31 October.

Matching: a store title is read as sealed (`looksSealed`) and matched by set, product
type and edition (`matchSealed`); 1st Edition / Unlimited is read from the title,
never guessed. The card matcher is still in `src/lib/import/match.ts` but has no
cards to match.

Finding stores: `.github/workflows/probe-stores.yml` checks every candidate in
`research/candidate-hosts.txt` for Yu-Gi-Oh! collections and prints a
`stores.ts` listing to review.

## Run locally

```
npm install
cp .env.example .env
npx tsx scripts/import-all.ts   # fetch data (EBAY_REFRESH=false to skip eBay)
npm run dev
```

Checks: `npm run typecheck`, `npm run lint`, `npm test`.

## Going live

See `docs/SETUP.md` (and the Claude in Chrome prompt in `docs/CHROME-SETUP-PROMPT.md`).

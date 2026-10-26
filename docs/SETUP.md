# Running YGO Compare

The daily price import (`refresh-prices.yml`, 12:17 UTC, with eBay once the
keys exist) commits data to `main`, and that commit (its subject carries
`[deploy]`) is the day's only production build. There is no database, no
email and no account system. First-time setup (Vercel project, domain,
secrets, search engines) is the Claude in Chrome prompt in
`docs/CHROME-SETUP-PROMPT.md`.

## Day to day

* An urgent code release: Actions → Production deploy → Run workflow.
* The ops monitor runs every three hours and fails (GitHub emails you) when
  data goes stale, stores break or eBay stops.
* Adding stores: add candidates to `research/candidate-hosts.txt`, run
  Actions → Probe stores, review the printed listing, then copy the store
  into `src/content/stores.ts`.
* eBay: one app shared with Gundam Compare and Lorcana Compare, 1,500 calls a
  day each. Lorcana Compare serves the Marketplace Account Deletion endpoint
  for the app; this site's copy of the route is harmless without
  `EBAY_VERIFICATION_TOKEN`.

## Keeping Vercel cheap

* One build a day (the data commit). `claude/*` branches never deploy and
  previews only build for a `[preview]` subject.
* Nothing database-backed is prerendered: card and set pages render on first
  visit and are cached for six hours (cards, sets, hubs).
* Card art comes straight from TCGplayer's CDN; Vercel image optimisation is
  off.
* `data/` ships inside every function, so the catalogue has a US$1 floor
  (`SITE.catalogMinCardCents`). Check `du -sh data/public` after any change
  to it.

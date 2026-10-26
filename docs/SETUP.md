# Running the sites

Live on Vercel. The daily price import (`refresh-prices.yml`, with eBay) commits
data to `main`, and that commit is the day's only production build. There is no
database, no email and no account system (archived in
`archive/accounts-premium/`). The remaining setup is in
`docs/CHROME-SETUP-PROMPT.md`.

## Day to day

* An urgent code release: Actions → Production deploy → Run workflow.
* The ops monitor runs every three hours and fails (GitHub emails you) when
  data goes stale, stores break or eBay stops.
* Adding a store: verify that its `products.json` returns this game's
  products, then add it to `src/content/stores.ts`.
* eBay: both sites share one app, at 2,500 calls a day each. The Lorcana
  site serves the Marketplace Account Deletion endpoint for the app.

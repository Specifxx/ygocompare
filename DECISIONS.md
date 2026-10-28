# Decisions

Newest at the bottom. Each entry: what was decided, why, and what it replaced.

The entries dated 2026-10-25 come with the engine from Gundam Compare
(`Specifxx/GundamCompare`), which YGO Compare runs unchanged; they explain
the engine. YGO Compare's own entries start on 2026-10-26.

## Launch architecture: the Rift Compare playbook, rebuilt lean — 2026-10-25

**Owner:** "I want now expand to Lorcana Compare and Gundam Compare … design the
website in the exact same way as Rift Compare and OP Compare … minimize costs
in Vercel, the optimizations that Rift Compare has."

**Not a fork.** Rift Compare's repo is ~1,000 source files, most of them
Riftbound-specific (Radiance, legends, runes, its arcade). Forking would carry
all of that and its Neon history. Instead one engine was written for both new
sites, keeping Rift's decisions rather than its code:

* **Public data in files, not Neon** (Rift's `PUBLIC_DATA_MODE=files`, here the
  only mode). The daily import writes `data/public/*.json` and per-set history
  files; pages read them. Neon carries accounts, alerts and clicks only.
* **One build a day.** Rift's `[deploy]` subject gate, unchanged. The daily data
  commit is the release; `production-deploy.yml` is the fallback/manual button.
* **Nothing prerendered at build, revalidate ≥ 6 hours** (Rift, DECISIONS
  2026-09-11 and 2026-10-14).
* **Halloween theme** from Rift's `lib/season.ts`: visitor-local window
  16–31 October, stamped before paint, so ISR caching cannot keep it on into
  November.
* **Affiliate accounts shared with Rift:** the same eBay Partner Network
  campaign and TCGplayer Impact link, with a per-site `customid`/`subId`.

## eBay: 2,500 calls a day, nothing under $20, value × demand × staleness — 2026-10-25

**Owner:** "you have a 2,500 quota for each of the websites because we're
splitting the quota … don't use it for anything that's under $20 … think about
a good strategy depending on the demand and the popularity."

Both sites use one eBay app (5,000/day). Each site counts its own calls and
stops at 2,500, and also never spends below the app's live remaining count
minus a reserve of 100. The sites run at different hours (Lorcana 06 UTC,
Gundam 18 UTC) so each eBay day (it resets at midnight Pacific) holds one run of
each.

Eligible: TCGplayer reference price ≥ $20. Refresh interval by value ($100+
daily, $50–100 every 2 days, $20–50 every 4), shortened by demand (affiliate
clicks in 30 days: 3+ → 2 days, 10+ → daily) and halved for chase rarities,
booster boxes/cases and sets released in the last 45 days or upcoming. Due
products are ranked by log(price) × (1 + log2(1 + clicks)) × boosts × how
overdue, and the budget is spent from the top: 75% on eBay US, 12.5% each on
eBay UK and AU for the top of the ranking. An eBay result is shown for up to
five days. The homepage "eBay Picks" banner reuses these results (no extra
calls).

## Store matching: number and name, or nothing — 2026-10-25

Rift Compare's lesson: a wrong match puts a common's price and a buy button on
a chase card's page. Cards match on number + ≥60% of the name, variant markers
must agree (Enchanted, LR+, a generic "parallel" ↔ the product's "+" rarity);
titles without a number match only by exact name inside a set the product type
or tags name; ties are no match; non-English product never matches; a price
under ¼ or over 4× TCGplayer's is dropped. On the first runs (2026-10-24) the
price-outlier audit flagged ~4% of priced Gundam offers, and the samples
checked were genuine market spread rather than wrong cards.

## Admin is hard-coded — 2026-10-25

**Owner:** "just make bill.jyang101@gmail.com the admin. I just hard code that
in." `SITE.adminEmails`; `ADMIN_EMAILS` (env) can add more, never remove.

## eBay keys are secrets, not source — 2026-10-25

The owner offered to have the eBay keys hard-coded. The App ID is harmless, but
the Cert ID is the app's client secret and this repo's `data/` is published, so
both go into GitHub Actions secrets (`EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`)
via the setup prompt instead. On 2026-10-25 the pair returned
`invalid_client` from eBay's token endpoint: a new production keyset stays
disabled until the Marketplace Account Deletion notification is configured or
an exemption is filed (docs/SETUP.md, step 4).

## Store coverage: every Rift Compare store, plus the sister sites' — 2026-10-25

**Owner:** "we want to have as many sources as possible … Take a look at how
many stores RiftCompare has. If we can get like 80% of that, or more … aim for
at least 200 stores."

Rift Compare tracks 221 Shopify stores. Every one, plus the 321 other stores in
OP Compare's and MTG Compare's lists and an agent search of US/UK stores, was
probed: `/collections.json` for a Lorcana / Gundam Card Game collection (no
Gunpla, Gundam Assemble or Japanese-only collections), then that collection's
`products.json` checked for real product. Collections that came back empty, and
duplicate hostnames of one shop, were dropped after the first full import.
Result: Lorcana 318 stores, Gundam 189 (80% of Rift is 177). On the 2026-10-25
run Lorcana had 379,097 prices; a $20+ card is listed at a median of 56 stores
(6 in stock), and Gundam at 27 (5 in stock). Expensive singles sell out, so
tiles show both "N stores · M in stock", and out-of-stock rows stay in the price
table (dimmed) with their last price.

Stores are fetched 8 at a time (each still one page at a time) so ~300 stores
fit the workflow's timeout. Prices are stored as compact tuples, one file per
set (`data/public/prices/`), plus `summary.json` for list pages: the single
`prices.json` had reached 95 MB.

Currency is now proved per store: four Canadian stores had been labelled US by
the probe (their CAD prices would have shown as US$) and one New Zealand store
as Australian. They were corrected or removed, and the daily import now reads
each store's `/cart.js` currency first and refuses a store whose currency is not
its market's, the ops monitor reporting it.

The same day the cause of a worse bug was found: without `?country=` Shopify
Markets answers in the visitor's currency, and the runners are in the US, so
every non-US store's prices had come back converted to USD (Gameology's A$179.95
box as 135.00) and been labelled local. Every store request now sends the
store's own country (`countryOf`, eurozone → ES as on Rift Compare).

Not yet covered: big non-Shopify US stores (CoolStuffInc, Star City Games,
Troll and Toad, GameNerdz). Each needs its own scraper, and several sit behind
Cloudflare challenges.

## Domains are .com; eBay account deletion is a real endpoint — 2026-10-25

**Owner:** "Lorcanacompare.com and Gundam compare.com are both domains that I
just now bought in Vercel." `SITE.domain` and every link moved from the
planned `.app` names. The sister-site links point at the .com domains; Rift
Compare's own footer was not touched (owner: don't edit Rift Compare).

eBay disables a production keyset until the app handles Marketplace Account
Deletion notifications. Rather than file the exemption, both sites serve
`/api/ebay/account-deletion`: GET answers eBay's challenge with
sha256(challenge_code + EBAY_VERIFICATION_TOKEN + endpoint URL), POST
acknowledges a notice with 200. No eBay user data is stored, so there is
nothing to delete. The shared app registers the Lorcana site's endpoint only.

## Buy clicks are Vercel Analytics events too — 2026-10-25

**Owner:** "enable Vercel web analytics and also … by-click events … the
retailer that it's coming from for each website."

Every buy link already goes through `/go` (which tags the affiliate URL and
writes a `ClickEvent` row for /admin). `BuyClickTracker` (in the root layout)
listens for clicks and middle-clicks on any `/go?` link and sends the Vercel
event `buy_click` with retailer (display name), retailer_key, market,
product, page and destination host. One listener means a new buy button
anywhere is tracked without extra code. Custom events need Vercel Pro; the
`ClickEvent` log works on any plan. Amazon links use Rift Compare's tag
`riftcompare-20` until each site has its own `AMAZON_ASSOCIATE_TAG`.
`tests/affiliate.test.ts` pins the EPN, Impact and Amazon tagging.

## Neon only where it is essential — 2026-10-25

**Owner:** "most of the data, like any sort of public data, is now stored [in
files] … we really aren't using Neon at all for a lot of things, it's only for
… private data that it must have. Make sure there's not much dependency on Neon."

This site was built that way from the start (public data is only files), and
two remaining touchpoints were tightened:

* `/api/me` (called on every page view by a signed-in visitor) reads a signed
  snapshot of the account (email, tier, admin) from the session cookie, and
  goes to Neon at most once a day per visitor to refresh it. Signed-out
  visitors never cause a query.
* `/go` gives its click-log insert 800 ms at most. A slow or missing database
  costs a log row, never a buy click (Vercel's `buy_click` event still records it).

Neon is used for exactly: accounts and sessions refresh, price alerts and
their daily email run, the affiliate click log (admin dashboard and the eBay
demand signal), contact/newsletter rows and Stripe webhook idempotency. Built
and served with `DATABASE_URL` unset on 2026-10-25, every public page, search,
the sitemap and the affiliate redirect still worked. `tests/no-db-on-public-pages.test.ts`
fails if a public page or component imports the database or session reader.

## Paid plans "coming soon"; the first 50 accounts get Premium free — 2026-10-25

**Owner:** "for the premium features, we'll just say coming soon. And we'll
just give the first 50 accounts that register premium … I can't be bothered to
set up Stripe right now."

Sign-up gives the first 50 non-admin accounts per site `foundingMember`,
`tier: premium` and `premiumUntil: 2100-01-01` (Premium for good). /premium
shows the founding offer with places left (`/api/founding`, one count query
cached five minutes at the edge) and "Coming soon" on Plus and Premium. The
checkout API refuses until `PAYMENTS_ENABLED=1` and a Stripe key are set; the
Stripe code is complete and documented in docs/SETUP.md ("Turning payments
on"). Tested 2026-10-25 against a local Postgres: accounts 1–50 founding
Premium, 51–52 free, the counter at 0, checkout answering "coming soon".

## Google is the only sign-in method — 2026-10-25

**Owner:** "I want Google OAuth … just like how we did it for Rift Compare …
That's the only sign-in method."

`/api/auth/google` → Google (authorization-code flow, random `state` in a
10-minute httpOnly cookie, scopes openid/email/profile) →
`/api/auth/google/callback`, which checks the state, requires a verified
email, finds the account by Google id or email (or creates it; the first 50
non-admin accounts become founding members, as before) and signs in with the
same session cookie. Email/password sign-up and login were removed with
bcrypt; `passwordHash` stays as an unused nullable column so the schema
change is additive. `next` only accepts same-site paths. Setup:
docs/GOOGLE-OAUTH-PROMPT.md (one Google Cloud project, one web client per
site, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in each Vercel project).

## Price comparison only: accounts, Premium, alerts, email and the database removed — 2026-10-25

**Owner:** "I don't care about the sign-in feature anymore … get rid of the
sign-in features. We don't need the user accounts at all. Get rid of the
premium … just have it in an archive … get rid of anything that we need to send
as an email to users. We don't need Resend … it's just a website that helps you
compare the price of cards, monetized through affiliates and in the future,
potentially ads … make it more minimalistic."

Removed from the build and moved to `archive/accounts-premium/` (README there
explains how to restore): Google sign-in and sessions, the Prisma/Neon
database, Free/Plus/Premium and Stripe, founding members, price alerts and
their email run, Resend and owner notifications, the contact form, the
newsletter and /admin. The full price history is now public on every card
page. Contact is a mailto link to the public address. Clicks are recorded only
by the Vercel `buy_click` event, so the eBay prioritiser ranks by value,
rarity, sealed type and set age (its demand input is an empty map). The ops
monitor fails its workflow run instead of sending email: GitHub notifies the
owner. This supersedes the account, Premium, founding-member, Google sign-in
and Neon entries above. The eBay Marketplace Account Deletion endpoint stays
(eBay requires it, and it stores nothing).

## Rift Compare's Premium tools are free here; new logo and link thumbnail — 2026-10-25

**Owner:** "a lot of the features that we have on Rift Compare, like Deal
Finder, Rising Cards, Demand Finder … let's just make it all free … any users
can use it for free."

`/tools` hosts them, free and account-less, all computed from the daily
summary (`src/lib/tools.ts`):

* **Deal Finder:** every in-stock store or eBay offer 8–60% under TCGplayer
  market, in every market (converted to USD for the comparison), capped at the
  1,200 biggest savings. Filters are client-side. `/deals` 308s here.
* **Rising Cards:** up more than 2% in 7 days and not down over 30, weighted
  by the size of the rise, the 30-day trend and how few stores still have stock.
* **Demand Finder:** cards listed at 10+ stores, ranked by the share sold out.
* **Best Basket:** paste a list and get the cheapest in-stock price per card
  in your market (US TCGplayer/eBay as fallback), plus the stores that can
  fill most of it. A plain name matches the base printing; add the number for
  a variant. Postage is not included (Rift Compare's measured postage was not
  ported).
* **Trade Calculator** and **Selling Fee Calculator** (TCGplayer 10.75% +
  2.5% + $0.30; eBay 13.25% + $0.40, labelled as estimates).

Not ported: Box EV (no reliable pull rates yet, and a wrong EV misleads
buyers) and the pull tracker (it needs accounts).

**Logo:** original marks, not trademarks. Lorcana is a faceted hexagonal ink
crystal with an ink drop and sparkles. Gundam is a mecha head with V-fin, eyes
and red chin. `src/content/logo.tsx` is the source; `icon.svg`, `apple-icon.png`
and the header use it. **Link thumbnail** (`opengraph-image.jpg` /
`twitter-image.jpg`, 2400×1260) is built like Rift Compare's: headline, logo
and bullets on the left, real screenshots of a card page's price table and a
set page in browser frames on the right. Blog posts set it explicitly, because
their own `openGraph` would otherwise drop it.

**eBay matching tightened** after the first production runs put a Japanese
"Set of 3" and PSA/TAG-graded slabs on English raw cards: graded and
non-English listings are rejected, the price floor rose from 40% to 50% of
market, and each import re-checks saved results against the current rules,
so a tightened rule purges old matches without spending calls.

## eBay is highlighted, and its coverage was raised before launch — 2026-10-25

**Owner:** "make sure that eBay prices are highlighted, and all the eBay
prices are on the websites … the API keys are working before we make these
posts."

Every card page now opens its price comparison with an eBay call-out: the
cheapest Buy It Now in the visitor's market (eBay US as the fallback), with
shipping where eBay gives it, an eBay-blue "Buy on eBay" button and an "All
eBay listings" search link. Both go through /go, so the affiliate tags and the
`buy_click` event apply. eBay rows in the table carry the eBay wordmark, a
tint and the same button.

The keys were confirmed working (a token was issued and the live remaining
count read) and the first production runs were audited. Three matcher gaps
were fixed:

* Promos numbered "14" on TCGplayer but "14/P3", "14/D23" or "6/CC1" by sellers
  now match on the numerator.
* Sealed queries no longer contain an apostrophe ("Illumineer's" found nothing).
* Bracketed qualifiers ("Store Tournament Winner Pack 01", "SDCC 2026") must
  be at least half present in the title, so a participation card or a magazine
  promo never takes a winner card's price. Numbers in brackets don't count,
  and NTC / WCS are expanded.

`scripts/ebay-recheck-misses.ts` re-queried only the products without a match,
inside each site's daily share: about 1,060 calls in total.

Result on 2026-10-25, cards worth $20+ with a live eBay price: Lorcana 407 of
493 (82%), Gundam 274 of 362 (75%), across eBay US, UK and AU. The rest had no
matching English, ungraded, single-copy Buy It Now listing. Most are event
promos and serialized cards.

## eBay: cards from $10, every sealed product — 2026-10-25

**Owner:** "all the sealed products also must have … the eBay quota … change
it to cards that are $10 or more … all the sealed products should have it as
well."

`SITE.ebay.minPriceUsd` 20 → 10, and it now applies to cards only: every
sealed product is eligible whatever its price. Pre-orders with no TCGplayer
price rank as a $50 product and are searched with no price window. Sealed
refreshes at least every 48 hours. The planner still spends from the top of a
value × demand × staleness ranking inside each site's 2,500.

Sealed matching was the weak side (cases matched 0 of 29). Three fixes:

* Sealed searches use eBay's whole Collectible Card Games category (2536).
  Cases, decks and gift sets are listed outside "Sealed Booster Boxes" (183456).
* "Boxes", "packs" and "decks" in a title count as the singular.
* Pack fillers TCGplayer lists as sealed products (inserts, lore cards,
  tokens) are typed "Insert". They never get an eBay call and don't appear on
  /sealed.
* A "Bonus Pack" product never takes a listing that says "deck only" or "no
  bonus pack".

Result on 2026-10-25 after re-checking every eligible product without an eBay
price on eBay US. Lorcana: cards $10+ 406 of 411, sealed 145 of 217 (booster
boxes 14/16, Troves 14/15, collections 17/18, starter decks 38/47, cases
24/59). Gundam: cards $10+ 396 of 458, sealed 77 of 134 (booster boxes 7/7,
booster packs 25/26, cases 7/29). Cases are the weak spot: there are few
English Buy It Now case listings.

## 2026-10-25 — SEO hygiene: www is canonical, hub pages, breadcrumbs

- **Canonical host is `www.`** (`SITE_URL` in `src/lib/site.ts`). Canonicals,
  og:url, the sitemap and robots.txt all use it. The apex → www 301 is a Vercel
  domain setting (Domains: www primary, apex "Redirect to www", 301), not code:
  a code redirect would loop while Vercel still sends www to the apex. If
  `NEXT_PUBLIC_SITE_URL` is set in Vercel it overrides this; keep it unset or www.
- **og:url follows the canonical.** The layout used to set og:url to the site
  root, so every page shared the homepage's. `canon(path)` sets both.
- **Hub pages:** `/cards/rarity/<rarity>` and `/sealed/<type>` (`src/lib/hubs.ts`),
  only for rarities/types that have products, so the sitemap never lists an
  empty hub. "+" becomes "-plus" in slugs (LR+ and LR++ must not collide).
- **Breadcrumbs** (`components/Breadcrumbs.tsx`, with BreadcrumbList schema) on
  card, set, hub and guide pages; set pages link to neighbouring sets.
- The sitemap was already clean (only 200, self-canonical, no parameters);
  checked with curl over every non-card URL and a sample of card pages.

## YGO Compare: the Gundam/Lorcana engine, sized for Yu-Gi-Oh! — 2026-10-26

**Owner:** "create a website for comparing Yu-Gi-Oh cards … leverage how we
did it for Gundam and Lorcana … they don't really have a database … you
don't really need accounts … blog posts as well … split the eBay API keys …
1,500 each … we don't want it to cost a lot to run Vercel."

**Engine, not a fork.** Copied from Gundam Compare (identical to Lorcana
Compare); every Yu-Gi-Oh!-specific need became a `site.config.ts` option the
other two leave off, and the engine changes were ported back to both repos.
The half-built `apps/ygocompare` in `Specifxx/CompareEmpire` was a DexCompare
copy with generated prices; only its candidate store list was reused.

**What Yu-Gi-Oh! needed:**

* **Numbers** (`numberStyle: "ygo"`): `LOB-EN005`, `RA01-EN008`,
  `YGLD-ENA01`, old `LOB-001` and European `LOB-E001`. The language is part
  of the key, so `-DE`, `-FR`, `-AE` (Asian English) and the rest never match.
* **Rarity must agree** (`rarityMustAgree`): Rarity Collections and
  Quarter Century reprints give one number up to six rarities. A store or
  eBay title that names a rarity, in full or by an alias (QCSR, PlScR, UR),
  must name the product's own, after the card's own name is removed ("Rare
  Metal Dragon"). A title naming none, between several rarities, is a tie and
  no match, as before.
* **Editions**: 1st Edition / Unlimited / Limited are TCGplayer printings. A
  store's edition comes from its title or variant; unstated with several
  printings stays unknown. Shopify variants that mix editions become one offer
  per edition.
* **Slugs** (`slugStyle: "name-number"`): "Dark Magician" has dozens of
  printings, so every card slug carries its number, and clashes take the
  rarity, settled from the whole TCGplayer listing so a slug never moves.
* **A US$1 catalogue floor** (`catalogMinCardCents: 100`): TCGplayer lists
  tens of thousands of Yu-Gi-Oh! printings, most worth cents. Every server
  function bundles `data/`, so cards under $1 in every printing stay out,
  except in sets from the last 120 days. Sealed always stays.
* **Sealed types** (`sealedTypes`): tins, structure decks, special editions,
  and accessories (sleeves, mats, deck boxes) marked as not-sealed so they
  never get an eBay call.

**Stores.** `scripts/probe-stores.ts` (run in GitHub Actions; the stores
can't be reached from Claude's sandbox) checked 534 candidate stores: 207 sell
English Yu-Gi-Oh! through Shopify. BinderPOS stores list their whole ~46,000
card catalogue, mostly out of stock, so their in-stock collection is used
where one exists. Used, damaged and graded listings are now left out
everywhere.

**eBay**: 1,500 calls a day at 12:17 UTC, cards from $20 (Yu-Gi-Oh! has
thousands of $10 cards), every sealed product. Gundam and Lorcana dropped
from 2,500 to 1,500 the same day.

**TCGCSV** began answering HTTP 401 to browser-like User-Agents (first seen
from this site's first run): the engine now names the app
(`YGOCompare/1.0 (+https://www.ygocompare.com)`); ported to the other two.

**IndexNow** now sends the hubs, the newest sets, the guides and every product
from a set released in the last 45 days (at most 1,000 URLs), at the www
address the canonicals use, instead of nine hub URLs at the bare domain.

## 2026-10-26 — The address is ygocompare.app, bare domain, no www

The owner bought ygocompare.app (not .com). `SITE.apexHost: true` makes the
bare domain canonical (`SITE_HOST` in `src/lib/site.ts`): canonicals, the
sitemap, robots, IndexNow, the ops monitor and the TCGCSV User-Agent all use
`https://ygocompare.app`. This reverses the "www is canonical" entry above for
this site only; the other engine sites keep www (the option defaults off).
There is no app-level www redirect, and the setup prompt adds only the bare
domain in Vercel, ADDS DNS records and never edits or deletes one, and sets
no redirect: today's outage on the other sites came from redirect and DNS
changes made before Vercel showed the records as valid.

## 2026-10-26 — Correction: the domain is ygocompare.com

The owner owns ygocompare.com, not .app (the entry above named the wrong one).
`SITE.domain` is `ygocompare.com`; everything else in that entry stands: the
bare domain is canonical (`apexHost: true`), no www, no redirects, and setup
only adds DNS records. The first Vercel project was deleted; the setup prompt
creates a new one.

## One engine, three repos — 2026-10-27

**Owner** chose, on the "which direction for the other sites" card, "Shared
engine + polish, no Pro": the three no-database sites keep one engine, get
RiftCompare's look, and get no accounts or Pro until a site passes about 50
Google clicks a day and RiftCompare Pro has 10 paying members.

The engine was already copied by hand into three repos, and had drifted by
three files in a day (the family footer, the ops monitor's not-yet-live
warning, YGO's store probe). Merging the repos into one was rejected: each
Vercel project, its secrets, its daily data commit and its `[deploy]` gate
point at its own repo, and moving them is owner work in three dashboards for
no visitor-facing gain. Instead `engine.json` names the engine's files,
`scripts/engine-sync.sh` copies them (keeping each repo's `package.json`
name), and `scripts/engine-drift.ts` compares git blob ids with the sisters'
`main` through the GitHub API (one tree call per engine directory, never the
whole repo: `data/` is too big for a recursive listing). On a pull request it
only reports, because the first of three PRs is always ahead of the other two;
the Tuesday run fails, so GitHub emails the owner, when drift has outlived a
release. `scripts/probe-stores.ts` is YGO research, not engine.

## RiftCompare's buy path on the card page — 2026-10-27

Second step of the owner's "Shared engine + polish, no Pro". The engine
already used RiftCompare's colours and buttons; what it lacked was
RiftCompare's buy path. At 390px wide, the card image filled the first screen
and the price table started about 1,000px down, below the image and the
attributes.

- Phones get the name, price and a "Cheapest in <market>" block with its Buy
  button first, with a small thumbnail beside the name. The big image and the
  details come after the prices. Once that block and the table have scrolled
  away, a sticky "$X at store · Buy" bar shows (RiftCompare's
  `CardMobileBuy.tsx`). Both links go through `/go` with `from=card_top` /
  `card_bar`, so `buy_click` counts them separately from table clicks.
- `lib/price-rows.ts` is the one row order (in stock, cheapest item price
  first; then the US references; then out of stock). The table, the top block
  and the bar all read it, so they can't name different "cheapest" rows.
  Before this, a store's out-of-stock row could sit above a cheaper in-stock
  one. Out-of-stock rows now fold behind "Show N out-of-stock listings".
- "Prices checked N hours ago" sits beside the table. It's relative in the
  browser, because the page is cached for six hours. The in-stock count in the
  header now says "worldwide", because it counts every market.
- The phone header fits at 390px (market picker shows the code only, theme
  toggle shows the icon only), and phones get the search box.
- `scripts/engine-sync.sh` now copies new, not-yet-committed engine files too.
- Not ported: accounts, watch buttons, Pro (owner's choice) and store codes
  (`STORE_PARTNER_DEALS` is still empty on RiftCompare; port it when a store
  signs).

## The phone Cheapest block names eBay or TCGplayer — 2026-10-27

Owner: more eBay and TCGplayer clicks, visible on a phone and clicked because
they are worth it. Below md `CardTopBuy` showed one row, and when a store is
cheapest its link earns nothing. `priceRows` now returns `paidAlternative`: the
market's cheapest in-stock eBay or TCGplayer offer when a store is cheapest and
it is within 20%, with how much more it costs. The block names it on a second
muted line ("or $13.78 on TCGplayer (+3%) →", Paid link tag) through `/go` with
`from=card_top_alt`, so its clicks count separately from `card_top`. A real row
at its real price: never called cheaper, never reordered, the Buy button stays
on the cheapest. Outside the US the converted US references never qualify.
Same change on RiftCompare and OP Compare that day (engine change, all three repos).

## Cards TCGplayer has no photo of — 2026-10-27

Every tile in YGO Compare's "newest set" was a broken image. TCGCSV fills in
`imageUrl` for every product, but when `imageCount` is 0 TCGplayer's CDN
answers 403: a whole reprint set (Legendary Dragon Decks, 2020 Date Reprint)
and about one Yu-Gi-Oh! product in twelve. The import now stores no image for
those, and a card without one takes the photo of another printing with the
same number and name (same rarity first), never a looser match: a missing
photo is better than the wrong card. A tile with no image says "No image yet".
Engine change, all three repos.

## Old sets TCGplayer re-dated to today — 2026-10-27

TCGplayer moved 18 old Yu-Gi-Oh! groups' `publishedOn` to 2026-10-25 (2004
promos up to a 2025 reprint), so a 2020 Date Reprint became the home page's
"newest set" and every card in those sets skipped the catalogue floor.
Product ids only grow, so the import (`fixRedatedSets`) dates a set by its
lowest product id: a date in the last 60 days more than a year after the
median date of the five sets with the nearest ids takes that median. Older
dates are never touched (promo groups gain products for years). On the
2026-10-26 catalogues it moves 7 YGO sets and nothing in Gundam or Lorcana.
Engine change, all three repos.
## 2026-10-27 — 515 stores: every sister site's stores probed

Owner: "we need like way more stores … it's a bigger game, so we can get even
more stores." Every store host in the sister repos (Rift, OP, MTG, Gundam,
Lorcana, CompareEmpire) that the first probe had not seen, 2,350 of them
(`research/candidate-hosts-2.txt`), went through the same probe: 312 sell
English Yu-Gi-Oh! through Shopify. Four were left out by hand (graded and
Japanese only, accessories only, Japanese only, event tickets), and 308 were
added: 515 stores (US 209, CA 123, AU 68, UK 66, EU 48, SG 1).
2026-10-26 catalogues it moves 7 YGO sets and nothing in Gundam or Lorcana.
Engine change, all three repos.

## eBay and TCGplayer lead every price table — 2026-10-27

Owner: eBay and TCGplayer at the very top of every price list, even when they
are not the cheapest. `priceRows` returns `display` and `pinned`: the market's
cheapest eBay offer, then its cheapest TCGplayer offer (a local row, else the
US reference, "≈" converted), then the other live rows, then out of stock.
`PriceTable` draws that order with a "Shown first" tag on the two pinned rows
and "+N% vs cheapest" when one is dearer; "Cheapest" stays on `cheapest`, which
the phone buy block, sticky bar and metadata still read. Their clicks go
through `/go` with `from=<page>_pinned`. `/about` says so. Engine change, all
three repos; same change on RiftCompare and OP Compare that day.


## 2026-10-27 — every site links the whole family

The owner, once YGO Compare existed: "our website should all have all of our
compare websites now in the suite of websites … just try to backlink all of
it." Every site's footer now links the other eight: RiftCompare, OP Compare,
DexCompare, MTG Compare, Gundam Compare, Lorcana Compare, YGO Compare
(ygocompare.com), CamCompare (www.camcompare.app) and Compare Empire
(www.compareempire.com, Australian tech prices), each on the host it already
uses (no apex or www change). Plain followed links, never sponsored: they are
our own sites. The link text says what each compares ("Yu-Gi-Oh! card prices",
"Camera and lens prices"), with the site's name after it, rather than the
brand alone. MTG Compare is sealed-only since 2026-10-21, so its anchor now
says "Magic: The Gathering sealed prices" everywhere.

Footer only. In-page blocks ("Compare other TCGs" on card and product pages,
the article blocks) keep to card games, and the two sites that are not card
games are labelled as the wider family, so nine look-alike sites linked from
every page body never read as a link network.

Engine change, all three repos: `SisterSite.anchor` (optional) is the link
text in the footer and the blog's "Also from us" line, the name after it;
`tests/sister-sites.test.ts` pins eight others, once each, never this site.
Each site's list is in its own `site.config.ts`.

## Vercel cost: no prefetch, a day per page, fewer bots — 2026-10-27

**Owner:** "we gotta make sure ygocompare is also optimised to cost less on
vercel." YGO Compare has ~16,700 card URLs, three times Gundam's, so every
per-URL cost is three times larger here. Already lean before this: no
database, no middleware, image optimisation off, nothing prerendered at
build, one build a day. What was still spending:

* **Link prefetch.** In production every visible `<Link>` to an ISR page
  fetches its whole RSC payload, and a card nobody has opened since the
  release renders and writes to the ISR cache on that prefetch alone. A set
  page shows hundreds of tiles; scrolling one cost up to hundreds of renders
  and writes. `src/components/Link.tsx` wraps `next/link` with
  `prefetch = false` (as MTG Compare and Rift Compare do), and every file uses
  it. A click still navigates client-side.
* **ISR timers that could never show new data.** `data/` ships inside the
  deployment and each daily release starts with an empty ISR cache, so a card
  re-rendered six hours after the release showed exactly the same prices and
  wrote them again: up to four renders and writes per crawled URL a day for
  nothing. Card, set, rarity and sealed-type pages and the list hubs now
  revalidate every 86400 s. Freshness is unchanged: the release, not the
  timer, brings new prices. The home page ("Prices updated N hours ago") and
  preorders (filters by today's date) stay at 21600. Nothing goes under 21600
  (`tests/vercel-cost.test.ts`).
* **Crawlers.** robots.txt now blocks Rift Compare's list of bulk scrapers
  (Bytespider, MJ12bot, DotBot, PetalBot…) that render the long tail and send
  nobody, and `Disallow: /*?` (no sitemap URL carries a query; Allows keep
  `/_next/`, share images and icons). Google, Bing, the AI answer engines,
  AhrefsBot and SemrushBot are untouched; the test pins it.
* **Search CPU.** `/api/search` tokenised all ~17,000 product names on every
  keystroke (~40 ms of CPU); the tokens are now built once per instance
  (~5–10 ms a query). The box waits 250 ms instead of 150 and sends the query
  lower-cased so different casings share one CDN entry.

**Not done.** CDN-cached `force-dynamic` card pages (OP Compare's move):
with one render per card per release left, ISR is close to break-even, and
the CDN cache is per region. Revisit if Vercel's ISR writes line still leads
the bill. Skew Protection (a project setting, ~15% of each write) is the
owner's call.

Engine change, all three repos.

## The cheaper marketplace leads the pinned pair — 2026-10-27

The pin above put eBay over TCGplayer whatever their prices. In the US
TCGplayer is the cheaper of the two on most products, and it pays about 2.5
times more per click than eBay (30 days to 2026-10-26, across the family), so a
dearer eBay row sat on top of it. `pinnedOrder` (`src/lib/price-rows.ts`) now
puts the cheaper of the two first, TCGplayer on a tie, when both are this
market's own rows; a local TCGplayer row goes above a US eBay reference;
otherwise eBay leads as before. Measure `/go?from=card_pinned` by retailer a
week after release against the week before. Same change on all five card sites.

## Rift Compare's search playbook, ported — 2026-10-27

**Owner:** take Rift Compare's SEO and apply every best practice to the other sites.

Rift Compare's search clicks come from pages whose titles say what people type:
"<set> card list" (its set pages lead with "Card List: All N Cards + Prices"),
card titles that fit Google's ~60 characters with the price word kept, and a
homepage that leads with "<game> Card Prices". This engine now does the same:

* **Titles fit 60 characters** (`src/lib/seo-title.ts`): every page offers a
  ladder of candidates, most specific first, each tried with " | <site>" and
  then bare. Card pages: "<card> <number> Price — <game> <set>", stepping down;
  a number already in the store's name is said once. Set pages:
  "<game> <set> Card List: All N Cards + Prices"; `/sets` owns "<game> sets in
  order"; `/cards` owns "<game> card list"; the homepage "<game> Card Prices —
  Compare N Stores".
* **Structured data:** `ItemList` on set pages and `/sets`, `Organization` on
  the homepage (the WebSite names it as publisher), an image and logo on every
  Article.
* **Internal links:** a set page lists the guides that name it (`postsAbout`,
  whole-word, three characters or more); every guide ends with "More guides" and
  "Free price tools".
* **`/llms.txt`** maps the site for AI answer engines (Rift Compare has had one
  since September), built from the same data as the pages.

Not ported: Rift Compare's author pages and Person bylines (its byline is the
owner's statement about that site only), and its news sitemap (no news posts here).

## One family page and "Searching another game?" instead of a hub domain — 2026-10-28

The owner asked whether a separate hub site (tcgcompare.app or "TCG Empire")
should proxy all the compare sites to win generic queries like "compare TCG
card prices". Not built. A proxy that shows the same card pages would copy
the sister sites and split their rankings (the split-query problem fixed on
RiftCompare the day before). A link-only hub on a new domain has no authority
and no card pages to rank with. TCGPriceEmpire, a full multi-game site, was
built once and never launched (archived in CompareEmpire on 2026-10-27).
Buying the domain is the owner's call and is on hold.

What shipped instead, at no cost:

- **"Searching another game?"** Under a search on each of the seven
  card-game sites, a line links the same words to every other card-game site's
  own search (its SearchAction target). Someone typing "Charizard" on
  RiftCompare is pointed to DexCompare instead of a dead end. These are search
  links, so they're `nofollow`: a results page is noindex everywhere. Nothing
  is fetched from the other sites.
- **One `/tcg-price-comparison` page, on RiftCompare only.** It lists every
  game we compare, has a search box that sends the words to that game's site,
  and is linked from RiftCompare's "Compare other TCGs" footer heading. One page
  on the strongest domain, never a copy per site, so the family never competes
  with itself for the generic query.
## Partner tags by site, eBay calls to YGO, and two price-row bugs — 2026-10-28

**Owner:** "we haven't generated any sales from those tags yet"; every affiliate
link must say which site it came from.

* **Tags.** `/go` tags `<site>-<market>-<placement>-<product>` in EPN's
  `customid`, Impact's `sharedid` and `subId1` (Rift Compare's earnings digest
  reads SharedId first; with only subId1 these sites' TCGplayer sales read as
  "No tag"), and Amazon's `ascsubtag`. Store links get
  `utm_source=<domain>&utm_medium=referral` so a store sees what we send it.
* **eBay budget.** Gundam and Lorcana spent ~1,000 of 1,500 a day covering every
  eligible product; YGO's 3,407 hit the cap. Lorcana 1,150, Gundam 1,150, YGO
  2,200: still 4,500 of 5,000.
* **TCGplayer's "low" is not trusted below half the market price** (US$3+
  products; `src/lib/import/sanity.ts`). Lorcana's Hyperia City booster box
  showed TCGplayer at US$1.00, market US$150.67, as the cheapest price.
* **No eBay row without a reference.** TCGplayer's price, or for a product it
  doesn't price yet the cheapest in-stock store price; outside 0.25x-4x of it the
  row is hidden (the store rule). Stardust Trails booster packs showed booster
  boxes at US$83-129.
* **Pack inserts out of the index.** Lorcana's 157 puzzle inserts and ink drops
  (a few cents each) were 12% of its sitemap; now out of it and noindex.

## Sitemap lists cards from $5 — 2026-10-28

Search Console's URL Inspection sample on 2026-10-28: 28 of 31 URLs from the
16,191-URL sitemap were unknown to Google, two weeks after launch. A new domain
gets a small crawl budget, and it was spread over thousands of $1 cards nobody
searches for. `SITE.sitemapMinCardCents` (engine option, default 50) is 500
here: about 8,000 URLs, every sealed product, set and guide included. Cheaper
cards are still linked from their set pages. Revisit once most of the sitemap
is indexed.

## eBay pushed harder on the card page's phone buy block — 2026-10-28

The owner asked for more eBay clicks across DexCompare, MTG Compare and the
engine sites: most buy clicks go to stores that pay nothing. On the engine's
phone buy block, the "or $X on eBay/TCGplayer (+N%)" line now shows a paid row
up to 50% dearer than the cheapest store (was 20%), and when there is none, an
"or check listings on eBay →" search (`from=card_top_ebay_search`). Both are
real rows or a plain search, labelled "Paid link"; nothing is reordered and no
price is estimated: the owner floated showing an estimated eBay price that
"happens to be cheapest", which was not built because it would mislead buyers
(Australian Consumer Law, eBay Partner Network rules).

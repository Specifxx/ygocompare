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

## Card ad strips: real cards on eBay and TCGplayer, on every page — 2026-10-28

**Owner:** "we need more ads everywhere … more TCGplayer ads and more eBay ads",
like the eBay banner of real cards that earns on Rift Compare, and noted that
TCGplayer is back in Australia.

* **What.** Two ad strips (`src/components/CardAds.tsx`, tiles chosen in
  `src/lib/card-ads.ts`): a row of real cards with their photos and the cheapest
  live eBay Buy It Now in the visitor's market (eBay US where that market has
  fewer than four), and a row with TCGplayer's market price linking to the
  product on TCGplayer. Each strip is labelled "Ad", ends in a "Shop eBay" /
  "Shop TCGplayer" tile, and carries its own disclosure line. Clicks go through
  `/go` with `from=<page>-ebay-strip` / `<page>-tcg-strip` (and `-all` for the
  shop links), so they show in the tag reports by placement.
* **Where.** Homepage (replaces eBay Picks, which was US-only), set pages (eBay
  after the top cards, TCGplayer after sealed), card pages (eBay below the price
  history, TCGplayer after "More from"), and every other page above the footer
  (`FooterCardAds`), except the policy pages. Never above or between price rows,
  never a pop-up.
* **No extra eBay calls, no hosted creatives.** The listings are the import's
  own results: `summary.json` gains `e`, the cheapest in-stock (not pre-order)
  eBay listing per market. `scripts/rebuild-summary.ts` wrote it from the
  committed shards so the strips work before the next import. Impact's hosted
  TCGplayer banners are seasonal and expire; ours are always today's cards.
* **Ads, not price claims.** A strip's tile never feeds a "cheapest" line, a
  sort, structured data or the sitemap.
* **TCGplayer Direct in Australia.** Since 2026-10-07 TCGplayer Direct ships
  Magic, Pokémon and Yu-Gi-Oh! singles to Australia. `tcgplayerDirectMarkets`
  (site config, off by default) lets the strip say so: YGO Compare sets `AU`;
  Gundam and Lorcana say "US marketplace · prices in US$" outside the US.

## Store audit: 47 stores added, 76 that matched nothing out — 2026-10-28

**Owner:** check every site's store health and make sure the latest stores
are on it.

* **Health.** Every store the last import read with two or fewer matches, or
  none in stock, was re-probed from a GitHub runner in its market with the real
  matcher on page one of each Yu-Gi-Oh! collection. The 76 that still matched
  nothing are removed. gsgameon, burbankcards, playntradewpg read again from new collections. Obsession Gaming and Kuma Cards started
  blocking on 2026-10-27 on every sister site and stay for now.
  Most of the YGO removals were stores added on 2026-10-27 from the sister
  sites' lists that turned out to carry no Yu-Gi-Oh! printing the catalogue
  holds (`catalogMinCardCents` keeps sub-dollar cards out), so they never
  matched a product.
* **New stores (515 → 486)** come from every store on the
  eight sister sites' registries and the official Riftbound store registry's
  Shopify game stores, probed the same way: added only when at least five
  products match, three are in stock, the store charges its market's currency,
  and it is not a second address of a store already listed. Fetch TCG stays
  out (a marketplace, not a store).


## Small eBay + TCGplayer pair near the top, and the Gunpla pages get ads (2026-10-29)

Owner: on card, sealed and other product pages the eBay and TCGplayer strips should "also show up … near the top, but much smaller so it's not intrusive", and the Gunpla section should carry the ads like every other page. `CompactCardAds` (CardAds.tsx) is one slim box of 56px tiles, an eBay row and a TCGplayer row (side by side from `lg`), each with an "All →" link, one "Ad" + disclosure line, placed under the page's price and Buy block: on `/card/[slug]` (singles and sealed, the same tiles as that page's big strips) and `/kit/[slug]` (the game's top cards). Its `/go` tags carry `-mini` (`card-mini-ebay-strip`, `kit-mini-tcg-strip`…) so the two placements are measured apart. The kit pages and hubs now also get the footer pair (`FooterCardAds` no longer skips `/kits` and `/kit/`). The full-size strips stay where they were.

## Kit pages carry eBay ads of the kits, not card ads (2026-10-29)

The card ads that went onto the Gunpla section earlier today were a poor fit beside a model kit. Kit pages now show the
kit's own box photo, then its grade's popular kits, as eBay tiles: a slim row under the Buy button and a full strip
below the page; `/kits` and each grade page carry the full strip of their popular kits. Each tile is a tagged `/go`
eBay search for that kit's name in the visitor's market (`from=kit-mini-ebay-kit`, `kit-ebay-kit-strip`,
`kits-…`, `kit-grade-…`), so it costs no eBay API call. The card footer pair no longer shows on kit pages
(`FooterCardAds` OWN_STRIPS). Engine code: only a site with `SITE.kits` renders it.

## One pre-order page per release — 2026-10-29

Rift Compare's most visited page is a single release's pre-order page
(/radiance-preorders, 2.2K visitors in 14 days to 29 October); OP Compare's
/eb05-preorders (593) and MTG Compare's Star Trek page (302) repeat it. This
engine had one generic /preorders page whose title changed with the next set,
so it could rank for no release. Each release now has its own page,
`/preorders/<set slug>` (`lib/preorders.ts`, `app/preorders/[slug]`): "<game>
<set> Pre-Order Prices: Booster Box Compared", the set's sealed products with
every store's price, its facts and FAQ (`content/preorders.ts`, keyed by set
slug; a set without copy still gets a page from its data). /preorders is the
hub listing them and names no set, so it never competes with them.

A set has a page while upcoming with any sealed product, and for 45 days after
release if it has a booster box (then "<set> Booster Box Prices"; release week
is when most people shop for a box). After that its URL 308s to the set page,
so no stale page competes with the card list. The soonest release is linked
from a one-line strip under the header on every page, the homepage's
"Pre-orders and new releases" block, the set page and the sitemap. Six hours,
nothing prerendered at build. Family links now point at dexcompare.app and
compareempire.com, the canonical hosts (their www names lost DNS on 2026-10-26).

## 2026-10-29: A "most valuable cards" post for each recent booster set

Owner (29 October): the smaller sites need many more useful posts, and RiftCompare's Google traffic comes from set
and chase-card searches. `src/content/blog/set-chase.ts` adds one post for each of fourteen recent sets, from
Rage of the Abyss to Beyond the Brave, the Battles of Legend sets and Rarity Collection 5 included. Every table and
price is a live token; the counts in the prose were read from the 28 October data and say so, and they count
printings in our catalogue (which leaves out cards under US$1 in older sets), never "cards in the set". No post is
called a "card list" (`/sets/<slug>` owns that query), and no post repeats a rarity list: the set posts link
`/cards/rarity/<slug>`. Magnificent Monsters is left out because its Grand Master Rare prices come from a handful
of listings (one at US$68,000). Content only, no engine change.

## DexCompare's buy layout: market bar, one loud button, buy rows on set pages — 2026-10-29

Fourteen days to 29 October (Vercel): DexCompare turned ~44% of visitors into
a store click, Gundam 12%, Lorcana 25%, YGO 4%. YGO's visitors came from a
Reddit post that linked a set page, which listed sealed only as tiles: no
price in the visitor's currency and no button. Three things ported from Dex:
the price table opens with the market its prices are for, its in-stock store
count and a one-tap market switch (the header picker alone went unnoticed);
only the best price gets the solid "Buy now" button and every other row says
"View deal" (Dex's red-button rule); and a set page opens with its booster
boxes and sealed, each with its cheapest price in the visitor's market and a
"Buy now" through /go (`SealedQuickBuy`, from=set_quickbuy) before the card
list. Measure buy_click per visitor again around 12 November.

## 2026-10-30: One eBay campaign for every Compare site, hard-coded

**Decided (owner).** Every Compare site now sends eBay clicks to ONE EPN campaign, 5339155912 (RiftCompare's,
already set up), hard-coded in the code: no variable overrides it any more, so a forgotten secret or Vercel
value can't split the sites again. The sites are told apart by the `customid` prefix alone, which comes first
in every tag; this site's is `ygo-<market>`. The eBay import's affiliate header uses the same constant, and /go re-tags stored listing URLs, so listings saved under the old campaign earn on the new one at once.
Replaced: 5339155911 (WargameCompare, FigureCompare, Compare Empire, K Young), 5339231473 (Lorcana),
5339231474 (Gundam), 5339234013 (YGO). Old secrets/variables (`EBAY_AFFILIATE_CAMPAIGN`,
`NEXT_PUBLIC_EBAY_CAMPAIGN_ID`, `EBAY_CAMPAIGN_ID`) are no longer read and can be deleted.

## 2026-10-30: three stores out so the ops monitor goes green again

The ops monitor failed every run since 2026-10-27 on three stores, which hid any new problem behind the same daily
email. Removed: Obsession Gaming (AU, Cloudflare challenge, 403) and Kuma Cards (UK, 401), both blocking every sister
site since 2026-10-27 (Gundam and Lorcana Compare already list neither), and Rival Cards (CA), whose Yu-Gi-Oh! boxes
are titled without an edition ("2026 Yu-Gi-Oh! Blazing Dominion Booster Box"), so they never match a `[1st Edition]`
product and the matcher is not loosened to take them. Re-probe Obsession and Kuma on 2026-11-11; add either back only
when its feed answers a runner again.

## 2026-10-30: quick view on every product tile (from K Young); Amazon second

Owner: "I really like the kaeyoung quick view pop ups, can we do that for … all the other sites". A plain click on a
card or sealed tile (`ProductTile`) now opens K Young's quick view at once with what the tile shows (art, name, set),
then draws the card page's own `PriceTable` (same rows, same order, same market picker) from `/api/quick/<slug>`, a
function response the CDN keeps six hours like the pages (`Cache-Control: s-maxage=21600`); it is fetched ahead when
a mouse rests on a tile. The tile is still a real link, so crawlers, new tabs and modified clicks reach the card
page, whose server HTML keeps every price. Amazon's row on sealed tables moves from the top to just under the first
eBay row (owner, 2026-10-30: eBay first, Amazon second), or stays first when there is no eBay row. Engine change,
identical in Gundam, Lorcana and YGO Compare.

## 2026-10-31: wrong-price reports and store suggestions go to a private GitHub repo

**Owner:** "for all of these websites … we must have the ability to report any prices that are wrong, for users to
suggest a store … it's just stored within the GitHub … a daily job that checks for that."

* Every Compare Empire site now has the same two forms: **Report a wrong price** (a quiet link under the price table
  that opens in place, never a pop-up) and **Suggest a store**. Both POST to `/api/report`
  (`src/lib/reports-github.ts`, `src/components/ReportForms.tsx`: the same two files in every site repo).
* They are filed in ONE **private** repository, `Specifxx/compare-reports`: one new JSON file per report at
  `inbox/<site>/<day>/…json`, created through GitHub's contents API with `REPORTS_GITHUB_TOKEN` (a fine-grained token
  with Contents read/write on that repo only, Vercel only). Private because the site repos are public and a note is a
  stranger's free text; the K Young reviews branch is public because reviews are meant to be read.
* Nothing about the visitor is stored: no email field, no IP, no hash of one (the per-visitor limit, 6 an hour, lives
  in the function's memory), and email addresses, IP addresses and phone-like numbers in a note are blanked before
  the write. A honeypot field swallows bots.
* Each write creates a new file (no read, no sha), so reports never race, and the commit subject never carries
  `[deploy]`/`[preview]`. The route is POST only: no page view or crawler runs it, so it costs nothing at rest.
* A daily job in that repo (`triage.yml`) keeps one issue per site listing what is still open, flags repeat
  reports of the same product and store, and warns before the token expires. A handled report is moved to
  `done/<site>/`. Until the token is set the route answers 503 and the form says to email the site's address.

## Visitor reports live on each site's own `reports` branch, not a private repo — 2026-10-31

**Owner:** "we don't need a private repo for this … just build it into each site … inside the public GitHub, it's
fine. As long as it's not reflected on the front end." This replaces the private `Specifxx/compare-reports` repo
of the entry before it; everything else in that entry (the forms, no email/IP, redaction, new file per report,
POST only, 503 until the token is set) still holds.

* Each site writes its reports to **its own repo**, on an orphan branch named `reports` (`SITE_REPOS` in
  `src/lib/reports-github.ts`): `inbox/<site>/<day>/…json`, moved to `done/<site>/…` once handled. The branch is
  never merged into `main` and never deploys: `git.deploymentEnabled.reports = false` in `main`'s `vercel.json`
  (pinned by `tests/reports-github.test.ts`) and the branch's own `vercel.json` turns deploys off as well.
* Nothing on any site reads the branch, so no report ever shows on a page. The branch is public with the source,
  which is why nothing about the visitor is stored and notes are redacted before the write.
* One token, `REPORTS_GITHUB_TOKEN` (fine-grained, Contents read/write on the twelve site repos only), set in each
  Vercel project for Production.
* The daily triage moved to RiftCompare (`Specifxx/TCGEmpire`): `.github/workflows/reports-triage.yml` reads all
  twelve `reports` branches through the API and keeps one issue per site there, plus a once-a-day "Reports digest"
  comment. Those issues are public, so they link to each report's file and never quote a note. It fails (and
  GitHub emails the owner) when a site has no `reports` branch, or the token stops working or expires within 14
  days (checked only when the token is also a TCGEmpire Actions secret). The ops monitor's job list watches it.

## 2026-10-31 — Every card and sealed link opens the quick view

Owner, 2026-10-31: "Whenever I click on any item … I want a quick view open like K Young." Only `ProductTile` carried
`data-qv`, so the other links to a product (home lists, movers, set tables, blog posts, search) went straight to its
page. `QuickView.tsx` now opens for any plain click on a link to `/card/<slug>`, reading the slug from the href when the
link has no `data-qv`, and `/api/quick` also returns `name`, `sub` and `img` for those. Links inside the quick view and
on the product's own page, and modified, middle and new-tab clicks, navigate as before. Engine change, identical in
Gundam, Lorcana and YGO Compare.
Gundam, Lorcana and YGO Compare.

## 2026-10-31 — Featured creators page (/creators)

Owner, 2026-10-31: add the Gundam Card Game creator phixtcg (Instagram and YouTube) to "our creators page", as
MTG Compare has. The engine now carries MTG Compare's `/creators` pattern: types and helpers in `src/lib/creators.ts`,
each site's hand-curated list in `src/content/creators.ts`, round avatars in `public/img/creators/` (cut to a circle
from the creator's own profile picture), a spotlight for the newest, a homepage strip (`CreatorsTeaser`, under the
top ad slot), a footer link and a sitemap entry. A site whose list is empty (Lorcana and YGO Compare for now) has no
page (404), no strip and no links. Static data, server HTML, `revalidate = 86400`. Creator links are followed and keep
the referrer (`rel="noopener"`, no `noreferrer`); nobody pays to be listed and a listing never touches store order.
Engine change, identical in Gundam, Lorcana and YGO Compare.

## eBay: local sellers and stated postage only (2026-10-31)

A WargameCompare visitor's feedback (the owner passed it on for every sister site): eBay rows from overseas sellers
carried postage that made "a lot of wasted clicks". The Browse search now asks for items located in and delivered to
the market's own country (`itemLocationCountry`, `deliveryCountry`) and sends the buyer's country and a central
postcode as `contextualLocation`, so eBay quotes real postage. `pickBest` keeps only a listing whose postage eBay states,
in the market's currency, and still picks the cheapest delivered. A stored eBay row without a stated postage (the older
any-seller search) is no longer shown (`decodeOffer`); the rest are searched again on their usual rotation. Same change
in Lorcana Compare and YGO Compare (engine).

## Christmas theme (engine): 1 November to Boxing Day (2026-11-01)

Owner, 2026-11-01: every Compare site gets a Christmas theme after the Halloween one, each its own take. Engine change, same in Lorcana Compare and YGO Compare: snow over the home hero, the corner art on the right (the hero text is left-aligned), a Santa hat on the header icon, and a gift pill whose words come from `SITE.christmas` (Gundam "Operation Christmas", Lorcana "A Christmas wish upon a star", YGO "Holiday Duel").

The season window is fixed in `src/lib/season.ts`: 1 November to 26 December, every year, by the visitor's own
date, stamped on `<html data-season>` by an inline boot script before first paint. `?season=christmas` previews it out
of season and `?season=off` hides it in season. Every decoration is CSS-gated on that attribute, `aria-hidden`,
`pointer-events: none`, painted under the content (never over a price or a button), animated with `transform`
only, and stopped under `prefers-reduced-motion`. The page's content and links stay in the server HTML; the season
adds no request, no script beyond the boot line and no database or data read. The shared rules sit between
`xmas-common:start` and `xmas-common:end` in `globals.css` (identical on every sister site); this site's colours sit in
the `xmas-site` block after it. Art is eight small SVGs in `public/xmas/`. To end it early, move the `to` date; after
Boxing Day it switches itself off.

## 2026-11-01: A beta community forum, no accounts, posts in this repo

The owner asked for "user forums ... you don't need to be able to sign in ...
put your name down ... it'll save your name ... all of this is public data ...
keep it within each website's repository", on every site, to give the sites a
reason to come back that search rankings alone don't. `/forum` (docs/forum.md):

- **Storage:** `forum.json` on this repo's public orphan branch `forum`
  (never deployed: its own vercel.json, plus `deploymentEnabled.forum: false`
  here). Written only by `POST /api/forum` with the visitor-reports token;
  a write reads the file's sha and retries when two posts race.
- **Cost:** pages read the file from raw.githubusercontent.com inside their
  normal cache life, never per visit; the browser fetches the newest copy from
  GitHub directly, so a new post shows in minutes with no deploy, no function
  and no database. Rebuilding pages for posts would have meant a build per post.
- **Spam:** honeypot, a 2.5 s minimum on the form, per-visitor limits (4 per
  10 min, 20 a day, 4 threads a day) and a per-instance cap, all in memory; no
  IP, email or hash is stored, and emails/IPs/phone numbers in posts are
  blanked. Links to other sites and slurs or strong profanity are HELD (filed
  under `held/` and flagged in the daily reports triage), never published.
- **Not dead when empty:** the site's topics with a line and a few prompts;
  never an invented post.
- **SEO:** threads are in the server HTML; a thread is noindex until it has a
  reply, the forum page until any thread has one; indexed threads carry
  DiscussionForumPosting JSON-LD.
- **Moderation:** the owner asks Claude; a post is removed by an edit to
  `forum.json` (`removeFromForum` in `src/lib/forum/core.ts`).

## 2026-11-01: Creators, "How to work with us"

Creators kept asking the owner how we'd like the site promoted, so /creators
now answers it in a "How to work with us" section (`#work-with-us`). Owner's
terms: flexible, low expectations, no contract, script or quota; any one of
three is plenty: link the site (plus their creator code where the site has
codes, RiftCompare only), a shout-out in their normal content, or a
walkthrough/review of the site. They call us their **partner**, never
"sponsor": we don't pay them for a mention. On our own pages they stay
"featured creators" ("partners" here still means affiliate links). The
section asks them to say it's a partnership (FTC/ASA), lightly. The
owner's ready-to-send replies live in the project's creators playbook, not
in the repo.

## 2026-11-01 — Attribute hub pages (/cards/<facet>/<slug>)

Bill asked for more SEO-indexable hubs on every site. The engine now builds a
price list per value of a card attribute named in `SITE.cardHubs` (off by
default): Gundam's colours, card types and traits; Lorcana's inks, franchises
(the Disney film), classifications and card types; YGO's attributes and monster
types. Each facet also gets an index at `/cards/<facet>` with live counts,
median and top card. Only values with `minItems` cards (default 12) get a page,
so the sitemap never lists a thin hub; catch-alls ("Standard Characters",
"Lorcana") and a data typo ("Warior") are excluded. Pages are `revalidate =
86400` with an empty `generateStaticParams` like the rarity hubs. Card pages
link each attribute to its hub, and the `{{attrstats:FACET}}` blog token draws
the comparison table, so posts link the hubs instead of repeating them (a post
never lists the cards a hub lists: [[seo-split-pages]]).


## Contact address: compareempire@gmail.com — 2026-11-01

The owner: "the sites that they don't [have their own email], just use compareempire@gmail.com", and visitors "can
just email us directly". `supportEmail` moves from riftcompare@gmail.com (another brand's inbox) to the Compare Empire
family inbox, shown in the footer and on `/contact`. No mail service is added.
## 2026-11-01: eBay and Amazon rows look like the other price rows

The owner: "the ebay and amazon links should blend in and look exactly the same as the other price rows … reflect that
change on the other sites that require it." Paid marketplace rows (eBay, Amazon, and TCGplayer where it is pinned) keep
their place and their "Ad"/paid-link label, but lose their brand tints and brand-coloured buttons: they use the same row
and the same button as a store. They are still never counted as a store and never re-ranked by commission. This
reverses the 2026-10-30 "bright, catchy colour" pinned rows; eBay ad strips and panels outside the price rows keep
their own look.

## 2026-11-01 — The US comes first in the eBay plan

Owner, 2026-11-01: "the eBay API for all websites should also prioritise the US." The plan already gave the US 75%
of the day's calls; two gaps remained. Slots the UK and Australia could not use (everything there checked in the last
12 hours) were simply not spent, and nothing pinned the US to run first. `planEbayRefresh` (engine, all three sites)
now plans every US call before any other market's, so a quota stop mid-run cuts the UK and AU, never the US, and hands
the other markets' unused slots to the US's next-ranked products. Shares, floors and intervals are unchanged.

## A fourth engine site, and two options it needed — 2026-11-01

Cyberpunk Compare (`Specifxx/cyberpunkcompare`, cyberpunkcompare.com) runs this
engine too; `engine.json` lists four repos and every footer links it. Two
options were added for it, both off unless a site sets them: `setEditions`
(one set printed as Beta and Retail under identical names: a title counts for
an edition only when it names it, the default edition otherwise, and never
when it names two; store matching and the eBay pass both apply it,
`tests/set-editions.test.ts`) and `rarityNames` (TCGplayer rarity codes
spelled out at import). A fourth number style, `plain` ("001", "B001"), is its card numbering.
`markersAgree` now also accepts a title word that is
one word of the product's rarity ("Iconic" for "Iconic Legend"). It uses its
own eBay app (owner); this site's eBay budget is unchanged.

## 2026-11-02 — Self-updating price report

The owner wants growth that runs without him ("a more passive, working in the background solution"): no daily Reddit
posts. Links are the passive lever, and outreach needs a page worth linking to. `/price-report` is that page: one URL
for good, rebuilt from the committed data every release (`src/lib/market-report.ts`, pure, tested), so nobody writes
it. It says how often a US store undercuts TCGplayer's market price on cards from $5 and sealed from $10 (USD against
USD, never converted), lists the most valuable sealed products a US store has in stock (cases left out: almost none
are stocked), counts products in stock per market, shows the 30-day movers (7-day until a month of history exists) and
ends with a citation line. `revalidate = 86400`, in the sitemap and footer. The daily outreach task offers it to
writers and creators.

## 2026-11-02 — Black Friday page

`/black-friday` lists today's in-stock US store prices 8–60% under TCGplayer's market price (the same
`deals()` as the homepage and Deal Finder, stores only: eBay and Amazon rows are left out), sealed first, then cards, one row per product. One URL kept
every year so links and rankings carry over; it must be indexed weeks before the day (27 November 2026),
so it ships now. The homepage links it from 1 November to a week after Cyber Monday; the footer and
sitemap always do. Never a "was" price, a countdown, "ends soon" or an invented sale: we only know what a
store asked when we last read it. Dates and the split are pure (`src/lib/black-friday.ts`, tests in
`tests/black-friday.test.ts`). Part of the passive-growth plan (owner, 2026-11-02: no daily Reddit posts).

## 2026-11-02 — Free price widgets

`/embed/card/<slug>` is a live price badge any blog, deck guide or store can put in an `<iframe>`: the cheapest in-stock
store price in the chosen market (`?market=`, US by default; never TCGplayer, eBay, Amazon or a pre-order), else
TCGplayer's market price labelled as such. `/embed` lists the snippet (the iframe plus one plain text link, the only
part search engines credit) and a plain-HTML badge for the stores we compare. The daily outreach offers the widget
instead of asking for a link (owner, 2026-11-02: growth must be passive). The badge is a route handler reading only
`src/lib/data.ts`, noindex, cached a day by its CDN header; a missing slug answers 404 with a 5-minute cache.
RiftCompare has had the same widgets since 2026-09.

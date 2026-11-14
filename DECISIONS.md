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

## 2026-11-02 — The monitor reports to Empire HQ; only red mails

The owner asked for one Monday email instead of a mail per site (the control tower, approved 2026-11-02). The ops
monitor now writes every result to `ops-status.json`, and its workflow force-pushes it as `status.json`, one orphan
commit, to this repo's public `ops-status` branch (never deployed, `vercel.json`). RiftCompare's ops monitor reads it
every three hours for Empire HQ (riftcompare.com/admin/hq) and the one Monday report, and mails the owner itself if
the file goes quiet for a day (a stopped monitor cannot mail). Only a FAILED check fails the run, which is GitHub's
email to the owner; warnings wait for HQ and Monday. The file carries status and the monitor's own sentences only,
the same as the public Actions log.


## 2026-11-02 — An announced set with written copy gets its pre-order page before any store lists it

`/preorders/<slug>` already built itself for every upcoming set with a sealed product. The gap was the months between
an announcement and the first store listing, when "<set> pre-order" is already searched: Gundam's GD07 Blazing Fist
had copy in `src/content/preorders.ts` but no page. `preorderSets` now takes a `curated` test, and `preorderSetList`
passes "has an entry in `PREORDER_COPY.sets`": such a set has its page while upcoming even with nothing sealed, saying
plainly that no store lists it yet. Promo groups and placeholders have no copy, so they still need a sealed product.
The header strip ("pre-orders are open") still waits for a real listing. Engine change, the same in all four repos.

## 2026-11-02 — Seasonal sale pages

`/boxing-day`, `/january-sales` and `/lunar-new-year` (owner-approved growth plan, 2026-11-02): one URL
each, kept every year like `/black-friday`, built weeks ahead so Google has indexed them before the day.
Dates, the year a page is about (it rolls over a week after the event) and the homepage window are pure
in `src/lib/sale-seasons.ts` (tests in `tests/sale-seasons.test.ts`); Lunar New Year is a published-date
table to 2040 (6 February 2027). The site covers several countries, so no page reads as one country's:
the opening sentence names every market we have stores in, and the page has one section per market,
in that market's own currency, never converted. Each section lists `storeDealsIn(market)`: the cheapest
in-stock store at least 10% (and at most 45%: past that it is likelier a wrong match than a sale) under
the median of three or more stores there, stores only; the US section also keeps the Black Friday
page's under-TCGplayer `deals()`. Never a "was" price, a countdown or an invented sale. The footer and
sitemap always link them; the homepage only from a few weeks before each event to two days after.

## 2026-11-02 — Price alerts through RiftCompare's shared service

The owner chose "Yes, one shared service" for email price alerts on the sister sites. This reverses part of
"No accounts, no database, no email" (2026-10-25): the site still has no accounts, no database and no mail key, but
the card page now has an "Email me when the price drops" form.

- **The form** (`components/PriceAlertForm.tsx`, the same file on every sister site; `PriceAlert.tsx` picks the
  visitor's market) posts `{site, productId, region, email, targetCents}` straight to
  `https://riftcompare.com/api/sister-alerts`. RiftCompare keeps the address (its own Neon project, private tables),
  sends one confirmation email (double opt-in), then checks daily. This site stores nothing and holds no key.
- **The prices** come from this site's own static `/alert-feed.json` (`lib/alert-feed.ts`), built with each deploy
  from the same files the pages read: per product, the lowest in-stock store or TCGplayer offer in each market, in
  that market's currency, never eBay, never converted; plus up to five of the site's own deals (store price under
  TCGplayer market) that another card site's alert email may end with. Served from the CDN (`revalidate` 86400),
  so it costs no function call.
- **Behind `SITE.priceAlerts`** (on for Gundam, Lorcana, YGO and Cyberpunk); the site's `key` must be registered in
  RiftCompare's `lib/sister-alerts/sites.ts`. The privacy page says what the form sends and links to RiftCompare's.
- RiftCompare's `sister-alerts.yml` fails (and its ops monitor reports it) when a site with alerts serves no fresh
  feed, so a broken feed here shows up there.

## Share buttons and shared lists (2026-11-02)

The owner wants word of mouth to drive growth. Every card and sealed page and
the quick view get a Share button (`components/ShareButton.tsx`): the phone's
own share sheet, else the link copied, no pop-up, no reward, no account. The
message names the real price gap in the visitor's market (`priceGap` in
`lib/share.ts`: cheapest and dearest in-stock item price from two different
sellers, never converted). The card page's share image
(`card/[slug]/opengraph-image.tsx`) draws the same gap for the US, the page's
baseline market; it is drawn on first request and kept a day (empty
`generateStaticParams`), so only cards someone shares cost a render.

Best Basket results get "Share this list": `/list?i=<id>*<qty>.<id>…` carries
the list in the URL (nothing stored), and `/list` is one static, noindex shell
that prices it in the visitor's market through `/api/basket`.

Every shared link carries `utm_source=share&utm_medium=<card|sealed|list>`.
The button sends a Vercel `share` event and `ShareArrival` one `share_visit`
event per tab when a shared link brings someone; RiftCompare's growth report
counts both per site. robots.txt allows `/*utm_source=share` (it blocks other
query strings) because X's and Reddit's preview fetchers obey robots.txt.

## Sites that grow each other: the family feed, cluster blocks and short footers (2026-11-02)

Owner, 2026-11-02: "We need each site to help each other grow as a team effort", and the
footer family lists were "a bit convoluted … I'm wondering if it actually helps". Plan:
"Sites that grow each other" in the consolidation doc (https://claude.ai/artifact/QjrWGrfBqH4sKctwdjwptK).

- **Three clusters** (`src/lib/family-network.ts`, the same file in every repo): card games
  (Rift, OP, Dex, MTG, Gundam, Lorcana, YGO, Cyberpunk), hobby (Wargame, Figure, Gunpla on
  Gundam Compare) and tech (Compare Empire, CamCompare). KaeYoung stays out.
- **The family feed.** Each site's own daily data job writes `family-feed.json` (its best real
  deals and pre-orders today, per region) beside the data it already commits, and copies its
  cluster sisters' feeds from raw.githubusercontent.com into `family-cluster.json`. Pages read
  the committed file: no database of another site, no request-time fetch, no new function. A
  feed older than four days, from the wrong site, with a link off its own host or a saving that
  isn't the arithmetic of its two prices is dropped (`validFeed`), so a block shows less, never a guess.
- **One block per page**, on the deals, Black Friday and pre-order pages: one tile per sister with
  its best item in the visitor's region, else the US price in its own currency. Labels never name
  a country. Plain followed links inside a cluster.
- **Footers: one short line.** The sites of our own cluster by name, then one "A Compare Empire
  site" link to https://compareempire.com/network, which lists every site. Why: nothing counts
  footer clicks, footer links get few, and Google gives little weight to sitewide links between
  one owner's look-alike sites (12 sites all cross-linked in every footer is the pattern it can
  read as a link scheme). Cross-traffic should come from the price blocks, which people have a
  reason to click.

## 2026-11-02 — Amazon Associates: following the Operating Agreement's Dos and Don'ts

The owner sent Amazon's own "Operating Agreement: Top Dos and Don'ts" page (2026-11-02: "make sure you
are following these instructions for all amazon affiliates"), and every site was audited against it.
The rules we keep, on every Compare Empire site:

- **Disclosure beside every Amazon link** ("Ad" / "Paid link"), and Amazon's statement "As an Amazon
  Associate I (we) earn from qualifying purchases." in the footer of every page.
- **Amazon's trademark notice** in the footer of every page: "Amazon and the Amazon logo are trademarks
  of Amazon.com, Inc. or its affiliates." No Amazon logo, screenshot, review or Amazon's own colours
  (its orange): the page "Don't use style or color of Amazon site which may cause confusion".
- **Links lead to a specific product** (an ASIN, or a search for that exact product's name), never a
  category or generic search: "All the links or buttons on your site should take customers to specific
  products on Amazon."
- **No Amazon link in a pop-up or layer**: the quick views show none; product pages carry the row.
- **Never Amazon prices in price tracking or alerts** ("Don't track prices or set price alerts"), and no
  Amazon link or trademark in any email, SMS or printed material.
- Every link tagged, rel="sponsored nofollow"; no incentive (cashback, discount) for buying through it.
- Engine: the footer carries the exact statement and trademark line; the quick view API sends no Amazon
  search; the Amazon row's button says "Check price" (not "View deal"); /go answers `no-store`.

## 2026-11-02 — Region switcher in the hero, with drawn flags

Owner: "the region switcher must be more prevalent on all sites, on the main home page hero, and have the
flags as well". The homepage hero now has a "Prices for" row of every region (flag + name, code on phones;
`MarketChooser`), the header menu shows the flag and code of the region in use (a native select laid
invisibly over them, so it stays keyboard- and screen-reader-friendly), and the price table's region pills
carry flags.

- **Flags are inline SVG (`src/components/Flag.tsx`), not emoji and not image files.** Windows draws a flag
  emoji as two letters ("US"), and image files would be new requests and hosting. No ids or clip paths, so
  a flag works inside a closed menu and many times on a page. The same file is in every Compare Empire
  repo that has a region switcher; keep the copies identical.
- Wording stays region-neutral: "Prices for", "Choose your region", never one country's spelling or name.

## 2026-11-02 — At most one production build every 12 hours, and no branch but production deploys

**Why.** The owner capped Vercel spend at $5–6 a day across every site. 1 November cost $11.82 (normally
$2–4), and Build CPU was the largest line ($4.26), followed by CDN requests and ISR writes, which every
build multiplies (a deploy empties the page cache, so the next crawl re-renders and re-writes every page).
The `[deploy]` gate itself held; its premise did not: sessions landed 7–14 `[deploy]` commits a day per site
(manual "release now" runs and `[deploy]` in merge subjects), RiftCompare, OP, MTG and DexCompare alike.
Compare Empire's site built on every push to its production branch (84 commits that day) and CamCompare on
every three-hourly price commit, because neither had the gate.

**What.**
- `scripts/vercel-ignore-build.sh` skips a production `[deploy]` commit when the last production
  deployment (`VERCEL_GIT_PREVIOUS_SHA`, set by Vercel in that step) is under 12 hours old; the commit
  rides the next release. `[urgent]` in the SUBJECT overrides it, and only when the owner says a release
  cannot wait. An unset or unreadable last deployment builds (fail open). `tests/deploy-gap.test.ts` pins it,
  and the file is the same in every Compare Empire repo.
- `vercel.json` `git.deploymentEnabled` starts with `"**": false` and enables only the production branch
  (Vercel: when a branch matches several rules, any `true` wins). No preview is built for any branch or pull
  request, `[preview]` included; the older per-branch `false` entries stay for orphan commits' own copies.
- So "push to prod" means land on the production branch; the release reaches visitors within a day.

## 2026-11-03 — Footers link only card sites to card sites; every other site lists no sisters

The owner asked whether linking every Compare Empire site together helps or is a risk for search and for how the
sites look. Verdict: a sitewide footer link between sites one person owns carries little ranking value (Google
discounts it), and a mesh of unrelated sites (camera, appliance and figure sites in a card site's footer) can read
as a link network and looks odd to a reader. The owner said do it.

- `footerSisters()` in `lib/family-network.ts` (same file in every repo) now returns the other card sites for a card
  site and nothing for any other site. Gundam's Gunpla side no longer pulls WargameCompare and FigureCompare into its
  footer; the engine footer's heading is "Other card games".
- WargameCompare, FigureCompare, CamCompare and Compare Empire show no sister list in their footers, only one
  "A Compare Empire site" link to compareempire.com/network (Compare Empire: its own /network), the one page that
  lists every site. KaeYoung still links none.
- Anchors stay the brand name only, and links stay plain followed links: they are honest links between sites with
  one owner, not paid, so no `sponsored`/`nofollow`.
- Kept: the "Other card games" / hobby / tech price blocks on deals, Black Friday and pre-order pages
  (`clusterSisters`). They sit on a few pages, show real prices a reader of that page may want, and are not sitewide.
## 2026-11-03 — The daily Price Duel: a sharing loop, not another push

**Why.** Every growth lever so far (outreach, posts, hubs, widgets, Bluesky) adds a fixed number of
visitors, so traffic grows in a straight line. The share buttons shipped on 2026-11-02 were tapped 14 times
in their first week across all sites and brought 0 visits: nobody shares a price comparison. People share a
score. A daily puzzle that is the same for everyone (the Wordle loop) gives players something to paste into
Discord, group chats and Reddit every day, and each paste is the invitation for the next player.

**What.**
- `/daily`: ten pairs of cards, tap the one worth more at TCGplayer's US market price (`refCents`, never
  converted, never a store price). Puzzle #1 is 2026-11-03 (`DAILY_EPOCH`, never changed: shared results
  carry the number); a new one at midnight UTC.
- No function, no database, no extra build: the page is ISR (a day, like every tool page) and carries the
  next seven days' puzzles; the client picks today's by UTC date. Cards are chosen by a hash of (day, id), so
  a build that adds or drops a card leaves a day's pairs almost unchanged, and a pair's prices are 1.25 to 8
  times apart, so a day's price moves don't flip an answer. Cards under US$1 or over US$2,000 and token sets
  are left out (`src/lib/daily.ts`, `tests/daily.test.ts`).
- The share text is the number, the score, the emoji grid, the streak and the link with
  `utm_source=share&utm_medium=daily`; it names no price, so it spoils nothing. Progress and the streak live
  in localStorage only. Events: `daily_done { score }` and `share { medium: daily }`, read by RiftCompare's
  growth report like every other share.
- Measure: share taps and share visits with medium `daily` in the weekly growth report. Drop it if it brings
  nothing in four weeks.

## 2026-11-03 — The Price Duel as a widget

**Why.** The growth plan's fourth loop: a widget on a creator's or club's page shows our name to their audience,
so it grows with their traffic. Creators want something that changes daily more than a static price badge.

**What.** `/embed/daily` is a script-free HTML widget: today's puzzle number and first pair (art and names,
prices hidden) and one link to `/daily?utm_source=embed&utm_medium=daily`. A route handler reading the date, so
its only cache is the CDN header, held until midnight UTC (`secondsToUtcMidnight`). It reads the same pool as
`/daily` (`src/lib/daily-data.ts`). The snippet is on `/embed` with the iframe and one plain text link.

## 2026-11-03 — Sealed-first, on this engine: the sitemap lists cards from $20

**Why.** The owner asked whether YGO Compare should move to DexCompare's and MTG Compare's sealed-only model,
since most old Yu-Gi-Oh! cards have no demand and seemed to be costing money. Measured that day:
- **Cost:** Vercel charged this project A$4.59 in the week to 2 November (RiftCompare's growth report).
  Card pages are never prebuilt (empty `generateStaticParams`), so an unvisited card costs nothing; the
  catalogue is not the bill.
- **Money:** A$39.93 earned that week, A$38.40 of it eBay sales from the pinned pre-order rows (sealed).
- **Google, 90 days:** 7 clicks and 562 impressions in all. Card pages took 3 of the clicks (a A$1.35 card,
  an unpriced qualifier stamp and a US$94 Starlight Rare); 60 card pages had any impression, none ten.
  Google has crawled little of the 6,100-card sitemap.

**What.** No engine change: this engine already has sealed pages, the pre-order pages that earned, and the
homepage sealed shelf. Removing singles would delete pages that brought half the Google clicks and save
almost nothing. Instead the sitemap points Google at sealed first: every sealed product, set and hub, and
cards from US$20 (`sitemapMinCardCents` 2000, about 2,200 cards, the floor eBay already uses) instead of $5
(6,100). Every card page stays live, indexable and linked from its set. Widen it again once Search Console
shows the sitemap mostly indexed. Recheck with the 2026-11-25 review.

## 2026-11-03 — The quick view shows the product's own link

**Why.** Owner: "quickview popup should have a link change as well for all sites, instead of using the same link". The
pop-up kept the list page's URL, so a copied or bookmarked link lost the product, and Back left the page instead of
closing the pop-up.

**What.** Opening a quick view pushes the product page's own existing URL (/card/<slug>) with `history.pushState`
(`src/lib/quick-view-url.ts`, the same file on every site). Back closes it and restores the list's URL, Forward reopens it,
closing it (×, Escape, the backdrop) steps back, so the history never fills with pop-ups. "See price history and details"
only hides the pop-up and navigates to the URL already shown, which Next turns into a replace: Back from the product page
goes to the list. The entry copies Next's own history state (`__NA` and the router tree), so the app router passes the
push through and the page under the pop-up never re-renders.

**SEO.** No new URL exists: the link is the canonical product page, which a reload, a share or a crawler gets in full
server HTML. Never a `?view=` or `#` variant (duplicate URLs, extra CDN copies). Pinned by `tests/quick-view-url.test.ts`.
## 2026-11-03 SEO audit: alt text, homepage title brand, ItemLists (engine)

Bill's network SEO audit (homepages only) found empty `alt` on product photos on every engine site and no brand in
Cyberpunk's title ("Cyberpunk TCG Card Prices — Compare 160 Stores": the long game name pushed " | Cyberpunk Compare" past
60 characters, and `fitTitle` then took the bare title). Every product photo, search thumbnail, ad tile and the logo now
has descriptive `alt` (the name). The homepage title ladder tries every candidate WITH the brand before any without, so
Cyberpunk reads "Cyberpunk TCG Card Prices — 160 Stores | Cyberpunk Compare". The homepage lists its shelf and chase cards
as an ItemList and sealed hubs got one like set pages'. Already in place and kept: Product + AggregateOffer on card,
sealed and kit pages, BreadcrumbList on every deep page, Organization/WebSite/FAQPage on the homepage, llms.txt.
hreflang is deliberately absent: the market is picked in the browser on ONE URL per page, so there are no regional
alternates to declare. `tests/seo-audit.test.ts` pins it.

## 2026-11-03 Sealed hero on the homepage (engine option `homeSealedHero`)

Bill: "if sealed products are driving most of our sales on some of our websites then for those websites we must make it
a big part of the home page and attention grab". The growth report for the week to 2026-11-02 says which: YGO Compare
earned A$39.93, A$38.40 of it from `preorders_pinned` eBay (sealed pre-orders); DexCompare and MTG Compare are
sealed-only and already open on sealed; OP Compare's money came from the card quick view and RiftCompare's from cards
and pre-orders together, so neither changes. On YGO the homepage opened with card ad strips and showed sealed fourth.

`SITE.homeSealedHero` (off by default) puts `components/SealedHero.tsx` straight under a shortened title block (on a
phone the header already has search and market, so the hero's paragraph, market chips, search box and button row are
hidden there): the newest booster box as a spotlight with its photo, cheapest store price, a Buy button through `/go`
(`home_sealed_hero`, `home_sealed_preorder`) and a labelled "Ad" eBay line (`home_sealed_hero_ebay`), then six more
boxes and each set on pre-order with its boxes. It replaces the plain sealed shelf. Built by `lib/sealed-hero.ts` from
the same committed data (a few set shards, no new read on any other page), every market's prices sent and the
visitor's picked in the browser like every price island. Store prices only in their own currency; eBay, Amazon and
TCGplayer are never "the cheapest store". A saving is shown only when real: the cheapest store against the middle
in-stock store of that market (3+ stores, 5–45%), or in the US against TCGplayer's market price (3–45%).
`tests/sealed-hero.test.ts` pins it. On for YGO and Cyberpunk (a sealed-first launch); Gundam and Lorcana have no
affiliate sales yet to say either way, so they keep the shelf. Judge it by `home_sealed_*` tags in the growth report.

## Rate us and "What people say", run by RiftCompare (2026-11-03)

Engine change, in all four repos. The owner wanted RiftCompare's rating pop-up on every site, each site's reviews public, and
every written review approved in RiftCompare's admin; star ratings count at once. The site stores nothing: the corner card
(`components/site-reviews/RateCard.tsx`, in the root layout) posts cross-origin to `https://riftcompare.com/api/site-reviews`
(keyed by `SITE.key`, which must be on RiftCompare's list), and the homepage's "What people say" reads the score and approved
reviews from `https://riftcompare.com/api/site-reviews/<key>` in the browser (public JSON, CDN six hours): no function, no data
read, no build step. The card copies RiftCompare's corner card, not its rating drive: never on arrival, after 4 pages and 3
minutes or on return from a store tab, at most three times 14 days apart, always closable; "Rate us" in the footer opens it.
While no ad script is on the page it says "We don't run banner ads, so if this helped, please leave us a review." (owner, same
day). No email asked for, never review markup. RiftCompare's DECISIONS.md, "Every site's reviews, approved in one queue".

## Amazon is the third pinned row (2026-11-03)

Engine change, in all four repos. The owner wants Amazon on every site "up there with eBay and TCGplayer", as "the third
row out of the three". The sealed product table's Amazon row (a tagged search of the visitor's own Amazon, no price) used to
sit right under the first eBay row, so on a product where eBay led it came before TCGplayer. `PriceTable` now puts it after
the last pinned row (eBay and TCGplayer, the cheaper first), or first when neither is shown. Still sealed only (a single
card's Amazon search finds the wrong thing), still product pages only (no Amazon in the quick view), never ranked, never
the cheapest.
## 2026-11-03 — Engine: several games on one site (`SITE.lines`), "series" numbers, BandaiCompare joins

BandaiCompare (`Specifxx/bandaicompare`, bandaicompare.com) runs this engine for three games at once: Union Arena,
Dragon Ball Super Fusion World and the Digimon Card Game. The engine gained, all off by default: `SITE.lines`
(several TCGplayer categories in one catalogue, each set tagged with its game, a hub per game at `/games/<slug>`,
per-game eBay words and TCGplayer links, ad strips that stay inside a game), `NumberStyle` "series" (Union Arena's
"REZ-1-053" beside the "code" numbers) and `SITE.disclaimer` (a not-affiliated sentence in the footer, /about and
/terms). This site sets none of them, so its pages, slugs and matching are unchanged. BandaiCompare is in the
family registry and in `sisterSites`; the sister-sites test now allows eleven or more. BandaiCompare's
DECISIONS.md has the reasons.

## The engine looks like RiftCompare: left rail, one concise homepage, one small ad pair (2026-11-03)

Engine change, in all four repos and BandaiCompare. The owner: "I kind of don't like the card engine … way too square …
too many ads … the homepage could be sorted much better … way too convoluted, make it much more concise", with
RiftCompare's homepage as the gold standard (minus accounts and Pro). What changed, and why each way:

- **A left navigation rail** (`components/SideNav.tsx`, `lib/nav.ts`) from 1024px up, like RiftCompare's, Dex's and OP's:
  the logo, a feature filter, and every section in three groups (Prices, Free tools, Guides & news). The header keeps the
  search, region and theme and, below lg, the logo and a scrolling row of the main sections. The page keeps
  `--sidenav-w` (15rem) of room (`globals.css`, `tests/sidenav.test.ts`). Every link is server HTML.
- **Rounder** (`tailwind.config.ts`): md 8, lg 12, xl 16, 2xl 20px; pill buttons and chips; cards rounded-2xl. Nothing
  else about the colours changed, so each site's own `src/content/site.css` still rules its look.
- **The homepage in RiftCompare's order**: a centred hero (logo, "<game> Card Prices", the promise, the search, region
  pills, six trending chips, one stat line), then Today's top deals, sealed, the newest set's chase cards, What people say,
  Guides, the FAQ. Gone from the page: the ad strips under the hero, the AdSense slot, the creators card, the Free tools
  grid, pre-orders, movers and set grids (all one click away in the rail). Every URL, title, description, H1 phrase,
  JSON-LD block and FAQ stayed, so nothing indexed moves.
- **Ads only where a visitor is already looking at a product** (owner: "get rid of the ads under the hero … have them
  show up on every card page and quick view open … a smaller section"): the small eBay + TCGplayer pair
  (`CompactCardAds`) under a card page's price and inside the quick view (`/api/quick` now carries six tiles each); the
  full-size strips, the homepage pair, the set-page pair and the site-wide footer pair are deleted. This overrides the
  2026-10-28 plan to measure the strips on 11-10. `/go` tags keep the `-mini` names, so the Monday digest still adds up.
  Never Amazon in the quick view (Amazon's agreement forbids it in a pop-up); nothing here changes that.
- **A living hero** (`components/HeroSparks.tsx`): drifting motes in the site's own colours that part around the pointer,
  a soft light under it, and a burst of sparks on a click or tap. One canvas, aria-hidden, under the content; it stops
  for reduced motion and while the hero is off screen. Sections ease up as they scroll in (`.sd`, `.sd-stagger`):
  scroll-driven CSS view timelines, transform only, never opacity, so no content is hidden from a crawler or a browser
  without them.
- **The creators bubble** (`components/creators/CreatorsBubble.tsx`): a small pill in the hero's corner into `/creators`
  (RiftCompare's), on sites with creators; the big homepage card is gone.

## A card's headline price is what it sells for; empty tools stay off the rail (2026-11-03)

Engine change from BandaiCompare (its DECISIONS.md, same date): `referenceCents` is TCGplayer's market
price only, never its mid or low (a product nobody has sold has only one seller's ask, and a $28,000
ask topped every "most valuable" list there). A product without a market price has no headline price
and ranks nowhere. Deals come from stores only, never an eBay row. Movers, Rising Cards and the monthly
report leave the rail, phone row, footer and tools hub until a week of history exists (`historyOn()`).
`tests/reference-price.test.ts`.

## Zero-data card pages are noindex; a schema price is good until tomorrow (2026-11-04)

From the owner's Gemini SEO research (the 20-action plan, 2026-11-04): a programmatic page with nothing of its
own is what Google's scaled-content and soft-404 rules describe. A card page with no TCGplayer market price AND
no store or eBay listing now carries `noindex, follow` (`src/lib/indexing.ts` `cardIndexable`, used by
`/card/[slug]`): still reachable and still passing links, out of the index. Cards of an upcoming set are kept
(no price because the set is not out; reveal-week searches are theirs), pack inserts stay out as before, and
nothing is deleted or moved (owner, 2026-11-03: narrow, never delete). The sitemap rule (`sitemapMinCardCents`)
is unchanged and stricter, so no sitemap URL is noindex. The card page's `AggregateOffer` also carries
`priceValidUntil` = tomorrow, as RiftCompare's does: prices refresh with the daily import. The rest of the
plan was already in place (Product + AggregateOffer, set hubs with set value, `/methodology`, tiered sitemaps
with lastmod, "Prices checked" times, llms.txt, no sister footers) or declined: EV calculators (no verified
pull rates, and we never invent a number), graded-tier pages (no graded data), footprint "isolation" (one
engine on purpose), /de and /ja editions (not yet). `tests/seo-audit.test.ts`.

## 2026-11-04 — No Product markup without an offer

Search Console (owner, 4 Nov) showed gundamcompare.com with 20 invalid Product
snippets, all "Either offers, review, or aggregateRating should be specified":
cards with a TCGplayer reference price (so indexed) but no in-stock US store
listing, for which the card page emitted a Product with `offers` undefined.
Google treats that as an error, not a thin item. The card page now renders the
Product block only when at least one in-stock US offer backs it (engine change,
synced from Gundam Compare); a card with only a reference price has no Product
markup rather than an invalid one. `tests/seo-audit.test.ts` pins it.

## 2026-11-04 — Big-store gap: stores from the per-region research

The owner asked for every big store captured with no gaps, on every site. Research per region named 16 readable TCG
hosts not in `src/content/stores.ts`; `scripts/probe-stores.ts` on a runner read each. Added: **Eclipse Games** (AU, `english-yu-gi-oh-tcg`), **Hobbyco** (AU, `yugioh`: 34 products), **Eclipse TCG** (EU, `yu-gi-oh-1`) and **Magic Traders** (EU, `yu-gi-oh`: 24), all sealed. Card Giants (US) was read but its Yu-Gi-Oh! collection is repacks and mystery boxes, never a real product; the other
candidates (Cura Cards, Games Paradise, Gumnut, Jenes, Card Chasers, Capybara, Card Arena, Games Haven, Jeux Kingdom,
OBO, Leisure Games) have no collection for this game. Site content only: nothing in `engine.json` changed.
Not addable, and why (the same list every card site hit): the biggest US and UK names run platforms with no public feed or a robots.txt that forbids reading — BigCommerce (Star City Games, Game Nerdz, Game Goblins, ToyWiz, Magic Madhouse), CrystalCommerce stores whose robots.txt disallows everything (Three Kings Loot, Carta Magica, Gamekeeper, The Connection, Card Titan, Collector's Cache, Nerd Rage, Pastimes), bot walls that answer 403 or a Cloudflare challenge (Chaos Cards, Big Orbit, Wayland, Firestorm, Mighty Ape AU and NZ, Gamesmen, EB Games, MTG Mate, Imaginaire, Le Valet, Bazaar of Magic, FantasyWelt, Keepseven, Nedgame, Poromagia, Dave & Adam's, Pro-Play, Pokémon Center, Red Hobby) and custom storefronts (Card Kingdom, CoolStuffInc, ABUGames, CoreTCG, Ideal808, Noble Knight, Miniature Market, Play-in, Parkage, Agora Hobby, Hobby Master NZ). A bot wall is never worked around. A BigCommerce reader would unlock the most (Star City Games, Miniature Market, Game Nerdz, Magic Madhouse, Game Goblins) and is the next adapter worth writing.

## 2026-11-04 — List your store: stores come to us

The owner stopped cold email outreach ("not really doing anything") and set the aim: be popular enough that stores
ask us, and encourage the ones that do. Every Compare Empire site now has `/list-your-store` (shared
`ListYourStore.tsx` + the `ListStore` form in `ReportForms.tsx`), linked from the footer, `/contact` and the stores
page: what a store gets (free, no contract, never pays to rank), what we need (a readable shop, own currency,
established), and what happens next (checked within a few days, reply through the store's own contact details).
The request is filed as a `suggest-store` report with `issue: "owner"`; RiftCompare's daily reports triage puts
those first and asks for a reply within two days. No email is asked for (the reports branch is public); no pop-up,
no cold email. RiftCompare and OP Compare keep their `/stores/suggest` page (now the owner pitch) and redirect
`/list-your-store` to it.

## 2026-11-05: Amazon's own price on the sealed pages' Amazon row, from the Creators API

The owner's US Associates account was approved today and he asked for Amazon's API prices as price rows on every site.
In this engine (sealed products only; singles keep no Amazon row), two script-side steps and one reader:

- `scripts/amazon-asins.ts` runs in the daily refresh after the import (`refresh-prices.yml`), in every market with its
  own Amazon and our tag (US, UK, CA, AU, DE for the eurozone; Singapore has none). It searches Amazon for each sealed
  product with an in-stock store offer (most stores first, `AMAZON_SEARCH_BUDGET` a market a day) and keeps a result ONLY
  when the store matcher (`lib/import/match.ts` `matchSealed`) lands on that product: the rule that matches the stores
  matches Amazon, a wrong merge being worse than a missing price. ASINs and misses go in `data/amazon/asins-<MARKET>.json`
  (keyed by product id; ASINs may be stored; a miss is retried after 30 days) and ride the data commit;
  `status-<MARKET>.json` says what the last run did, and the ops monitor reads it ("Amazon ASIN finder": informational
  until access, a warning once a market's finder stops running).
- `scripts/fetch-amazon-prices.ts` runs first in every Vercel build, fetches today's prices for those ASINs (`getItems`,
  ten a call, one a second, `AMAZON_BUILD_CALLS` a market, 30 by default) into the git-ignored `data/amazon-live/`, and
  drops a price under 60% or over 160% of the product's in-stock store median. Prices are never committed: Amazon's
  licence lets a price be kept 24 hours and shown with its time.
- `lib/amazon-live.ts` `amazonCells` upgrades the card page's per-market Amazon searches to the item's own tagged page
  and, while under 24 hours old, its price; `PriceTable` shows it in the Amazon row (still third, under eBay and
  TCGplayer) with "as of <time> <market clock>" and the licence's disclaimer, and the browser hides the price after 24
  hours (`AmazonPrice.tsx`) because the page sits in the CDN for hours. The row stays an ad outside the store order:
  never ranked, never the cheapest, never in deals, movers, alerts, history, the feed, metadata or the quick view
  (`tests/amazon-api.test.ts` pins the reader to the card page and the client to the scripts). Both files are traced into
  the functions (`next.config.js`).

One credential serves every store: `AMAZON_CREATORS_AU_CLIENT_ID` / `_CLIENT_SECRET` / `_VERSION` as GitHub secrets and
Vercel Production variables (the same values on every site; `AMAZON_CREATORS_<MARKET>_*` would override for one store).
Access is per marketplace and opens by itself once that store's account has qualifying sales (about 10 in 30 days); a
refused store is skipped, so the feature costs nothing until then and switches on without a code change. Engine code, landed from
Lorcana Compare the same day.

## 2026-11-06 — Sealed only, on the Dex / MTG Compare engine's look

**Owner:** "why is ygocompare using so much of our costs? … I'm not seeing many people buy single Yu-Gi-Oh cards,
so there's actually no point having our website for singles … have YGOcompare just for sealed … we only have a
certain amount of eBay API … we can just cover more of that product … convert it to the same engine as dexcompare
and mtgcompare, and try to get as much of the coverage of the eBay API and affiliates." This reverses the
2026-11-03 entry ("Sealed-first, on this engine"), which kept every card page.

**Why it cost what it did.** Vercel charged this project A$4.59 in the week to 2 November (growth report), above
Gundam (A$2.42) and Lorcana (A$3.43) on the same engine, while singles earned A$1.53 of its A$39.93 (the rest was
eBay sales from the sealed pre-order rows). The code shows where it went:
- ~16,500 product URLs (15,129 single cards), each an ISR page (`revalidate = 86400`) with its own share image.
  Every daily release empties the ISR cache, so every URL a crawler reached was rendered and written again, and
  the share image with it. Gundam has a third as many URLs.
- Every server function shipped all of `data/`: ~49 MB, 7.8 MB of catalogue and 7.6 MB of summary parsed on each
  cold start, 29 MB of per-set price shards. Slow, memory-heavy renders on a long tail nobody bought from.
Vercel's own usage lines were not readable from this session; the share between ISR writes and function time is
inferred from the code, not measured.

**What.**
- **The engine's look** (Gundam Compare's port of 2026-11-04, applied here): the tokens, one-row header with the
  Browse menu, `<dialog>` phone menu, xl sidebar, engine tiles, quick view and price rows, the eBay + TCGplayer
  banner under the hero and the two side rails from 1864px. Product, set, sealed-type, game and pre-order pages are
  `force-dynamic` with a one-day Vercel CDN header (`CDN_PAGES`): no ISR write, nothing prerendered.
- **Out of the card-engine family:** `engine.json` and the drift/sync scripts are gone here, and lorcanacompare,
  cyberpunkcompare and bandaicompare drop `Specifxx/ygocompare` from theirs.
- **No single cards** (`SITE.sealedOnly`): the import keeps sealed products only, dropping cards after every slug
  is settled so no sealed slug changes (and `keepSlugs` keeps yesterday's slug per product id). `lib/data.ts`
  ignores any card still in a data file. Expect `data/public` to shrink from ~49 MB to a few MB on the first import.
- **No 404s.** Every card URL that existed today is frozen in `data/redirects/cards.json` by set; `/card/<slug>`
  still serves sealed products and gives a card slug a permanent redirect (Next's 308, which Google treats as a
  301) to its set's page, or `/sealed` when the set has no sealed product. `/cards`, `/cards/*` (rarity and
  attribute hubs), `/tools/rising`, `/tools/demand`, `/tools/best-basket`, `/tools/trade` and `/list` 301 from
  `next.config.js`, and so do the 17 guides that were card price tables (each set's "most valuable cards" post to
  that set, the rest to `/sealed`). The ops monitor checks that an old card URL still redirects.
- **Set pages** are the set's booster boxes and sealed ("<set> Booster Box & Sealed Prices"); a set with no sealed
  product 301s to `/sealed`. The home page leads with "Yu-Gi-Oh! Booster Box Prices", trending boxes and the newest
  set's sealed. The Price Duel duels sealed products.
- **Sitemap:** strong pages only. Home, the sealed hubs, the sets with sealed product, pre-orders, guides, the
  seasonal pages and each sealed product page that asks to be indexed (no pack inserts). About 1,600 URLs, down from about
  4,100 (2,200 of them cards from $20).
- **eBay:** the whole 2,200-call share of the app shared with Lorcana and Gundam goes to sealed product in all four
  eBay markets (`planSealedCoverage`): ~1,200 products × US, UK, Canada, Australia. US booster boxes, cases and new
  sets every 24 h, the rest every 48 h; other markets 48 h and 72 h; ~2,000 calls a day, the spare re-checking the
  most overdue. Before, 75% went to the US and Canada got none. The budget itself is unchanged.
- **Affiliates** were already wired and are kept: EPN campaign 5339155912 with `ygo-` customids, TCGplayer through
  Impact, Amazon (`ygocompare-20` / `-22` and the Creators API price row on sealed pages).

**Measure:** the growth report's YGO Compare cost and earnings for the weeks of 9 and 16 November against A$4.59
and A$39.93, and Search Console clicks (the 2026-11-25 review).

## 2026-11-06 — Awin: a store that accepts the family pays from the next build, with no step by hand (engine)

**Decision (owner: "check if we are making the most of Awin, and if it's not there, just do it"):** the family's Awin
account (Compare Empire, publisher 3144410) is read each morning by Compare Empire's `scripts/awin-sync.ts`, which
publishes the programmes that accepted us, with their tracked domains, in its public `data/awin/programmes.json`. Each
engine site copies it in its build (`scripts/fetch-awin.ts` → `src/lib/awin-programmes.json`; the committed copy is an
empty list). The `/go` redirect's `tagged()` sends a link to a joined advertiser's own domain through its Awin deep link
(`clickref=<site>-<sub>`); every other store keeps its utm-tagged link. Order and prices never change.

## 2026-11-06 — Side rails on every regular screen, scrolling through ten popular products

**Decision (owner: "I do not see those ads on the left and right side of the screen … it should appear on regular 16:9
screens … 16:10 even … scrollable … up to 10 products … popular products"):** the side rails now show from 1280px wide,
not 1864px. Below 1864px the shell gives up 160px a side for them (`globals.css`: `.max-w-shell` and `xl:max-w-shell` are
`min(1480px, 100vw - 320px)` from 1280px), so a 1280, 1366, 1440, 1536, 1600 or 1680px window gets a 136px rail on each
side, 12px from the window and from the page; from 1864px the shell is its full 1480px and the rails sit just outside it as
before. Each rail runs from under the header to the window's foot and its list scrolls through up to ten tiles, popular
first, instead of as many as the height fitted (at most six). A window too short for one whole tile shows none.

**Still true:** browser-only (mounted after a matchMedia check, nothing in the server HTML, so no SEO change), fixed (CLS
0; the shell rule is CSS, identical in the server HTML, so nothing moves when the rails mount), labelled Ad, rel
sponsored under their own placements, never a store, never Amazon.

**Cost:** the content column is narrower between 1280 and 1864px (960px at 1280). Pages already lay out at those
widths (a 1024px laptop gets the same), so nothing breaks; revisit if clicks per visit fall on laptops.

## 2026-11-06 — Store thumbs up and down, one tally shared by every site

**Decision (owner: "a little mini area where you can rate a shop … thumbs up a store or thumbs down a store … across all
the sites you can now see that these stores are trusted"):** every store row carries two tiny thumbs beside the store's
name (`src/components/StoreVote.tsx`, the same file on every Compare Empire site), with counts once a store has votes and
a green "Trusted" mark from 3 thumbs up and 80% of the votes. RiftCompare keeps the votes and serves one public tally
(`riftcompare.com/api/store-votes`, CDN six hours), keyed by the store's host without "www.", so a shop listed on several
sites shares its thumbs; this site stores nothing and fetches the tally in the browser only (no function, no build
step). One vote per browser per store, a few per network, marketplaces (eBay, Amazon, TCGplayer…) get none. Votes never
order prices, hide a store or decide the cheapest. RiftCompare's DECISIONS.md, 2026-11-06, has the rules; change the
component there first and copy it.

## 2026-11-06 — Buy links open the store's checkout

**Decision (owner: "for all the sites that we can, send them directly to the checkout page, with the item in the
basket"):** an in-stock Shopify store row opens that store's checkout with the priced item in the cart, through
Shopify's cart permalink (`/cart/<variant id>:1`), as RiftCompare (#340) and OP Compare (#99) do. The engine's Shopify
reader has always stored `?variant=<id>` on every offer URL, so no import change is needed: `goHref` adds `c=1` to an
in-stock store row's `/go` link whose URL names a variant, and `/go` → `tagged(…, { checkout: true })` returns the cart
link with the usual referral tags plus `utm_content=checkout`. Awin stores keep their tracked product link (Awin is
asked first); eBay, TCGplayer, Amazon, sold-out rows and non-Shopify stores keep product pages. `buy_click` carries
`link_type`. `lib/checkout-link.ts`, `tests/checkout-link.test.ts`. Revert by
dropping the `c` flag in `goHref`.

## 2026-11-06 — The phone dock: the side rails' ads on screens too narrow for them

Owner: "how can we have those [eBay and TCGplayer side rail ads] on mobile phone … like I have a Z Fold 7 … but also iPhones.
How do we get those ads to show on phones in the best way that doesn't interrupt user experience, but will also potentially
get a couple of clicks."

**Pattern:** below the rails' width, one bar along the foot of the screen (`AdDock.tsx`, fed by the rails' own tiles in
`SideAds.tsx`), the phone buy bar's size and rules: 64px plus the safe area, slides on transform only (CLS 0), never on the
first screen (only after 60% of a screen is scrolled), hidden while any other ad unit, the footer, a dialog, the menu or the
keyboard is in view, never on a page with the buy bar (product pages keep their own units), ✕ for the visit. On a phone it
shows one tile at a time with a View button, eBay and TCGplayer taking turns: the next tile peeks at the edge and swipes, and
each time the dock comes back it shows the next one (nothing animates on its own). From 640px (tablets) both sides at once.
Nothing is in the server HTML and nothing is requested until the visitor scrolls a third of a screen: no SEO change.
Placements `listings-dock` / `tcgplayer-strip-dock` (or the site's equivalents) so its clicks can be read on their own.

**Why this pattern (viewport simulation, Playwright, a local build):** Galaxy Z Fold cover screen (411×960, ~21:9), iPhone SE,
iPhone 16 (393×852), iPhone 16 Pro Max (440×956), iPad (820×1180); home, browse, a guide and a product page, stopping every
half screen. Without the dock an ad unit was in view at 8–20% of stops; with it 75–90% on the home page and guides, ~70% on
browse, 0% on product pages (by design). Never two units in a phone screen because of the dock, layout shift unchanged, the
bar is 7% of the Fold cover screen and 10% of an iPhone SE (Better Ads' "large sticky ad" line is 30%). Rejected: an extra
in-flow strip (the pages already have one unit per screen at most and in-flow ads are what the visitor already scrolls past),
a corner chip that opens a sheet (an overlay, and a tap before any product shows), a ticker under the header (covers the top
of the page, where searchers land). Split halves (eBay | TCGplayer) were tried on phones first: at 375px each title was cut to
a word, so phones show one at a time.

**Measure:** the dock's placements against the strips' in the ~11-10 / ~11-17 checks. If pages per visit drop on phones,
raise DOCK_ARM or drop the dock from that site first.

## 2026-11-06 — A cart list on every site

**Decision (owner: "I really like the cart feature … all of our websites"; built on RiftCompare first, TCGEmpire
#346):** every store price row gets an "Add to cart" button, and the header a cart with its count on every width.
`/cart` (static, noindexed, out of the sitemap) groups the lines by store with ONE "Check out at <store>" button per
store: Shopify's cart permalink `/cart/<variant>:<qty>,…`, which fills that store's cart and opens its checkout. The
list lives in the visitor's browser only (`localStorage` `ce_cart_v1`): no account, no database, no function. The page
re-checks each line's price and stock from the store's own `/products/<handle>.js` in the browser (Shopify serves it
with CORS open) and leaves a sold-out line out. A line is cartable only when the row's own buy link already is a cart
permalink (the single-click checkout links), so Awin and partner stores, and rows whose variant we don't know, stay
"manual" lines on their own tracked links; eBay, Amazon, TCGplayer and Cardmarket are never lines. Shared files, the
same in every site (port fixes by hand): `src/lib/cart-list.ts`, `src/components/cart/*` (`cart-config.ts` is the
one per-site file; styles imported once from the root layout), `tests/cart-list.test.ts`.

## 2026-11-06 — eBay and Amazon rows are full price rows, on top, outlined

**Decision (owner: "eBay prices and Amazon prices should function exactly like a normal store price row. So you can also
add to cart … if it's in stock … it just sits on the very top. And it has a different colored outline"):** the eBay row
is always the first row, with a green outline, and Amazon the second, with an amber one. Both carry everything a store
row has: the stock line, the store thumbs (one tally per eBay / Amazon domain, `ebay.com.au`, `amazon.com`…) and the
cart button. They are "manual" cart lines on their own tagged links (`src/lib/cart-list.ts`), never a Shopify checkout;
an Amazon line's price is dropped from the visitor's list after 24 hours (Amazon's licence), and the cart then says to
see today's price on Amazon. With no Amazon price the row reads "Also check on Amazon", a tagged link. Unchanged: neither
is counted as a store, "Best price", a deal, an alert price or the reference price; TCGplayer and Cardmarket stay
references (no thumbs, no cart line); no Amazon link in a pop-up.
Here the eBay and Amazon buttons also become the store rows' own `btn-soft` (they had `btn-ad` / `btn-amazon` since the 2026-11-04 port): the outline is what sets them apart now. `pinnedOrder` puts eBay first always (TCGplayer follows).

## 2026-11-06: Loose singles out of "sealed", pre-order set offers, eBay floor 60%

Underperformer review (owner: "fix everything"). TCGplayer files 122 single cards under sealed (oversized cards, field
centre tokens, promo Secret Rares); a product with a rarity or card stats is a single, so `sealedOnlyCatalog` drops it
and its old URL 301s to its set (or `/sealed`). A store listing in stock for a set still on pre-order is labelled
pre-order (tiles and rows), so a launch box never reads "in stock" before release. The eBay search floor rises from 50%
to 60% of the reference: a $29.99 listing on a $57.90 box was a wrong product. Tiles label the headline as "market".
The rarity guide lost its empty "Prices by rarity" heading (a sealed-only leftover), and `/cards/rarity/*` now 301s to it.

## 2026-11-06: The quick view carries the tagged Amazon link (owner)

Since 2026-11-02 the quick view showed no Amazon link (or, on KaeYoung and ScentCompare, an "Amazon" row that opened our
own product page), read as Amazon's ban on links in pop-ups. The owner noticed the quick view sends nobody to Amazon and
chose (2026-11-06) to put the product page's own tagged Amazon link there. Amazon's Participation Requirements, item
(o): "You will not post or serve any Special Links … within any pop-up or pop-under windows, transitional page ads, or
layer ads, except for pop-up windows in conjunction with your Site promoting Products closely associated with the
materials on your Site." A quick view the visitor opens for one product, showing that same product, fits the exception;
the owner accepted the remaining risk. The quick view shows the link only (the item's own page where the ASIN is known,
else the tagged search), never Amazon's price: that stays on the product page under the 24-hour licence. Uninvited
overlays (a phone ad dock, a corner card, an exit pop-up) still never carry Amazon, and an Amazon page is never framed
(item (n)).

## 2026-11-07 — Black Friday strip and Cyber Monday page (owner: "capture all of the Black Friday SEO")

Black Friday is 27 November 2026 and Cyber Monday 30 November. Three additions, every Compare site:

- **`/cyber-monday`**, its own URL for its own searches ("<game> cyber monday deals"), kept every year like
  `/black-friday`, listing the same real store deals. In the sitemap and footer; the two pages link each other.
- **The holiday strip**: one line under the header on every page, in the server HTML, linking `/black-friday`
  from 1 November to the Saturday after it, then `/cyber-monday` to the day after Cyber Monday, then nothing
  (`saleStrip` in `lib/black-friday.ts`, tested). The same link leads the nav while it shows. A link, never a
  pop-up (pop-up policy: no uninvited interruption on a visit's first page), never a countdown or "ends soon".
- **More on both pages, nothing taken away**: the URL, title and h1 of `/black-friday` are unchanged; below the
  existing rows come each other market's own store deals (its currency, never converted) and four visible
  questions (the dates, whether stores have sales, shipping, how often it updates). No FAQ rich-result markup:
  Google shows those only for government and health sites since 2023, so the text is what ranks.

## 2026-11-07: A case listing must be the case (from the card engine)

An eBay seller wrote to MTG Compare that a 120-pack sleeved case was a six-box case's "best price, 26% below the median"
(mtgcompare #94). The engine audit found the same shape here: an acrylic case for one box, a "Sealed W/ Case" box, a
"Half Case (6 boxes)", an "Open case of 4 … Illumineers Trove" and 48 sleeved packs, each filed as a Booster Box Case.
`wrongCase` (`lib/import/ebay.ts`, inside `listingMatches`, so the next import also purges stored offers without a call)
refuses on any case product: an item in or with a case, a half or open case, sleeved packs unless the product is
sleeved, a case of another product type, and, where `SITE.caseUnits` / `SITE.casePacks` give the count (Lorcana 4 boxes
/ 96 packs, Gundam and Yu-Gi-Oh! 12 boxes: the counts sellers and stores state), a
title whose stated counts are none of it. Only stated counts are read; no count configured means no opinion. The
eBay price never sets a deal or the headline price here (TCGplayer market does), so no outlier guard was needed.

## Black Friday indexing push (2026-11-07)

Owner: get every Black Friday page indexed. The sale pages (`/black-friday`, `/cyber-monday` and the other seasonal
pages) were in the sitemap but not in the daily IndexNow list, which sends only the hubs it names: they are named now.
A blog post, `<game>-black-friday-2026`, lists the newest sets' sealed product with today's prices (`{{sealed:SETID}}`
tokens, so the "prices to beat" stay live) and five checks for a real deal, and links to both pages; the pages link
back to every post whose title or keywords say Black Friday or Cyber Monday (`postsAbout`). No FAQ schema, no
countdown, no "was" price.

## 2026-11-08 — One Our sites page instead of footer cross-links

From the owner's Search Console audit of DexCompare: its only links from other sites were ~9,000 site-wide footer
links from our own sites, all to its home page, with the brand or a keyword as the anchor. They pass no authority,
and a network of same-owner sites linking each other from every page is the pattern Google's link-spam policy warns
about. CamCompare indexes well with more of them, so they are not what holds a site back, but they buy nothing.
DexCompare's footer went first (CompareEmpire #153); every other site now does the same: the footer links one
internal page, `/our-sites`, and that page links each other family site once, by its plain name, from
`FAMILY_SITES` (`lib/family-network.ts`, unchanged; `footerSisters` stays for the shared test). Every other footer
link, page URL and title is unchanged. Cross-traffic still comes from the price blocks on the deals and pre-order pages.

## 2026-11-08 — Christmas is one quiet line, not a costume

Owner: "some of the christmas themes on our websites are a bit too much - the theme must match the domain". The
2026-11-01 Christmas look (falling snow, a strand of lights, trees, presents, candy canes, stockings, a Santa hat on the
logo, candy-cane stripes and seasonal palette swaps) is gone, with its art in `public/xmas/`. The season keeps at most ONE
touch, drawn in the site's own colours: the gifts line in the hero (`ChristmasGifts`, `.xmas-pill`), a plain pill that inherits the hero's text colour, with no gift icon or red glow. (wording still `SITE.christmas`). It still starts and ends by itself (`lib/season.ts`, 1 November to
Boxing Day), and the tests pin that nothing else comes back. Black Friday and Cyber Monday (strip, pages, nav) are
unchanged. The same rule went to every sister site: the site's own identity first.
## 2026-11-08 — Full-width shell and a featured-product hero

Owner, 2026-11-08: KaeYoung and ScentCompare's hero ("feature some products on the hero … uses the full screen") on the Dex / MTG
engine family (DexCompare #154, MTG Compare #104), ported by hand:

- From 1280px the shell runs from the eBay rail's edge to the TCGplayer rail's (`.max-w-shell` margins of 136px, not a max-width:
  `100vw` counts a desktop scrollbar), the sidebar flush against the left rail; `.page` 1440px.
- The homepage hero is two columns from lg: the same eyebrow, h1, paragraph, search, region row and trending chips on the left (now
  left-aligned), the stat line as chips, and two featured booster boxes on the right (`components/home/HeroCards.tsx`: the sealed
  shelf's first two with a photo, `featuredSealed`, with TCGplayer's market price and the in-stock store count, as on the tiles).
  Nothing in the cards is a heading; URLs, titles and metadata unchanged. Seasonal decor unchanged.

## 2026-11-08 — The card share image is text only (Vercel cost cap)

Vercel's billing (owner's team, 2026-11-08) showed ISR writes as the biggest line on the team after Compare Empire's
CPU, and Observability put ~90% of this engine family's ISR write units on one route: `/card/[slug]/opengraph-image`.
Each image carried the card's art and came out at ~580 KB, and Vercel bills every cached copy by the 8 KB write unit
(~72 units per image, written again each day and after every deploy as crawlers fetch `og:image`). The image keeps
everything that makes it worth sharing (name, set and number, the US price gap or TCGplayer market) and drops the art:
flat colour and text render at ~49 KB, about a twelfth. `tests/share.test.ts` fails if `<img>` or `imageAt` comes back.
The page itself still shows the art; only the link thumbnail lost it.

## 2026-11-08 — The alert form asks, unticked, for a weekly price drops email

Owner, on the 2026-11-08 competitor scan: "implement all of this" (gap #5, a weekly email of the biggest price drops).
The shared `PriceAlertForm.tsx` (byte-identical on every sister site) gains one UNTICKED box, "Also email me this site's
biggest price drops once a week", sent as `weekly` beside the alert. RiftCompare's alert service does the rest
(TCGEmpire DECISIONS.md, "A weekly biggest-drops email for the sister sites"): it rides the same double opt-in, builds
one edition a week from this site's own `/alert-feed.json`, links only to this site's pages (no eBay or Amazon), and
every email has a one-click stop. This site still stores no address and holds no mail key, and nothing new pops up.

## 2026-11-08 — Store badges, free price data and My collection (competitor scan)

The owner approved the competitor scan's ideas (Collectr and PriceCharting keep people coming back with "what is my
collection worth"; Scryfall grew on free data credited with a link; price sites earn links from the stores they list).
- **Store badge.** `/list-your-store` ends with "Already listed? Add our badge": the site's plain-HTML "prices compared on"
  badge (an ordinary link: no iframe, script, image or tracking) and its code to copy. `ListYourStore.tsx` takes it as the
  optional `badge` prop and stays the same file in every site. Stores see it when they come to us; nobody is emailed about it
  (cold outreach stays stopped).
- **Free price data.** `/prices.json` (`lib/price-api.ts`): every product's cheapest in-stock price per market, in that
  market's currency, with an absolute link to its comparison; never eBay, never converted. Free for any use with a visible
  link back (the licence and an attribution snippet are in the file and on the widgets page). Built from the same numbers as
  `/alert-feed.json` and served as a static file: no function runs for it and only a release changes it. Open CORS.
- **My collection.** "I own this" on the card page (`VaultOwn`, in the visitor's market like the rest of the page) (`components/vault`, `lib/vault.ts`, the same files in every site)
  keeps a list in the browser only (`ce_vault_v1`: no account, no database, nothing sent to us). `/collection` (a static,
  noindex shell) values it from `/prices.json` in the market each item was added in, one total per market (never converted):
  worth today, the change since the items were added, the change since the last look (one total per market and day in
  `ce_vault_days_v1`), and a share line with the real totals (`utm_medium=collection`). Values are the price to buy it again
  at a store, and the page says so. Linked from the footer.
## 2026-11-08 — "Is this a good price?": paste a store link

Owner, 2026-11-08 (the competitor scan's gap #7, "implement all of this"), ported from MTG Compare (mtgcompare #106): a visitor
pastes a store's product link at `/tools/is-this-a-good-price` (`components/LinkChecker.tsx`, `lib/link-check.ts`)
and sees whether it is a good price.

- The browser asks `/api/check/<host>` for that store's listings: our own stored rows, only for a store in `SITE.stores`
  (anything else is a 404), force-dynamic and kept by the CDN for a day, never ISR, built from the committed price files (every shard read once per instance). It never fetches the pasted
  page. Each listed product comes with its cheapest and median in-stock STORE price in the store's market (eBay and TCGplayer never count).
- A link is keyed by host and path (`linkPath`: a Shopify product is `/products/<handle>` from any collection or market prefix); two
  products under one path need the `?variant=` to tell them apart, or there is no answer (a wrong product is worse than none).
- Verdict (`priceVerdict`): within 1% of the cheapest in stock is the best price; under the median fair; within 3% of it typical;
  above it "you can pay less", with the saving. A listing that was out of stock says so instead. eBay, Amazon, marketplaces, stores
  we don't read and unmatched pages fall back to a search from the link's words, each linking to its price table.
- Pasting a link into the header search opens the checker (`#link=` in the fragment, so the CDN keeps one copy of the page).


## 2026-11-08 — Foreign products found by their handle, and a title naming another set's code

Gundam Compare had a store's Japanese Stardust Trails box ("...-gd06-jpn", S$70) on the English box's page:
`isForeign` knew "jp" and "japanese" but not "JPN", and many stores say the language only in the URL handle. The same
matcher runs here, so the fix is ported (Gundam Compare DECISIONS.md, 2026-11-08).

- `isForeign` (`lib/import/match.ts`) also refuses JPN, JAP, CHN, KOR, Thai, Indonesian, "(kr)" and Japanese, Chinese or
  Korean script; the importer checks the listing's URL handle for the same words (`handleOf`). The handle is read for the
  language only, never the set: stores duplicate a listing and retitle it, leaving the old set in the handle.
- A sealed title that names a release code (letters + two digits the catalogue knows: "[GD05]", "FB-10", "MP23") must
  name the product's own set, or a set whose name the product's set carries. A store's typo loses a row rather than a
  guess putting it on the wrong page.
- ygocompare: replaying the stored rows, 9 German ("deutsch" handle) sealed rows from Card Cosmos stop matching, and 7 single cards that sat on a pack's page ("...-mp23-...", "...-op01-en004-...").


## 2026-11-09 — TokyoToys (UK) added for Yu-Gi-Oh!

TokyoToys (tokyotoys.com, Shopify, GBP, UK mainland delivery only; vetted for Cyberpunk Compare, see its DECISIONS.md) lists Yu-Gi-Oh! sealed through its `yu-gi-oh-tcg` collection (read by hand 2026-11-09, items in stock with tracked inventory). UK market only. Its titles carry a "RELEASE <date>:" prefix. Dex and MTG Compare already list it; One Piece, Pokemon (English) and Union Arena / Digimon / Fusion World sealed are not stocked, so those sites do not.


## 2026-11-09 — Navigation by product type and set (owner: "navigation is very, very important")

A Yu-Gi-Oh! sealed buyer picks a product type (booster box, structure deck, tin, collection) and then a set; the header listed Sealed
and Sets as plain links, so the type hubs and the newest sets were two clicks away and the sidebar was one flat "Prices" list.
Audit: `/mnt/project-files/nav-audit/ygo.json`.

- `lib/shop-nav.ts` builds one list from the hubs that already exist (`sealedHubs`, `sealedSets`): the header's Sealed (by product
  type) and Sets (newest first, then every set) dropdowns (`HeaderNav.tsx`, CSS-only, plain links in the server HTML, the panel sized to
  its columns), the sidebar's "Sealed by type" and "Sets" groups first, and the phone menu. "Browse" became "More".
- The header search says what it finds ("Search sealed or set code…") and now finds a product by its set code (`api/search`).
- Not done: edition (1st / Unlimited) and era hubs; the edition is only in the product name, not a field, and a hub from a name
  regex would be a guess. Existing URLs, titles, canonicals and JSON-LD unchanged; the footer's single /our-sites link stays.

## 2026-11-09: one mega-menu component for the header dropdowns (owner)

- Bill: navigation like the best modern sites, one shared pattern across the Dex / MTG engine family. `components/NavMenu.tsx` (the same
  file in DexCompare, MTG, Gundam, Wargame, YGO and Bandai; keep them identical) wraps every header dropdown: the panel is always in the
  server's HTML as plain links (closed it is only `invisible`, so crawlers read it and keyboards skip it), it opens on hover with intent
  (90 ms in, 200 ms grace out), a chevron button toggles it for touch and click, focus into the item opens it, ArrowDown/Up/Home/End move
  through the links, Escape closes and returns focus, focus leaving or a press outside closes it, one menu open at a time, a navigation
  closes it (`aria-expanded`, `aria-controls`, `aria-haspopup`). The label stays a real link.
- New: a Deals dropdown (the "Deals & stock" group, with Pre-orders and Stores, which left the row); "More" keeps the tools and guides and
  the xl-only "Guides" link went into it. Sealed and Sets dropdowns existed. The market picker already switches in place.
- No URL, title, canonical, h1 or JSON-LD changed; no read or page added; the phone menu and the sidebar are unchanged.
- Not done: removing the side panel (the menus do not yet cover its deep groups, and it carries the current-section state for the
  deep levels; revisit once the menus have been in use), a phone bottom sheet (the `<dialog>` menu stays), and the side rails and
  footer links, which are the owner's own decisions. Deals is a hover menu: nothing is added to the deploy cadence.

## 2026-11-10: eBay calls follow the visitors: every US product daily, Canada 400, the UK 300, Australia 277

**Why.** The 30 days to 11 Nov (`/mnt/project-files/strategy/ebay-site-region-split-2026-11-10.html`): the US had 77% of
visitors (681) and every eBay dollar (A$44.24) on 765 calls a day; Canada 58 visitors on 481, the UK 25 on 396, Australia
26 on 558 with no sale. Bill approved the recommended split the same day ("whatever you recommend"). The site's 2,200 a day
and the keyset are unchanged.

**What.** `planSealedCoverage`: every US sealed product (about 1,223) is searched every day, first and with no ceiling (a
pair checked 12 hours or more ago counts, so a run a little early still covers it). The other markets then take due pairs
up to a daily ceiling each (`SEALED_MARKET_CEILING`: Canada 400, UK 300, Australia 277 of a full 2,200, scaled to a
smaller budget), boxes and new sets every 48 h and the rest 72 h; market weights US 1, Canada 0.6, UK 0.5, Australia 0.3.
Calls a ceiling leaves unspent go to the most overdue remaining pairs. A dry run on today's catalogue and state plans US
1,223 / CA 400 / UK 300 / AU 277 for the next two runs. `tests/ebay-plan.test.ts` pins it; the methodology copy says
"every product daily in the US". Recheck about 24 Nov against the 30 days to 11 Nov.

## 2026-11-12: the front page features the pricier items (owner)

**Ask.** Bill: promote the more expensive items, so a sale earns more commission; the cheap ones should not be advertised on the
front page. For the TCG sites that means sealed: booster boxes and the like.

**What.** `SITE.featureMinCents` = 4000 ($40). The home page's sealed shelf (`featuredSealed`), today's top deals (`deals()`: the
reference price must clear it, not just 500), the pre-order boxes in the shelf's tabs and the newest set's grid carry only products at or
above it (TCGplayer market; `worthFeaturing` in `lib/data.ts`). Cheaper products keep their page, their set and hub listings, search,
alerts and the sitemap; only the front page's selection changed, so URLs, titles, metadata and JSON-LD structure are as before.
Starter Deck Display joins the shelf's fill types. A pre-order with no TCGplayer price yet is still shown. Store rows within a
product are still sorted by price, never by commission; the reference price is TCGplayer's market and eBay is never a deal.


**Why this floor.** From the day's data (TCGplayer market, sealed): booster boxes p25 $50.51, median $80.79; booster packs median $7.08; structure decks median $38.15; tins median $39.99. The floor keeps the real
earners and drops packs and the cheapest decks. Revisit with the click-to-sale numbers (which placements earn) in the Monday report.


## 2026-11-12: a tasteful festive layer on the Christmas season (owner)

Bill asked on 2026-11-08 to strip the over-the-top Christmas theme ("the theme must match the domain"), and on 2026-11-12 asked for it to be
more festive again. We chose tasteful accents, not a return of the costume.

**What.** Behind the existing season window (`data-season="christmas"`, 1 November to Boxing Day, the visitor's date, `?season=` preview) and
ONE off switch, `CHRISTMAS_FESTIVE_LAYER` in `src/lib/season.ts` (it sets `data-festive` on `<html>` and gates the card's markup): (1) a one-line
"Christmas gift guide" card on the home page, an inline SVG gift in `currentColor`, linking the existing `/blog/yu-gi-oh-gift-guide` post, in the site's own surface and
text colours with a cranberry 3px left border and a pine icon; it is a link in the server HTML, not a heading, so every title, meta, h1 and h2 is
unchanged; (2) a 3px two-tone hairline (cranberry then pine, flat, no stripes) at the very top of the page, drawn by `body::before` from CSS
alone, with lighter tones in the dark theme for contrast; (3) the same two colour tokens (`--xmas-red`, `--xmas-pine`) on the gifts pill's border and the
Black Friday strip's bottom border, no new elements. The blog gift guide is the one existing gift page.

**Still gone, and pinned.** No snow, lights, Santa hats, candy-cane stripes, palette swap, sparkles, animation, image, webfont, extra request,
pop-up, floating rail or layout shift; no client JavaScript. The test pins both the new pieces and the absence of `@keyframes`, snow, flake,
canvas and repeating gradients in the Christmas CSS.

**Taking it off.** Set `CHRISTMAS_FESTIVE_LAYER = false` after New Year, or let the window end on 26 December: the card, the hairline and the
accents all go together. Without the layer the quiet gifts pill of 8 November (linking /sealed) is what remains.


## 2026-11-12: the festive layer is released urgently (owner)

The owner said to deploy the festive layer urgently once every site had it, so this merge carries `[deploy] [urgent]` in its subject: one production build now, instead of waiting for the next release. No other change.

## 2026-11-12 — Amazon strip beside eBay and TCGplayer on the product page (owner)

The owner said most of his own spending is on Amazon and asked for Amazon links as visible as eBay's and TCGplayer's. The pinned Amazon price-table
row already existed (2026-11-06); what eBay and TCGplayer had and Amazon lacked was the photo strip. `CompactCardAds` now draws a third row, "amazon",
on the product page only, for US visitors, from products with a real ASIN in `data/amazon/asins-US.json` (`cardAds({ amazon: true })`), at least three
tiles. Tiles carry NO price ("View"): Amazon's licence. The link is the item's own tagged `/dp/` page, rel sponsored, through /go (`source=amazon`),
with the disclosure and Associate line. Plain text word, no Amazon logo or orange. Never in the quick view or the rails or the dock (the quick view
and rails call `cardAds` without the flag; `tests/card-ads.test.ts` pins it). Markets other than the US have no ASIN data yet, so they see no strip.

**Right side rail (owner, 2026-11-12: "just go ahead").** On a wide screen the right-hand rail shows the same Amazon tiles (no price, "View", tagged
/dp/ links, "Ad · Amazon Associate", plain "amazon" word) to US visitors when at least two products have an ASIN; every other visitor, and a site
without ASINs, keeps the TCGplayer rail. The phone dock never carries Amazon. The "All" link goes to the first tile's own page, never a category search.

## 2026-11-12 — Amazon only where Amazon carries the product (owner)

The owner: no Amazon links where Amazon doesn't sell the item (RiftCompare first). `amazonCarries` (lib/amazon-live.ts) gates the sealed page's and the quick
view's Amazon row: a real amazon.com ASIN, or else a mainstream retail type (booster box and pack, sleeved pack, starter, structure or other deck, tin,
collection, Illumineer's Trove). Cases, prerelease kits, displays, inserts and "Other" get no Amazon row.

## 2026-11-12 — A calmer price table (owner left the design to us; DexCompare's rule)

The owner found DexCompare's quick view too busy ("all the colored rows … a bit much") and left the redesign to us (CompareEmpire #196). The same
rows are here, so the same rule: a price table has ONE filled button, the best price's. The pinned rows' outlines of 2026-11-06 and 11-07 (eBay
green, Amazon amber, Fetch violet, the cheapest sky blue) are gone (`PIN_OUTLINE` keeps its keys and draws nothing); eBay's blue, Amazon's and
Fetch's filled buttons are the other rows' neutral button; the quick view's "See price history and details" is a ghost button. The cheapest row
keeps its tint and "Best price" badge. Rows keep their order, "Ad" / "Marketplace" tags and links; no URL, title, heading or text changed.
Measure outbound clicks per placement on 19 Nov against the week before.

## 2026-11-12: Only eBay and TCGplayer are paid placements

Owner: "we just want eBay and TCGplayer as the paid links at the top. That is why our revenue is declining." The Amazon row now
draws only with a real Creators API price (no "Also check on Amazon" search row), the Amazon side rail and photo strip added earlier
today are removed (the right rail is TCGplayer again), Fetch TCG (AU) is an ordinary store row ranked by price (no pin, no Ad or
Marketplace tag), and the pinned eBay and TCGplayer buttons are filled so they stand out. `tests/paid-rows.test.ts` pins it.

## 2026-11-13: urgent release

Owner asked for every site to be released now: the unpriced-Amazon fix, Fetch as an ordinary store row and the blue TCGplayer button had been merged without a deploy marker. One build, via this commit's subject.

## 2026-11-13: the side rails are off; the ads are the strips inside the page

Owner: visitors looked down, the side banners "don't look as good" and spoil the site's look, so the eBay and TCGplayer (or Amazon) rails come off every site and the page column gets the side space back. The ads that stay are the horizontal strips inside the page and, on small screens, the phone dock (after a scroll, never on a product page). The rail code stays behind one constant (`SIDE_RAILS = false` in the rail component, or `SITE.sideRails` on MotorCompare): nothing is rendered or fetched while it is false, and the CSS that narrowed the column for them is gone. Measured before the change (Vercel Web Analytics, unique visitors, Oct 30 to Nov 5 against Nov 6 to Nov 12, the rails having shipped Nov 6): DexCompare 4,200 to 4,972 with bounce 57% to 43%; RiftCompare 3,399 to 3,179 (its fall was Oct 29, a week before the rails); OP Compare 1,123 to 1,016. The measure to watch next is clicks per placement for the strips, not visitors. Never re-add rails, a floating banner or a gutter ad without the owner.
## 2026-11-13: Bots get the shop link untagged

A crawler that ignores robots.txt opened about 10,000 TCGplayer buy links on YGO, Gundam, Lorcana and Cyberpunk
Compare over 11–13 Nov (one or two per product, 8,183 sub-IDs, no sales), tripling the clicks Impact counted for us.
That costs no commission, but a flood of clicks that never buy is what gets a partner account reviewed. `/go` now
asks `looksLikeBot` (`src/lib/bot-click.ts`): no User-Agent, a crawler's or script's User-Agent, no Accept-Language
or no Sec-Fetch-Mode (every current browser sends it on a navigation) means a bot. A bot is still redirected to the
shop, just without our tracking, so no person is ever refused a link; at worst a very old browser goes untagged.
The rules may only mark more obvious bots, each with a test in `tests/bot-click.test.ts`.

## 2026-11-13: one native horizontal ad block inside the page, in place of the side rails and the strips

Owner: with the side rails off, replace them with ONE bigger, subtler horizontal ad that sits in the page content and looks like the
site: the site's own card, border and surface tokens, a small muted "Ad" pill, no loud colours, nothing floating, no side space.
`components/InlineAds.tsx` (picked by `lib/inline-ads.ts`) is that block: a full-column-width card of up to six larger tiles (172px,
a 154px photo, two title lines, the price and a plain "eBay · Buy It Now" or "TCGplayer · market" line), eBay and TCGplayer taking
turns with eBay first, scrolling sideways on a narrow column (`.scroller`). Only eBay and TCGplayer, never Amazon (owner, 2026-11-12);
the kit pages (`SITE.kits`) show their eBay kit tiles alone. Every link is rel sponsored through /go under `<page>-inline-ebay`,
`<page>-inline-tcg` and their `-all` twins (page: home, card, set, sealed, sealed-type, kit, kits, kit-grade), so the Monday digest
counts it apart from the old `home-ebay`, `side-ebay`, `-mini` and `kit-ebay-kit-strip` tags.

It is browser-only like the rails were: the server sends an empty box of the block's exact height (`INLINE_H`) and the tiles draw
after hydration, only when `inlineReady` finds three, judged on the baseline market so the server and the browser agree: no SEO
change and CLS 0. ONE per page, never in the hero or above a first product list, below the price table on card and kit pages, after
the grid on lists, never beside a buy button and never in the quick view (which keeps its small pair). The home banner (`LandingAds`),
the card page's small pair, the kit page's two strips and the rail code (`SideAds`: both rails, `rail-scroll`) are deleted; the phone
dock stays (`DockAds.tsx`, the rails' old file trimmed to it) and yields to the block. `tests/inline-ads.test.ts`,
`tests/card-ads.test.ts` and `tests/shell.test.ts` pin it. Measure clicks per `*-inline-*` placement against the old strips on 20 Nov.

## 2026-11-13: the minimal look: one navigation, a hero of words and a search, products first

Owner: "we're making things too complicated … get rid of the products on the hero … cull the features that we show and all the
display aesthetics … minimalistic, dynamic, aesthetic and smooth". A review of every page type, then this. DexCompare and MTG Compare
take the same look the same day; YGO Compare runs their engine's look on its own data, so it is that look ported by hand.

- **One navigation.** The desktop sidebar (`SideNav.tsx`, deleted) repeated the header's menus down the left of every page. The header
  is the site's only navigation: one row in the page's column with Sealed, Sets, Deals and More (each opens its menu), the search with
  the row's spare room, theme, market and cart. The row had six entries; the seasonal "Black Friday" entry and eBay's sponsored link
  are out of it. The sale still leads the Deals menu in its season and keeps its strip; the release on pre-order is a link in the
  Deals menu (`lib/preorder-nav.ts`, the `preorder` option of `navGroups`), and its strip shows only when no sale strip does, so a
  page has one line under the header, not two. The phone menu (a `<dialog>` in the server HTML at every width) is handed every group
  the sidebar listed, so no page lost a site link: compared link by link on 17 pages, the only links a page other than the home page
  lost are the two eBay ad links. The page is one centred column, 1200px (`max-w-page`; it was 1440px beside the sidebar).
- **The hero has no product** (`components/home/Hero.tsx`): the same h1, one line under it, the search, the market row, six ways in
  (the first three product types that exist, today booster boxes, tins and structure decks; then pre-orders, deals and all sets) and
  one line of facts, centred, on a ground of two CSS gradients and a dot grid. One pill at most: the Christmas gift guide in its
  season (the owner's 2026-11-12 line, reshaped by rules outside the shared `xmas-common` block), else the set on pre-order.
  `HeroCards` (two featured boxes), `HeroSparks` (a canvas), `CreatorsBubble`, the eyebrows, the six "Trending" chips and the stat
  chips are deleted, not hidden. The hero itself never clips, so the search's suggestions open over the tiles and the shelf under it.
- **The home page under the hero is five blocks.** ONE shelf, "Yu-Gi-Oh! booster boxes and sealed", whose lists sit behind tabs
  (`components/Tabs.tsx`: every panel is rendered by the server and stays in the HTML, a tab only chooses which shows, no request):
  eight booster boxes at their cheapest store in the visitor's market (`sealedHero()`; seven before, in a swipeable row), the sets on
  pre-order in one list, today's eight best deals (one per product), and the newest released set only when it adds a product the
  shelf does not already show. Then the latest four sets, the page's one ad block, the guides as a closed `<details>` with their
  `<h2>` in the summary (`components/Fold.tsx`), and the questions as rows. Where the rest went: "Today's top deals" and the newest
  set's own section are lists of the shelf (their headings are the lists' visually hidden `<h3>`s; "Latest sets" is the one new
  `<h2>`); the six trending boxes are on `/sealed/booster-box` with every other box; the sale links under the deals are the strip and
  the Deals menu; the reviews row is the footer's "Rate us"; the creators bubble's page stays in the More menu and the footer. The ad
  block moved from above the shelf to under the shelf and the sets.
- **List pages show products first.** `/sealed`: the h1, one line, the product types as chips with their counts, then each type's
  products. A type page: the other types are chips under the headline (they were a block under 330 products). A set page: the
  headline, the buy box (unchanged), the grid, the ad block, then its guides folded. Grids are five across on a desktop, the home
  shelf four.
- **The product card** (`ProductTile.tsx`, `globals.css` `.pc-*`) is the photo on its plate, the name, one stock line ("In stock · 12
  stores", "Pre-order", "Sold out") and the price ("market": TCGplayer's), with one badge on the photo only for a real saving. No
  frame, set line, stock pill, 7-day figure or "Compare N prices" cue. It is still one link with the same `data-qv*`, so the quick
  view and its buy rows are untouched; the home shelf's cards open it too now (they were plain links to the product page). The shelf
  sends only what a card draws: each product carried its store link, its eBay listing and a store count that nothing read.
- **The product page is untouched** apart from the missing sidebar: the price table first, the same pinned rows, no ad unit added or
  removed.
- **Ads: the trade-off.** A page keeps ONE in-page block under what the visitor came for (`InlineAds`, unchanged), the phone dock and
  the product page's and quick view's pinned rows. eBay's link in the header and the "Search eBay" button in the phone menu are gone
  (the `header-ebay` and `menu-ebay` placements): no ad in the navigation. The revenue check of 13 November: side rails and banners
  had 163 eBay clicks and no sale last week; the earnings come from the product page's and the quick view's rows, which did not
  change. Clicks per placement are rechecked on 19 November; if the navigation's links earned, one comes back.
- **Motion is CSS only** (`globals.css`, "Motion."): the hero's parts rise in turn on load (the h1 moves 10px but is never
  transparent, so the largest paint is not held back), sections rise as they scroll in only where the browser ties it to the scroll
  position (`animation-timeline: view()`, behind `@supports`), a changed tab and an opened fold fade in, cards lift on hover, the
  header takes its line once the page moves under it (`animation-timeline: scroll()`). Transforms and opacity only, nothing in the
  layout moves, all of it inside `prefers-reduced-motion: no-preference`. No animation library, no scroll listener, no observer. It
  replaces the 2026-11-03 scroll motion (`.sd`, transform only): a section may now fade as it rises, but only inside that
  `@supports`, so a browser or a crawler without scroll timelines only ever sees the finished page.
- **Found on the way, and fixed: most pages were wider than a phone's screen.** A visually hidden label inside a sideways scroller
  that is not positioned is not clipped by it and counts toward the page's width. On a 390px phone the layout was 962px wide on the
  home page, `/sealed`, a type page, a set page and a product page (every page that carries the ad block), so the page slid
  sideways. `:where(.scroller, .overflow-x-auto, .overflow-x-scroll) { position: relative }` in `globals.css`. `/movers` and
  `/price-report` were 674px wide for another reason: a grid's own column is as wide as its longest unbroken product name until it
  is told it may shrink (`grid-cols-1`). 40 pages measured after: 390px on every one, at load and after scrolling to the end.
- **Measured, old build against new, same data** (US market; phone 390px, desktop 1440px; stand-in photos, because the stores' image
  hosts are blocked where it was measured): the home page's height 6,125px → 5,137px on a phone and 4,324px → 3,933px on a desktop;
  its HTML 205,540 → 190,336 bytes, its links 147 → 111, its first-load JS 125 → 121 kB. Its elements went 816 → 840: the deals are
  photo cards now and the sets row is new, and this home page was never the long one. `/sealed`: 966,694 → 583,409 bytes, 3,675 →
  2,769 elements. The booster box page: 1,413,429 → 839,458 bytes, 5,253 → 3,920 elements; five cards across a 1200px column make
  it a little taller on a desktop (24,210px → 25,619px) and shorter on a phone (68,067px → 53,491px). A set page 544 → 433
  elements, the product page 722 → 616. Every other page is about 12 kB lighter (the sidebar).
- `tests/minimal-look.test.ts` pins the navigation, the hero (no product, no photo, no script), the shelf (every panel in the HTML),
  the fold, the home page's order and outline, one h1, valid JSON-LD, the card, the list pages' order, the motion rules and both
  width fixes; `tests/shell.test.ts` and `tests/shop-nav.test.ts` are updated for the new markup. No test was deleted or skipped.

URLs, titles, metadata, h1s and JSON-LD are unchanged (17 pages compared field by field against the build before). Released with
`[deploy] [urgent]` in the merge subject, as the owner asked.

## 2026-11-13: three older faults the checks found after the minimal look: the buy button, "+ I own this" and the "More" link

After the minimal look went out, every page type was run through Lighthouse's accessibility and SEO checks, the build before
against the build after. The redesign lost nothing: the home and list pages went 97 → 100 for accessibility and the product page
stayed at 94. What was left (the product page's 94, and the 92 every page read for SEO, before and after) was three faults older
than the redesign, fixed here.

- **The buy button could barely be read in the dark theme, which is the default.** `.btn-buy` wrote white on `--open`, and the dark
  theme makes `--open` a bright green (#4ace78): 2.02:1. The light theme's dark green hid it (5.71:1). The words are `text-surface`
  now, like `.pc-badge` on the same green: dark on the bright green (8.77:1), still white on the dark one. `tests/contrast.test.ts`
  measures every rule in `globals.css` that fills with a colour and writes on it (the buttons, the chips, the card's badge), from
  the tokens, in both themes, and asks 4.5:1 of each, so a new token value or a new button cannot bring it back. `.btn-buy` was the
  only one under it.
- **"+ I own this" drew with its words against its border.** `vault.css` wrote the button as `:where(.ce-vault-btn)`, which weighs
  nothing, and Tailwind's preflight styles a bare `<button>` (padding 0, the parent's size and weight) and a bare `<a>` (the
  parent's colour): one element out-weighs a `:where()`. The button had no padding, 16px and weight 400 where the file asks for
  14.4px, 14px and 700 (91.2px wide; 111.8px now), and "See my collection →" was the text's colour, not the accent. The two rules
  are written with their class now. `tests/vault.test.ts` reads the reset from `tailwindcss` itself and the elements from the
  components' markup, and fails on any `:where()` rule in the file that the reset beats. The file is the same one on DexCompare and
  MTG Compare (fixed the same day) and on Gundam, Bandai, Lorcana, Cyberpunk and SportsCardCompare (not touched here, and
  reported). `cart.css` is written the same way and is left alone: its add button is an icon, where the lost padding and size show
  nothing, and its class's weight would out-rank the `text-muted` the price table puts on it; "+ Add to cart" keeps the quiet
  12px the table gives it.
- **The header's "More" link said nothing to a crawler or a screen reader.** Lighthouse's SEO check ("Links do not have
  descriptive text") failed on every page. The label is still "More" to the eye; `HeaderNavItem.rest` ("tools and guides") follows
  it in `.sr-only`, so the link's text reads "More tools and guides". `tests/minimal-look.test.ts` renders the header and refuses
  any link whose whole text is one of the words Lighthouse lists.

Measured on a fresh build, on a phone: the product page 94 → 97 for accessibility and 92 → 100 for SEO; the home page and the
booster box page 100 for accessibility and 92 → 100 for SEO. What is left on the product page is the store thumbs
(`StoreVote.tsx`: 20×16px buttons, under the 24px the check asks for). That file is the same on every site and is the owner's
"very tiny area", so it is reported, not changed here. No deploy marker: this rides the next release.

## 2026-11-14: a polish pass: search that answers, a readable price chart, the 404, tap targets and dates (owner: "significantly better and friendlier")

The owner asked for the site to look better and feel friendlier, without adding anything. Every page type was opened at 390px and
1440px in both themes, measured (page width, tap targets, contrast) and compared before and after. Nothing was added to a page;
what changed is what was broken, cramped or robotic.

- **Search answers.** There is no search results page (the site is static), yet Enter sent the typed words to `/cards?q=`, a
  retired URL that 301s to `/sealed`: the whole sealed hub, unfiltered. And a search with no match showed nothing at all. Now Enter
  opens the highlighted product, or the only match; with several it marks the first, so a second Enter opens it; with none the
  panel says "Nothing matches …" and offers All sealed, Sets and Deals (pages that exist). Enter pressed before the suggestions
  arrive asks at once. In the header on a phone the suggestions were as narrow as the field (about 130px): the panel takes the
  screen's width under the header. A placeholder too long for the field ends in "…" (it was cut mid-word: "Search se").
- **The price chart can be read on a phone.** Its figures were drawn inside the SVG and shrank with it: about 5px tall at 390px.
  The drawing now stretches to a box of fixed height (no layout shift) with a line that keeps its width, and the highest and lowest
  price and the two dates are page text beside it ("26 Oct 2026"). The line takes the theme's up and down tokens (the fixed green
  read 2.6:1 on the light theme's white). The scale now runs from the lowest to the highest price in the window, level with the two
  figures; it used to pad by 5% of the price, so a small move drew as a flat line in the middle of the box.
- **The 404 page** said "Search for the card instead" on a site with no cards, and offered one link. It says what happened, keeps
  the search and offers Home, All sealed, Sets and Deals. Its h1 is unchanged.
- **The product photo sits on the site's plate** on the product page, like every product card: a reserved square (the bare image
  was laid out as a 400×560 card and jumped to the photo's own shape when it loaded) and white behind a white-backed photo in the
  dark theme. Same `alt`, same image URL.
- **The region buttons above the price table fit one row on a phone** (six equal buttons, 36px tall; "SG" used to drop to a row of
  its own, in the quick view too). The table's empty state says what to do: "No store in the United States lists this right now.
  Pick another region above to see its prices."
- **`/sets` on a phone:** the table was wider than its box and cut its last column off; dates broke across two lines
  ("2026-12-/04"). The booster box count shows from `sm` up, dates read "4 Dec 2026" and do not wrap, numbers are tabular. The set
  page's eyebrow and the guides' dates read as dates too ("Released 13 November 2026", "7 Nov 2026"). Visible text only: every
  `datePublished` and JSON-LD date is the ISO string it was.
- **Tap targets of 40px** where they were 16 to 30px: "All sets →" and "All 330 →" beside a section title, the set page's older
  and newer set, the share button on a phone, "Report a wrong price", "Email me when the price drops", the set names in `/sets`,
  the product names in `/movers`.
- **Small things.** The focus ring no longer sets a 6px radius (a round button or a chip changed shape when the keyboard reached
  it). The card's stock line is 12px (11px). A latest-set tile's price line fits without cutting "Booster Box" to "Booster …" on a
  desktop. "in United States" reads "in the United States" in the shelf's line. "1 listings matched" is "1 listing matched". A chip,
  a way in and a set tile give a little when pressed (transform only, off for reduced motion).

**Not touched, on purpose.** No paid link, ad block, pinned eBay, TCGplayer or Amazon row, buy button, affiliate tag or placement
name was added, removed, moved, restyled or reworded: the `/go` links of eleven pages are byte-for-byte the same before and after,
so the 19 November clicks-per-placement recheck is unaffected. No URL, redirect, title, meta description, canonical, robots, Open
Graph tag, JSON-LD, h1 or h2 changed (the same eleven pages compared field by field against a build of `main`). No new font,
library, colour, block or section; no `revalidate` or caching change. Two faults sit inside paid rows and are left for the owner:
the "Best price" badge breaks over two lines in the price table on a phone, and the set page's buy box cuts every product name to
one line, so its three rows can read alike ("Magnificent Maestr…"). The store thumbs (20×16px) are still his "very tiny area".
`tests/polish.test.ts` pins the search, the chart, the focus ring, the 404 and the date and market wording. No deploy marker: this
rides the next release.

## 2026-11-14: every page after the home page, in the home page's voice (owner: "make all the other pages more aesthetic as well")

The home page set the look on 13 November; the pages behind it still spoke in three or four older voices (a heavy black h1 here, a
bold one there, bulleted walls of underlined links, a guide set 95 characters wide). Each page type was opened at 390px and 1440px
in both themes, before and after (screenshots in the project files, `redesign/2026-11-14-polish/ygo/r2-*`). Nothing was added to a
page: no block, promo, badge or colour.

- **One page head everywhere** (`PageHead` in `components/Section.tsx`, `.page-h1`, `.page-sub` in `globals.css`): the h1 the list
  pages already used (display face, bold, tight, 3xl to 5xl), one muted line under it, an optional small line above. Twenty pages
  that wrote `font-black` h1s of their own (sets, movers, tools, deal finder, pre-orders, holiday pages, games, kits, creators,
  cart, collection…) use it; the static pages (about, stores, terms, privacy, contact, methodology…) get it through `StaticPage`.
  The h1 text of every page is unchanged.
- **Reading pages are set as articles** (`.prose-site`): a 68-character measure (it was the 768px column, ~95 characters on a
  desktop), body text in ink a step softer than headings (was the muted grey), a heading scale with room above, quiet list
  markers, links underlined in a faint brand line, and any table in a post scrolls in its own box instead of widening the page.
  A post's date is the small line above its title; its FAQ opens row by row like the home page's (the questions are still h3s,
  the answers still in the HTML, the FAQPage JSON-LD unchanged); "More guides" and "Free price tools" are plain rows of 40px
  links.
- **Guides index**: a quiet list (date, title, one line) instead of a stack of cards where one in eight had a picture; the post's
  picture shows beside it from `sm` up. Same links.
- **Stores** (`/stores`): eighteen phone screens of underlined links are now one row per market with its store count, each
  opening (a native `<details>`, the market name still its h2) to the stores in columns, the name first and "N listings matched"
  in quiet words after it. Every store, link and count is still in the server HTML. The suggest button is the brand button, not
  the money green.
- **Product page**: on a 390px phone the price table was 28px wider than its box and cut every "View deal" and "Buy now" button
  short. A store name may now wrap anywhere and the price and button cells give up a little padding on a phone; the buttons'
  words, colours, order and links are exactly as they were. A product with no TCGplayer price no longer shows a lone dash in 30px
  type and "7d — · 30d —" in green: it says "No TCGplayer market price yet", hides the change line until there is one, and says
  "No in-stock listings right now" for "0 in-stock listings worldwide".
- **Deal finder**: on a phone the table cut the price column off. The store and market price move under the product name below
  `sm` (their columns show from `sm`), the filters are the site's 40px fields, and an empty filter says what to try. The "Buy"
  links are unchanged.
- **Pre-orders, sets, movers**: the pre-order tiles' brand-coloured eyebrows are the neutral eyebrow (calm palette), their photo
  sits on the site's plate, and they lift on hover like the home tiles; their FAQ opens row by row. `/sets` sits in the site's
  card with a row hover. `/movers` says what it lists under its h1 ("Products worth $3 or more", it said "Cards" on a sealed-only
  site).

**Not touched, on purpose.** No paid link, ad block, pinned eBay, TCGplayer or Amazon row, buy button, affiliate tag or placement
name was added, removed, moved, reordered or reworded: on fourteen sampled URLs the server HTML's sponsored links (36 on a busy
product page, 54 on the deal finder) are the same hrefs with the same words in the same order, so the 19 November
clicks-per-placement recheck is unaffected. No URL, redirect, title, meta description, canonical, robots, Open Graph tag, JSON-LD
or h1 changed and no h2 was lost, on the same fourteen pages compared field by field against a build of `main`; their internal
links are the same set. No new font, library, colour or client script; no `revalidate` or caching change. No deploy marker: this
rides the next release.

## 2026-11-14: The price rows' cart button says "Add to cart"

The owner, opening the price rows: "there needs to be an add to cart button ... right now, it just sends it to the site". The
cart button was already on every store row, but as a bare grey cart icon on a computer (lost on the tinted best-price row) and
as small coloured text on a phone, so it read as decoration. `CartAddButton` now carries its words by default ("Add to cart",
"In cart" once added; "Add" beside the icon below 640px where a row has no room), with a firmer neutral border, and the phone's
text button (`inline`) is drawn as a bordered button (`cart.css`). Neutral, never a new colour: the buy button stays the one
filled action and the calm three-colour rule holds. Nothing else moved: which rows can be added (open store rows, eBay and
Amazon with a live price; never a marketplace or a search row), the line's buy link and its affiliate tag, the row order, the
buy button and every placement are unchanged. A caller can still ask for the bare icon (`label={false}`).

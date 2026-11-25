// Best Basket (owner, 2026-11-25; lib/basket-server.ts, lib/borrowed-shipping.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planBasket, type BasketCard } from "../src/lib/basket-optimize";
import { BASKET_ROW_MAX_AGE_H, basketListings, basketStores, basketSummary, cleanLines, measuredPostage } from "../src/lib/basket-server";
import { borrow, validBorrowed, type BorrowedShipping } from "../src/lib/borrowed-shipping";
import type { PostageQuote } from "../src/lib/postage";
import type { Offer } from "../src/lib/site-types";
import { basketLinesFrom } from "../src/components/basket/BestBasketView";
import type { CartLine } from "../src/lib/cart-list";

const NOW = Date.parse("2026-11-25T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const offer = (o: Partial<Offer>): Offer => ({ source: "a", market: "US", currency: "USD", cents: 2000, inStock: true, url: "https://a.com/products/box", title: "Magnificent Maestros Box", ...o });

test("a basket uses in-stock rows of this market from stores read in 48 hours, never a marketplace or a pre-order", () => {
  const read = { a: { at: hoursAgo(2) }, b: { at: hoursAgo(BASKET_ROW_MAX_AGE_H + 1) }, c: { at: hoursAgo(1) }, d: { at: hoursAgo(47) }, e: { at: hoursAgo(1) } };
  const rows = basketListings(
    [
      offer({ source: "a", cents: 2000 }),
      offer({ source: "a", cents: 1900, inStock: false }),
      offer({ source: "b", cents: 1500 }), // stale store
      offer({ source: "c", cents: 1400, title: "Magnificent Maestros Box [Pre-Order]" }),
      offer({ source: "e", cents: 1300, preorder: true }),
      offer({ source: "tcgplayer", cents: 1200 }),
      offer({ source: "ebay", cents: 1100 }),
      offer({ source: "d", cents: 2100 }),
      offer({ source: "d", cents: 1000, market: "UK", currency: "GBP" }), // another market
      offer({ source: "zz", cents: 900 }), // never read
    ],
    "US",
    read,
    false,
    NOW,
  );
  assert.deepEqual(
    rows.map((r) => [r.retailer, r.priceCents]),
    [
      ["a", 2000],
      ["d", 2100],
    ],
  );
  assert.equal(basketListings([offer({})], "US", read, true, NOW).length, 0, "an unreleased set's product: none");
});

test("the request is cleaned: one line per product, quantities capped, junk dropped", () => {
  assert.deepEqual(cleanLines([{ slug: "Box-1", qty: 2 }, { slug: "box-1", qty: 5 }, { slug: "../etc", qty: 1 }, { slug: "b", qty: 99 }, null]), [
    { slug: "box-1", qty: 5 },
    { slug: "b", qty: 20 },
  ]);
});

test("shipping is borrowed only from the same shop (host) in the same market, the freshest measurement winning", () => {
  const pts = (c: number) => [{ subtotalCents: 1000, rates: { ny: c, sf: c } }];
  const out = borrow(
    [
      { key: "ours-a", base: "https://www.shop-a.com", market: "US" },
      { key: "ours-b", base: "https://shop-b.co.uk", market: "UK" },
      { key: "ours-c", base: "https://shop-c.com", market: "CA" },
    ],
    [
      {
        from: "dexcompare",
        stores: [
          { key: "dex-a", base: "https://shop-a.com", market: "US" },
          { key: "dex-c", base: "https://shop-c.com", market: "US" }, // same shop, another market: never
        ],
        snapshot: { addresses: { US: [{ id: "ny", label: "New York" }] }, stores: { "dex-a": { market: "US", currency: "USD", measuredAt: "2026-11-20T00:00:00Z", points: pts(500) }, "dex-c": { market: "US", currency: "USD", measuredAt: "2026-11-20T00:00:00Z", points: pts(500) } } },
      },
      {
        from: "mtgcompare",
        stores: [
          { key: "m-a", base: "https://shop-a.com", market: "US" },
          { key: "m-b", base: "https://www.shop-b.co.uk", market: "UK" },
        ],
        snapshot: { stores: { "m-a": { market: "US", currency: "USD", measuredAt: "2026-11-23T00:00:00Z", points: pts(700) }, "m-b": { market: "UK", currency: "GBP", measuredAt: "2026-11-21T00:00:00Z", points: pts(300) } } },
      },
    ],
    (m) => ({ US: "USD", UK: "GBP", CA: "CAD" })[m] ?? null,
    new Date(NOW),
  );
  assert.deepEqual(Object.keys(out.stores).sort(), ["ours-a", "ours-b"]);
  assert.equal(out.stores["ours-a"].from, "mtgcompare");
  assert.equal(out.stores["ours-a"].points[0].rates.ny, 700);
  assert.deepEqual(out.addresses.US?.map((a) => a.id), ["ny"]);
});

test("measured postage: the dearest address, free over the measured threshold, 'up to' with more than one item", () => {
  const snap: BorrowedShipping = validBorrowed({
    version: 1,
    generatedAt: hoursAgo(1),
    addresses: { US: [{ id: "ny", label: "New York" }, { id: "sf", label: "San Francisco" }] },
    stores: {
      a: {
        market: "US",
        currency: "USD",
        measuredAt: "2026-11-20T00:00:00Z",
        points: [
          { subtotalCents: 1000, rates: { ny: 500, sf: 800 } },
          { subtotalCents: 10000, rates: { ny: 0, sf: 0 } },
        ],
      },
    },
  });
  const post = measuredPostage("a", "US", snap)!;
  const q = post({ subtotalCents: 5000, items: 1 });
  assert.equal(q.cents, 800, "the dearest end of the range between the two measured carts");
  assert.equal(q.upTo, true);
  assert.equal(q.freeFromCents, 10000);
  assert.equal(post({ subtotalCents: 3000, items: 2 }).beyondMeasured, true);
  assert.equal(post({ subtotalCents: 12000, items: 2 }).free, true);
  assert.equal(post({ subtotalCents: 500, items: 1 }).basis, "estimate", "under the cheapest measured cart");
  assert.equal(measuredPostage("a", "UK", snap), null);
  assert.equal(measuredPostage("zz", "US", snap), null);
});

test("an unmeasured store is left out with its reason, never priced at zero shipping", () => {
  const cards: BasketCard[] = [{ cardId: "1", name: "Box", slug: "box", qty: 1, listings: [{ retailer: "cheap", priceCents: 100, url: "u" }, { retailer: "a", priceCents: 200, url: "u" }] }];
  const flat = (): PostageQuote => ({ cents: 500, label: "Measured shipping", tracked: null, basis: "measured", free: false, upTo: false });
  const { plan } = planBasket(cards, basketStores(cards, "US", (k) => (k === "a" ? flat : null)));
  assert.equal(plan.stores[0].key, "a");
  assert.equal(plan.totalCents, 700);
  assert.deepEqual(plan.excludedStores.map((x) => x.key), ["cheap"]);
});

test("a visitor without Premium gets the totals, never the store-by-store plan", () => {
  const cards: BasketCard[] = [{ cardId: "1", name: "Box", slug: "box", qty: 1, listings: [{ retailer: "a", priceCents: 100, url: "u" }] }];
  const result = planBasket(cards, { a: { name: "A", postage: () => ({ cents: 0, label: "", tracked: null, basis: "measured", free: true, upTo: false }) } });
  const s = basketSummary({ result, missing: [], products: [] }) as Record<string, unknown>;
  assert.equal(s.totalCents, 100);
  for (const k of ["stores", "plan", "alternatives", "excludedStores"]) assert.ok(!(k in s), k);
  const route = readFileSync("src/app/api/basket/route.ts", "utf8");
  assert.match(route, /premium\s*\?\s*\{[^}]*plan: basket\.result\.plan/);
  assert.match(route, /:\s*\{ premium: false, summary, products: basket\.products, missing: basket\.missing \}/);
  assert.match(route, /"Cache-Control": "no-store"/);
});

test("the shortlist gives one line per product page", () => {
  const line = (page: string, qty = 1) => ({ page, qty }) as CartLine;
  assert.deepEqual(basketLinesFrom([line("/card/box", 1), line("/card/box", 2), line("/card/etb/"), line("/sets/x")]), [
    { slug: "box", qty: 2 },
    { slug: "etb", qty: 1 },
  ]);
});

test("plan links are the site's own /go links, and the page stays out of Google", () => {
  assert.match(readFileSync("src/lib/basket-server.ts", "utf8"), /goHref\(\{ url, source: key, market, inStock: true \}, undefined, "best-basket"\)/);
  assert.match(readFileSync("src/app/tools/best-basket/page.tsx", "utf8"), /robots: \{ index: false/);
  assert.doesNotMatch(readFileSync("next.config.js", "utf8"), /source: "\/tools\/best-basket"/);
});

// SEO audit (2026-11-03): descriptive alt text on every product photo, the brand on the homepage title,
// an ItemList of the homepage's products, ItemLists on set and sealed hubs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(p, "utf8");
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

test("no page or component draws a photo with empty alt text (share images and the quick view aside)", () => {
  for (const f of walk("src").filter((f) => /\.(tsx|ts)$/.test(f) && !f.includes("opengraph-image") && !f.endsWith("QuickView.tsx"))) {
    assert.ok(!/<img[^>]*alt=""/.test(read(f)), f);
  }
});

test("the homepage title tries every candidate with the brand before any without", () => {
  const src = read("src/app/page.tsx");
  const ladder = src.match(/fitTitle\(\[([^\]]+)\]\)/)![1].split("`,").map((s) => s.includes("${brand}"));
  const firstBare = ladder.indexOf(false);
  assert.ok(firstBare > 0 && ladder.slice(firstBare).every((b) => !b), String(ladder));
});

test("homepage, set and sealed hubs list their products as an ItemList", () => {
  for (const f of ["src/app/page.tsx", "src/app/sets/[slug]/page.tsx", "src/app/sealed/[type]/page.tsx"]) assert.match(read(f), /"ItemList"/, f);
});

// Zero-data card pages are noindex,follow; priced or listed ones (and every card of an
// upcoming set) are indexed; JSON-LD prices carry a priceValidUntil of tomorrow.
test("card pages with no price and no listing are kept out of the index", async () => {
  const { cardIndexable, priceValidUntil } = await import("../src/lib/indexing");
  const card = { kind: "card" as const, sealedType: null };
  assert.equal(cardIndexable(card, null, 0, { upcoming: false }), false);
  assert.equal(cardIndexable(card, 250, 0, { upcoming: false }), true);
  assert.equal(cardIndexable(card, null, 1, { upcoming: false }), true);
  assert.equal(cardIndexable(card, null, 0, { upcoming: true }), true);
  assert.equal(cardIndexable({ kind: "sealed", sealedType: "Insert" }, 5000, 3, { upcoming: false }), false);
  assert.equal(priceValidUntil(Date.UTC(2026, 10, 4, 12)), "2026-11-05");
  const { sealedAsksIndex, setAsksIndex } = await import("../src/lib/indexing");
  const box = { kind: "sealed" as const, sealedType: "Booster Box" };
  const live = { upcoming: false };
  assert.equal(sealedAsksIndex(box, 5000, { listedSources: 2, inStockSources: 2 }, live, false), false, "two stores is not a comparison worth indexing");
  assert.equal(sealedAsksIndex(box, 5000, { listedSources: 3, inStockSources: 0 }, live, false), false, "none in stock");
  assert.equal(sealedAsksIndex(box, 5000, { listedSources: 3, inStockSources: 1 }, live, false), true);
  assert.equal(sealedAsksIndex(box, 5000, { listedSources: 1, inStockSources: 1 }, live, true), true, "found in search");
  assert.equal(sealedAsksIndex(box, null, { listedSources: 0, inStockSources: 0 }, { upcoming: true }, false), true, "upcoming set");
  assert.equal(sealedAsksIndex({ kind: "sealed", sealedType: "Insert" }, 5000, { listedSources: 9, inStockSources: 9 }, live, true), false);
  assert.equal(setAsksIndex(1, false, false), false);
  assert.equal(setAsksIndex(2, false, false), true);
  assert.equal(setAsksIndex(0, true, false), true);
  const src = read("src/app/card/[slug]/page.tsx");
  assert.match(src, /productAsksIndex\(p\)/);
  assert.match(src, /priceValidUntil: priceValidUntil\(\)/);
  // A Product with no offers is a Search Console error (Gundam, 20 pages, 2026-11-04):
  // the block is rendered only when an in-stock US offer backs it.
  assert.match(src, /\{usOffers\.length > 0 && \(\s*<JsonLd/);
  assert.doesNotMatch(src, /offers: usOffers\.length\s*\?/);
});

// Page scorecard (2026-11-23): impressions past page 3 with no click do not hold a page in the index.
test("search demand: a click or 10+ impressions within position 30 is found; past page 3 alone is not", async () => {
  const { foundPaths } = await import("../src/lib/search-demand");
  const found = foundPaths({
    "/sets/clicked-deep": [1, 3, 60],
    "/sets/seen-page-2": [0, 14, 22.8],
    "/sets/seen-at-30": [0, 10, 30],
    "/sets/past-page-3": [0, 25, 34],
    "/sets/few": [0, 9, 4],
    "/sets/no-position": [0, 12],
  });
  assert.deepEqual([...found].sort(), ["/sets/clicked-deep", "/sets/no-position", "/sets/seen-at-30", "/sets/seen-page-2"]);
  assert.match(read("src/app/tools/selling-fees/page.tsx"), /robots: \{ index: false, follow: true \}/);
});

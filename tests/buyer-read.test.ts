import { test } from "node:test";
import assert from "node:assert/strict";
import { buyerRead, type BuyerReadInput } from "../src/lib/buyer-read";

const money = (c: number, cur = "USD") => `${cur === "USD" ? "$" : cur + " "}${(c / 100).toFixed(2)}`;
const base = (over: Partial<BuyerReadInput> = {}): BuyerReadInput => ({
  name: "Test Box",
  sealedType: "Booster Box",
  refCents: 10000,
  history: [],
  today: 20780,
  offers: [],
  storeName: (o) => o.source,
  set: { name: "Test Set", releasedOn: "2026-01-01", upcoming: false },
  siblings: [],
  money,
  marketOrder: ["US", "UK", "CA", "AU", "EU", "SG"],
  marketName: (m) => (m === "US" ? "the United States" : m),
  ...over,
});

test("store spread, cheapest vs TCGplayer, US dollars only", () => {
  const r = buyerRead(base({ offers: [
    { source: "a", market: "US", currency: "USD", cents: 8000, inStock: true },
    { source: "b", market: "US", currency: "USD", cents: 12000, inStock: true },
    { source: "ebay", market: "US", currency: "USD", cents: 7000, inStock: true },
    { source: "tcgplayer", market: "US", currency: "USD", cents: 9000, inStock: true },
    { source: "c", market: "AU", currency: "AUD", cents: 15000, inStock: true },
  ] })).join(" ");
  assert.match(r, /2 stores have Test Box in stock in the United States/); // eBay and TCGplayer are never stores
  assert.match(r, /33% spread/);
  assert.match(r, /20% under TCGplayer's market price/);
  assert.match(r, /AU has 1 store at AUD 150\.00/); // its own currency, never converted
  assert.match(r, /eBay Buy It Now we found is \$70\.00 \(12% under the cheapest US store\)/);
});

test("never compares a non-US-dollar price with TCGplayer", () => {
  const r = buyerRead(base({ offers: [{ source: "c", market: "AU", currency: "AUD", cents: 5000, inStock: true }] })).join(" ");
  assert.doesNotMatch(r, /TCGplayer's market price of/);
});

test("sold out and pre-orders say so", () => {
  const r = buyerRead(base({ offers: [{ source: "a", market: "US", currency: "USD", cents: 8000, inStock: false }, { source: "b", market: "US", currency: "USD", cents: 9000, inStock: true, preorder: true }] })).join(" ");
  assert.match(r, /No store we track has Test Box in stock right now; 1 store is taking pre-orders and 1 more lists it as sold out/);
});

test("trajectory needs two weeks of history; range and position", () => {
  assert.equal(buyerRead(base({ history: [[20775, 9000], [20779, 10000]] })).some((s) => /since/.test(s)), false);
  const r = buyerRead(base({ history: [[20740, 12000], [20760, 8000], [20779, 10000]] })).join(" ");
  assert.match(r, /down 17% since/);
  assert.match(r, /tracked range is \$80\.00/);
  assert.match(r, /50% of the way from the low to the high/);
});

test("set rank and pack ratio come only from priced siblings", () => {
  const r = buyerRead(base({ siblings: [
    { name: "Test Pack", sealedType: "Booster Pack", refCents: 400 },
    { name: "Test Case", sealedType: "Booster Box Case", refCents: 60000 },
    { name: "Unpriced", sealedType: "Tin", refCents: null },
  ] })).join(" ");
  assert.match(r, /2nd most valuable of the 3 sealed Test Set products/);
  assert.match(r, /as much as 25 of the set's cheapest pack \(Test Pack, \$4\.00\)/);
});

test("nothing to say means nothing padded", () => {
  assert.deepEqual(buyerRead(base({ refCents: null, set: null })), []);
});

test("a site with no eBay prices never names one", () => {
  const r = buyerRead(base({ ebayPrices: false, offers: [{ source: "ebay", market: "US", currency: "USD", cents: 7000, inStock: true }] })).join(" ");
  assert.doesNotMatch(r, /eBay/);
});

import { setRead } from "../src/lib/buyer-read";
test("set read: range, stock, under-TCGplayer, mover and box-to-pack ratio", () => {
  const r = setRead({ name: "S", releasedOn: "2026-01-01", upcoming: false, today: 20780, money, marketName: (m) => String(m), products: [
    { name: "S Booster Box", sealedType: "Booster Box", refCents: 10000, change30d: -12, best: [{ market: "US", currency: "USD", cents: 9000 }], inStockStores: 5 },
    { name: "S Booster Pack", sealedType: "Booster Pack", refCents: 400, change30d: 1, best: [{ market: "US", currency: "USD", cents: 450 }], inStockStores: 2 },
    { name: "S Tin", sealedType: "Tin", refCents: null, change30d: null, best: [], inStockStores: 0 },
  ] }).join(" ");
  assert.match(r, /We track 3 sealed products from it; 2 have a TCGplayer market price, from \$4\.00 for the S Booster Pack to \$100\.00 for the S Booster Box/);
  assert.match(r, /2 of the 3 are in stock at a US store today; the S Booster Box has the widest choice, with 5 stores/);
  assert.match(r, /1 of the 2 with both prices can be bought from a US store under TCGplayer's market price; the biggest gap is the S Booster Box, 10% under/);
  assert.match(r, /down 12% to \$100\.00/);
  assert.match(r, /costs as much as 25 of the S Booster Pack/);
});

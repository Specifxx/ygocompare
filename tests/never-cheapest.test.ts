// Amazon is never "the cheapest" or "Best price". An eBay listing is, when it is genuinely cheaper than every store (owner, 2026-11-18,
// withdrawing the 2026-11-14 rule), but never a price under 75% of the cheapest store. The summary (list tiles, alerts, reports) stays stores only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { priceRows } from "../src/lib/price-rows";
import { summarize } from "../src/lib/price-store";
import type { Offer } from "../src/lib/site-types";

const o = (source: string, cents: number): Offer => ({ source, market: "AU", currency: "AUD", cents, inStock: true, url: "", title: "" });

test("the price table's cheapest row is eBay when it is a real saving, never Amazon", () => {
  const r = priceRows([o("ebay", 63995), o("amazon", 60000), o("store1", 69995)], "AU");
  assert.equal(r.cheapest?.source, "ebay");
  assert.equal(priceRows([o("ebay", 63995)], "AU").cheapest, null, "no store to compare against");
  assert.equal(priceRows([o("ebay", 40000), o("store1", 69995)], "AU").cheapest?.source, "store1", "an eBay price far under the stores is a wrong product, not the best price");
  assert.equal(priceRows([o("ebay", 70000), o("store1", 69995)], "AU").cheapest?.source, "store1", "dearer than a store");
  assert.equal(priceRows([{ ...o("ebay", 63995), inStock: false }, o("store1", 69995)], "AU").cheapest?.source, "store1", "out of stock");
});

test("the summary's cheapest per market is never eBay or Amazon (list tiles, quick buy, reports)", () => {
  const s = summarize({ tcg: {}, offers: [o("ebay", 63995), o("amazon", 60000), o("store1", 69995)], change7d: null, change30d: null });
  assert.deepEqual(s.b.map((t) => t[0]), ["store1"]);
});

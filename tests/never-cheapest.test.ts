// eBay and Amazon are never "the cheapest" or "Best price" (owner rule, every Compare site). On 2026-11-14 an eBay row
// was badged Best price on a product page and named in its "Cheapest in" box; this pins both layers that decide it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { priceRows } from "../src/lib/price-rows";
import { summarize } from "../src/lib/price-store";
import type { Offer } from "../src/lib/site-types";

const o = (source: string, cents: number): Offer => ({ source, market: "AU", currency: "AUD", cents, inStock: true, url: "", title: "" });

test("the price table's cheapest row is never eBay or Amazon", () => {
  const r = priceRows([o("ebay", 63995), o("amazon", 60000), o("store1", 69995)], "AU");
  assert.equal(r.cheapest?.source, "store1");
  assert.equal(priceRows([o("ebay", 63995)], "AU").cheapest, null);
});

test("the summary's cheapest per market is never eBay or Amazon (list tiles, quick buy, reports)", () => {
  const s = summarize({ tcg: {}, offers: [o("ebay", 63995), o("amazon", 60000), o("store1", 69995)], change7d: null, change30d: null });
  assert.deepEqual(s.b.map((t) => t[0]), ["store1"]);
});

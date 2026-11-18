// The "Best price" row (owner, 2026-11-18): loud only when a row that pays us is the cheapest; a plain store gets a small neutral tag
// and a hint that names only the eBay / TCGplayer rows the list really has.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bestTreatment, isPaidRow } from "../src/lib/best-price";
import { priceRows } from "../src/lib/price-rows";
import type { Offer } from "../src/lib/site-types";

const o = (source: string, cents: number, url = `https://${source}.example/p`): Offer => ({ source, market: "US", currency: "USD", cents, inStock: true, url, title: "" });

test("a plain store that is cheapest gets the plain tag, with a hint only when an eBay or TCGplayer row exists", () => {
  const offers = [o("store1", 9000), o("ebay", 9500), o("tcgplayer", 9800)];
  const r = priceRows(offers, "US");
  assert.equal(r.cheapest?.source, "store1");
  const t = bestTreatment(r.cheapest, r.display);
  assert.equal(t.loud, false);
  assert.equal(t.hint, "Prices and stock change: also check eBay and TCGplayer");
  assert.equal(bestTreatment(r.cheapest, [o("store1", 1), o("ebay", 2)]).hint, "Prices and stock change: also check eBay");
  assert.equal(bestTreatment(r.cheapest, [o("store1", 1), o("tcgplayer", 2)]).hint, "Prices and stock change: also check TCGplayer");
  const none = bestTreatment(o("store1", 1), [o("store1", 1), o("store2", 2)]);
  assert.equal(none.loud, false);
  assert.equal(none.hint, null, "no eBay or TCGplayer row: the plain tag and nothing else");
});

test("an affiliate cheapest row keeps the full highlight and no hint", () => {
  for (const src of ["ebay", "tcgplayer", "amazon"]) {
    const t = bestTreatment(o(src, 1), [o(src, 1), o("ebay", 2)]);
    assert.deepEqual(t, { loud: true, hint: null }, src);
    assert.equal(isPaidRow(o(src, 1)), true);
  }
  assert.equal(isPaidRow(o("store1", 1)), false);
  assert.deepEqual(bestTreatment(null, []), { loud: true, hint: null });
});

test("the price table only draws the green tint, the green chip and the filled button when the treatment is loud", () => {
  const src = readFileSync("src/components/PriceTable.tsx", "utf8");
  assert.match(src, /const loud = best && treatment\.loud/);
  assert.match(src, /\$\{loud \? "bg-open-soft\/40" : ""\}/);
  assert.match(src, /loud \? "btn-primary px-3 py-1\.5"/);
  assert.doesNotMatch(src, /best \? "btn-primary/);
  const tag = readFileSync("src/components/BestPriceTag.tsx", "utf8");
  const plain = tag.slice(tag.indexOf("data-best-plain"));
  assert.doesNotMatch(plain, /bg-open|text-open|border-open/, "the plain tag has no green");
  assert.match(plain, /aria-label=\{treatment\.hint\}/);
  assert.match(plain, /title=\{treatment\.hint\}/);
});

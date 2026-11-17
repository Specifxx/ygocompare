import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Owner, 2026-11-17: ALL affiliated rows at the top, cheapest first (eBay, TCGplayer, a priced Amazon), then the cheapest store, then the rest.
test("the price table sorts its affiliated rows by price above the stores", () => {
  const s = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");
  assert.match(s, /const byPrice = \(list: Offer\[\]\) =>/);
  assert.match(s, /\.sort\(\(a, b\) => norm\(a\) - norm\(b\)\)/);
  assert.match(s, /const (uncapped|shown) = byPrice\(/);
  assert.match(s, /norm\(o\) < amazonCents/);
});

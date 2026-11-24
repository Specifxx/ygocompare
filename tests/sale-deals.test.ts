import { test } from "node:test";
import assert from "node:assert/strict";
import { applyFilters, basesIn, DEFAULT_FILTERS, deliveredCents, isStale, sparkPath, valuesOf, type SaleDealRow } from "../src/lib/sale-deals";

const row = (over: Partial<SaleDealRow>): SaleDealRow => ({
  key: "US:1", id: 1, slug: "a", name: "A", game: null, productType: "Booster Box", imageUrl: null, market: "US", currency: "USD", preorder: false,
  priceCents: 10000, storeName: "S", buyHref: "/go", ebayHref: null, checkedAt: null, shipCents: null, tcg: null, median: null, spark: [], ...over,
});

test("one list: the toggle picks the basis, a row without it is left out, the market keeps its own rows", () => {
  const rows = [
    row({ key: "US:1", tcg: { pct: 20, cents: 12500 } }),
    row({ key: "US:2", id: 2, median: { pct: 15, cents: 11800, stores: 3 } }),
    row({ key: "UK:3", id: 3, market: "UK", currency: "GBP", median: { pct: 30, cents: 14000, stores: 4 } }),
  ];
  assert.deepEqual(applyFilters(rows, DEFAULT_FILTERS).map((r) => r.key), ["US:1"]);
  assert.deepEqual(applyFilters(rows, { ...DEFAULT_FILTERS, basis: "median" }).map((r) => r.key), ["US:2"]);
  assert.deepEqual(applyFilters(rows, { ...DEFAULT_FILTERS, basis: "median", market: "UK" }).map((r) => r.key), ["UK:3"]);
  assert.deepEqual(basesIn(rows, "US"), ["tcg", "median"]);
  assert.deepEqual(basesIn(rows, "UK"), ["median"]);
});

test("filters and sort", () => {
  const rows = [
    row({ key: "US:1", priceCents: 4000, tcg: { pct: 10, cents: 4500 }, game: "YGO" }),
    row({ key: "US:2", priceCents: 20000, tcg: { pct: 30, cents: 28000 }, preorder: true, productType: "Tin", game: "YGO" }),
  ];
  assert.deepEqual(applyFilters(rows, DEFAULT_FILTERS).map((r) => r.key), ["US:2", "US:1"]);
  assert.deepEqual(applyFilters(rows, { ...DEFAULT_FILTERS, sort: "price" }).map((r) => r.key), ["US:1", "US:2"]);
  assert.deepEqual(applyFilters(rows, { ...DEFAULT_FILTERS, band: "u50" }).map((r) => r.key), ["US:1"]);
  assert.deepEqual(applyFilters(rows, { ...DEFAULT_FILTERS, stock: "now" }).map((r) => r.key), ["US:1"]);
  assert.deepEqual(applyFilters(rows, { ...DEFAULT_FILTERS, type: "Tin" }).map((r) => r.key), ["US:2"]);
  assert.deepEqual(valuesOf(rows, DEFAULT_FILTERS, "productType").sort(), ["Booster Box", "Tin"]);
});

test("delivered price, stale flag and sparkline", () => {
  assert.equal(deliveredCents(row({ shipCents: 995 })), 10995);
  assert.equal(deliveredCents(row({})), null);
  const now = Date.parse("2026-11-24T12:00:00Z");
  assert.equal(isStale("2026-11-23T23:00:00Z", now), true);
  assert.equal(isStale("2026-11-24T06:00:00Z", now), false);
  assert.equal(isStale(null, now), false);
  assert.equal(sparkPath([null, 100], 72, 22), "");
  assert.match(sparkPath([100, null, 80, 90], 72, 22), /^M0\.0,1\.0 L48\.0,21\.0 L72\.0,/);
});

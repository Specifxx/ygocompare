import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { priceApiFrom } from "../src/lib/price-api";

// The free price file (competitor scan, 2026-11-08): the alert feed's prices, absolute links, a file built at
// deploy, never a function.
test("prices.json carries each product's price per market, with absolute links and currencies", () => {
  const feed = { v: 1 as const, site: "x", generatedAt: "", deals: [], items: { a: { n: "Box", u: "/card/box", p: { US: 10000, AU: 15000 } } } };
  const api = priceApiFrom(feed, "https://example.com", "Example", new Date("2026-11-08T00:00:00Z"));
  assert.equal(api.products.length, 1);
  assert.deepEqual(api.products[0].prices.US, { cents: 10000, url: "https://example.com/card/box" });
  assert.equal(api.currency.US, "USD");
  assert.equal(api.currency.AU, "AUD");
  assert.match(api.licence, /visible link/);
  assert.equal(api.attribution.html, '<a href="https://example.com">Prices from Example</a>');
});

test("prices.json is a static file open to every origin", () => {
  const route = fs.readFileSync("src/app/prices.json/route.ts", "utf8");
  assert.match(route, /export const dynamic = "force-static";/);
  assert.match(route, /Access-Control-Allow-Origin/);
});

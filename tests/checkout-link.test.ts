import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isCheckoutLink, shopifyCartUrl } from "../src/lib/checkout-link";
import { goHref, tagged } from "../src/lib/affiliate";

// Straight to checkout (owner, 2026-11-06), as RiftCompare #340 and OP Compare #99.
// The engine's Shopify reader already stores ?variant=<id> on every offer URL.
const URL_V = "https://www.example-store.com/products/booster-box?variant=44123456789012";

test("an in-stock store row's /go link asks for checkout; sold out, eBay, TCGplayer and Amazon do not", () => {
  const q = (o: Parameters<typeof goHref>[0]) => new URL(goHref(o, 1, "card"), "https://x.test").searchParams.get("c");
  assert.equal(q({ url: URL_V, source: "store1", market: "US", inStock: true }), "1");
  assert.equal(q({ url: URL_V, source: "store1", market: "US", inStock: false }), null);
  assert.equal(q({ url: "https://www.example-store.com/products/booster-box", source: "store1", market: "US", inStock: true }), null);
  assert.equal(q({ url: "https://www.ebay.com/itm/1", source: "ebay", market: "US", inStock: true }), null);
  assert.equal(q({ url: "https://www.tcgplayer.com/product/1?variant=44123456789012", source: "tcgplayer", market: "US", inStock: true }), null);
});

test("tagged opens the cart only when asked, keeping the referral tags", () => {
  const out = tagged(URL_V, "us-card-1", { checkout: true });
  const u = new URL(out);
  assert.equal(u.pathname, "/cart/44123456789012:1");
  assert.ok(u.searchParams.get("utm_source"));
  assert.equal(u.searchParams.get("utm_content"), "checkout");
  assert.ok(isCheckoutLink(out));
  assert.equal(new URL(tagged(URL_V, "us-card-1")).pathname, "/products/booster-box");
  assert.equal(shopifyCartUrl("https://www.example-store.com/products/x"), null);
});

test("Awin wins over checkout, and /go passes the flag", () => {
  const src = readFileSync(new URL("../src/lib/affiliate.ts", import.meta.url), "utf8");
  const body = src.slice(src.indexOf("export function tagged("));
  assert.ok(body.indexOf("if (awin) return awin;") > 0 && body.indexOf("shopifyCartUrl(plain)") > body.indexOf("if (awin) return awin;"));
  const go = readFileSync(new URL("../src/app/go/route.ts", import.meta.url), "utf8");
  assert.match(go, /checkout: u\.searchParams\.get\("c"\) === "1"/);
});

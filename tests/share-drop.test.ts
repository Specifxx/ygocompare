import { test } from "node:test";
import assert from "node:assert/strict";
import { dropText, shareUrl } from "../src/lib/share";
import type { Offer } from "../src/lib/site-types";

const o = (source: string, cents: number, extra: Partial<Offer> = {}): Offer => ({ source, market: "CA", currency: "CAD", cents, inStock: true, url: "https://x", title: "t", ...extra });
const fmt = (c: number, cur: string) => `${cur} ${(c / 100).toFixed(2)}`;

test("dropText: the cheapest in-stock store in the market, never eBay, TCGplayer or Amazon", () => {
  const offers = [o("ebay", 5000), o("tcgplayer", 6000), o("amazon", 6500), o("zzstore", 9999), o("zzstore2", 8999, { inStock: false }), o("zzstore3", 100, { market: "US", currency: "USD" })];
  const t = dropText("Box", offers, "CA", fmt)!;
  assert.match(t, /^Box for CAD 99\.99 at .+, the cheapest store price we found in Canada\./);
  assert.match(dropText("Box", [o("zzstore", 8999, { preorder: true })], "CA", fmt)!, /^Pre-order: /);
  assert.equal(dropText("Box", [o("ebay", 100)], "CA", fmt), null);
  assert.equal(shareUrl("https://example.com", "/card/x", "drop"), "https://example.com/card/x?utm_source=share&utm_medium=drop");
});

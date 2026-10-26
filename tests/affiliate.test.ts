import { test } from "node:test";
import assert from "node:assert/strict";
import { amazonSearchUrl, goHref, tagged } from "@/lib/affiliate";

test("eBay links carry the EPN campaign and a per-site customid", () => {
  const u = new URL(tagged("https://www.ebay.com/itm/123", "home-1"));
  assert.equal(u.searchParams.get("campid"), process.env.EBAY_AFFILIATE_CAMPAIGN || "5339155912");
  assert.equal(u.searchParams.get("mkevt"), "1");
  assert.ok(u.searchParams.get("customid"));
  assert.ok(new URL(tagged("https://www.ebay.co.uk/itm/1")).searchParams.get("mkrid"));
});

test("TCGplayer links go through the Impact partner link", () => {
  const t = tagged("https://www.tcgplayer.com/product/1/x");
  assert.ok(t.startsWith("https://partner.tcgplayer.com/"));
  assert.ok(t.includes(encodeURIComponent("https://www.tcgplayer.com/product/1/x")));
});

test("Amazon search links carry an Associates tag", () => {
  assert.match(amazonSearchUrl("booster box")!, /[?&]tag=/);
});

test("buy links route through /go with retailer and market for click events", () => {
  const h = goHref({ url: "https://x.com/p", source: "ebay", market: "UK" }, 5, "card");
  const q = new URLSearchParams(h.split("?")[1]);
  assert.equal(q.get("s"), "ebay");
  assert.equal(q.get("m"), "UK");
  assert.equal(q.get("p"), "5");
});

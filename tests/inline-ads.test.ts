// The ONE in-content ad block (owner, 2026-11-13): which tiles, in which order, with which tags, and that it stays quiet, native
// and out of the server HTML. components/InlineAds.tsx, lib/inline-ads.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BANNER_MAX, bannerSides, inlineReady } from "@/lib/inline-ads";
import type { AdTile, CardAds } from "@/lib/card-ads";

const t = (id: number, image: string | null = "x.jpg"): AdTile => ({ id, slug: `s${id}`, name: `Product ${id}`, image, cents: 1000, currency: "USD", url: "https://www.ebay.com/itm/1", ref: null });
const src = (f: string) => readFileSync(f, "utf8");

test("one banner per side, each with its own photos; a side with fewer than two has none; a thin local market falls back to eBay US", () => {
  const ads: CardAds = { ebay: { US: [1, 2, 3, 4, 5].map((i) => t(i)), UK: [t(9)] }, tcgplayer: [t(11), t(12)] };
  const us = bannerSides(ads, "US");
  assert.equal(us.ebay?.length, BANNER_MAX);
  assert.equal(us.tcgplayer?.length, 2);
  const uk = bannerSides(ads, "UK");
  assert.equal(uk.ebayMarket, "US");
  assert.ok(uk.ebay!.every((x) => x.id !== 9));
  assert.equal(bannerSides({ ebay: {}, tcgplayer: [t(1)] }, "US").tcgplayer, null);
  assert.equal(bannerSides({ ebay: { US: [t(1, null), t(2)] }, tcgplayer: [] }, "US").ebay, null, "photos only");
});

test("ready when either banner has its tiles, judged on the baseline market; a kit page needs its kit tiles", () => {
  assert.ok(!inlineReady({ ebay: {}, tcgplayer: [t(1)] }, undefined));
  assert.ok(inlineReady({ ebay: {}, tcgplayer: [t(1), t(2)] }, undefined));
  assert.ok(inlineReady({ ebay: { US: [t(1), t(2)] }, tcgplayer: [] }, undefined));
  assert.ok(!inlineReady(undefined, undefined));
  assert.ok(inlineReady(undefined, [1, 2, 3]));
  assert.ok(!inlineReady(undefined, [1, 2]));
});

test("separate eBay and TCGplayer banners: calm, labelled Ad, never Amazon, tagged under their own placements, browser only with the height reserved", () => {
  const s = src("src/components/InlineAds.tsx").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.match(s, /^"use client";/);
  assert.match(s, /className="ad-pill">Ad</, "a small muted Ad label");
  assert.match(s, /className="bnr-box bnr"/, "the site's own card");
  assert.match(s, /className="scroller bnr-tiles"/, "scrolls sideways in a narrow column");
  assert.match(s, /rel="sponsored nofollow noopener"/);
  for (const tag of ["banner-ebay", "banner-tcg", "banner-ebay-all", "banner-tcg-all"]) assert.match(s, new RegExp("-" + tag + "`"), tag);
  assert.doesNotMatch(s, /amazon/i, "never Amazon");
  assert.doesNotMatch(s, /fixed|sticky|#[0-9a-f]{3,6}|EbayWord|best|cheapest/i, "nothing floating, no brand colours, never 'best'");
  assert.match(s, /aria-hidden="true" className="bnr-grid"/, "nothing in the server HTML but the reserved boxes");
  assert.match(s, /data-ad="inline"/, "the phone dock yields to it");
  assert.match(readFileSync("src/app/globals.css", "utf8"), /\.bnr-box \{\s*height: 252px;/, "the height is reserved");
});

test("every /go placement of the block is new, and the quick view never carries it", () => {
  assert.doesNotMatch(src("src/components/QuickView.tsx"), /InlineAds/);
  assert.doesNotMatch(src("src/components/CardBuy.tsx"), /InlineAds/);
});

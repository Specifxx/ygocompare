// The ONE in-content ad block (owner, 2026-11-13): which tiles, in which order, with which tags, and that it stays quiet, native
// and out of the server HTML. components/InlineAds.tsx, lib/inline-ads.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { INLINE_H, INLINE_MAX, INLINE_MIN, inlineReady, pickInline } from "@/lib/inline-ads";
import type { AdTile, CardAds } from "@/lib/card-ads";

const t = (id: number, image: string | null = "x.jpg"): AdTile => ({ id, slug: `s${id}`, name: `Product ${id}`, image, cents: 1000, currency: "USD", url: "https://www.ebay.com/itm/1", ref: null });
const src = (f: string) => readFileSync(f, "utf8");

test("eBay and TCGplayer take turns, eBay first, at most six, photos only", () => {
  const ads: CardAds = { ebay: { US: [1, 2, 3, 4].map((i) => t(i)) }, tcgplayer: [11, 12, 13, 14].map((i) => t(i)) };
  const { tiles } = pickInline(ads, "US");
  assert.equal(tiles.length, INLINE_MAX);
  assert.deepEqual(tiles.map((x) => x.source), ["ebay", "tcgplayer", "ebay", "tcgplayer", "ebay", "tcgplayer"]);
  const noPhoto: CardAds = { ebay: { US: [t(1, null), t(2), t(3)] }, tcgplayer: [] };
  assert.deepEqual(pickInline(noPhoto, "US").tiles.map((x) => x.tile.id), [2, 3]);
});

test("one side thin: the other fills the row; a thin local market falls back to eBay US", () => {
  const ads: CardAds = { ebay: { US: [1, 2, 3, 4, 5].map((i) => t(i)), UK: [t(9)] }, tcgplayer: [t(11)] };
  assert.equal(pickInline(ads, "US").tiles.length, 6);
  const uk = pickInline(ads, "UK");
  assert.equal(uk.ebayMarket, "US");
  assert.ok(uk.tiles.length >= INLINE_MIN);
  assert.ok(pickInline(ads, "UK").tiles.every((x) => x.source === "tcgplayer" || x.tile.id !== 9));
});

test("ready only with enough tiles, judged on the baseline market; a kit page needs its kit tiles", () => {
  assert.ok(!inlineReady({ ebay: {}, tcgplayer: [t(1), t(2)] }, undefined));
  assert.ok(inlineReady({ ebay: { US: [t(1), t(2)] }, tcgplayer: [t(3)] }, undefined));
  assert.ok(!inlineReady(undefined, undefined));
  assert.ok(inlineReady(undefined, [1, 2, 3]));
  assert.ok(!inlineReady(undefined, [1, 2]));
});

test("native, calm, labelled Ad, eBay and TCGplayer only, tagged under its own placements, browser only with its height reserved", () => {
  const s = src("src/components/InlineAds.tsx").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.match(s, /^"use client";/);
  assert.match(s, /className="ad-pill">Ad</, "a small muted Ad label");
  assert.match(s, /className="card p-4"/, "the site's own card");
  assert.match(s, /className="scroller /, "scrolls sideways in a narrow column");
  assert.match(s, /rel="sponsored nofollow noopener"/);
  for (const tag of ["inline-ebay", "inline-tcg", "inline-ebay-all", "inline-tcg-all"]) assert.match(s, new RegExp("-" + tag + "`"), tag);
  assert.doesNotMatch(s, /amazon/i, "never Amazon");
  assert.doesNotMatch(s, /fixed|sticky|#[0-9a-f]{3,6}|EbayWord/i, "nothing floating, no brand colours");
  assert.match(s, /if \(!mounted\) return <div aria-hidden="true" style=\{box\} \/>;/, "nothing in the server HTML but the reserved box");
  assert.match(s, /minHeight: INLINE_H/);
  assert.equal(INLINE_H, 368);
  assert.match(s, /data-ad="inline"/, "the phone dock yields to it");
});

test("every /go placement of the block is new, and the quick view never carries it", () => {
  assert.doesNotMatch(src("src/components/QuickView.tsx"), /InlineAds/);
  assert.doesNotMatch(src("src/components/CardBuy.tsx"), /InlineAds/);
});

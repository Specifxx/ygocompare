import { test } from "node:test";
import assert from "node:assert/strict";
import type { Offer, Product } from "@/lib/site-types";
import { cleanEbayUrl, selectCardAds, topUp, type AdRow } from "@/lib/card-ads";
import { summarize } from "@/lib/price-store";
import { readFileSync } from "node:fs";

const p = (id: number, over: Partial<Product> = {}): Product => ({ id, slug: `c-${id}`, name: `Card ${id}`, kind: "card", setId: 1, number: null, rarity: null, attrs: {}, sealedType: null, image: `https://tcgplayer-cdn.tcgplayer.com/product/${id}_200w.jpg`, tcgUrl: "", printings: [], ...over });
const ebay = (market: "US" | "UK" | "AU", cents: number, extra: Partial<Offer> = {}): Offer => ({ source: "ebay", market, currency: { US: "USD", UK: "GBP", AU: "AUD" }[market], cents, inStock: true, url: `https://www.ebay.com/itm/${cents}?hash=x&customid=old`, title: "", ...extra });
const tcg: Offer = { source: "tcgplayer", market: "US", currency: "USD", cents: 900, inStock: true, url: "https://www.tcgplayer.com/product/1", title: "" };
const row = (prod: Product, ref: number | null, ebays: Offer[], setRank = 0, t: Offer | null = tcg): AdRow => ({ p: prod, ref, ebay: ebays, tcgplayer: t, setRank });

test("tiles are real products by value, newest sets first, per eBay market", () => {
  const ads = selectCardAds([
    row(p(1), 5000, [ebay("US", 4500)], 5),
    row(p(2), 2000, [ebay("US", 1900), ebay("UK", 1500)], 0),
    row(p(3), 9000, [ebay("US", 8000)], 1),
  ]);
  assert.deepEqual(ads.ebay.US!.map((t) => t.id), [3, 2, 1]);
  assert.deepEqual(ads.ebay.UK!.map((t) => [t.id, t.currency]), [[2, "GBP"]]);
  assert.equal(ads.ebay.US![0].url, "https://www.ebay.com/itm/8000");
  // TCGplayer tiles show the market price, not the cheapest listing.
  assert.deepEqual(ads.tcgplayer.map((t) => [t.id, t.cents]), [[3, 9000], [2, 2000], [1, 5000]]);
});

test("no photo, inserts, the page's own product and cheap cards stay out", () => {
  const ads = selectCardAds(
    [row(p(1, { image: null }), 5000, [ebay("US", 1)]), row(p(2, { sealedType: "Insert", kind: "sealed" }), 5000, [ebay("US", 1)]), row(p(3), 5000, [ebay("US", 1)]), row(p(4), 50, [], 0)],
    { exclude: 3 },
  );
  assert.deepEqual(ads.ebay, {});
  assert.deepEqual(ads.tcgplayer, []);
});

test("a thin set is topped up without repeating a product", () => {
  const a = selectCardAds([row(p(1), 5000, [ebay("US", 4000)])], { setId: 1 });
  const b = selectCardAds([row(p(1), 5000, [ebay("US", 4000)]), row(p(9, { setId: 2 }), 3000, [ebay("US", 2500)])]);
  assert.deepEqual(topUp(a, b, 10).ebay.US!.map((t) => t.id), [1, 9]);
});

test("the summary keeps the cheapest in-stock eBay listing per market, never a pre-order", () => {
  const s = summarize({ tcg: {}, change7d: null, change30d: null, offers: [ebay("US", 900), ebay("US", 700), ebay("UK", 500, { inStock: false }), ebay("AU", 300, { preorder: true })] });
  assert.deepEqual(s.e?.map((t) => [t[1], t[6]]), [[700, "US"]]);
});

test("eBay item links lose their old tracking; /go tags them again", () => {
  assert.equal(cleanEbayUrl("https://www.ebay.co.uk/itm/Some-title/123456?mkevt=1&customid=x"), "https://www.ebay.co.uk/itm/123456");
  assert.equal(cleanEbayUrl("https://www.ebay.com/sch/i.html?_nkw=x"), "https://www.ebay.com/sch/i.html?_nkw=x");
});

test("the ads are ONE native horizontal block per page (owner, 2026-11-13); the quick view keeps its small pair; no rails, no strips", () => {
  const read = (f: string) => readFileSync(f, "utf8");
  assert.match(read("src/components/QuickView.tsx"), /<CompactCardAds /);
  assert.match(read("src/app/layout.tsx"), /<DockAds ads=\{cardAds\(/);
  assert.doesNotMatch(read("src/app/layout.tsx"), /SideAds/);
  for (const [f, page] of [["src/app/page.tsx", "home"], ["src/app/card/[slug]/page.tsx", "card"], ["src/app/sets/[slug]/page.tsx", "set"], ["src/app/sealed/page.tsx", "sealed"], ["src/app/sealed/[type]/page.tsx", "sealed-type"], ["src/app/kit/[slug]/page.tsx", "kit"], ["src/app/kits/page.tsx", "kits"], ["src/app/kits/grade/[grade]/page.tsx", "kit-grade"]] as const) {
    const src = read(f);
    assert.equal(src.match(/<InlineAds /g)?.length, 1, `${f}: exactly one block`);
    assert.match(src, new RegExp(`page="${page}"`), f);
    assert.doesNotMatch(src, /CompactCardAds|CompactKitAds|KitEbayStrip|LandingAds|SideAds/, f);
  }
  // Below the price table, never above a price: after the "Compare prices" section on a card and a kit page.
  for (const f of ["src/app/card/[slug]/page.tsx", "src/app/kit/[slug]/page.tsx"]) {
    const src = read(f);
    assert.ok(src.indexOf("<InlineAds ") > src.indexOf("<PriceTable"), `${f}: below the price table`);
  }
  // Not in the hero: after the deals on the home page.
  const home = read("src/app/page.tsx");
  assert.ok(home.indexOf("<InlineAds ") > home.indexOf("Today's top deals"));
  assert.doesNotMatch(read("src/components/CardAds.tsx"), /export function (EbayCardStrip|TcgplayerCardStrip|CardAdPair)/);
  for (const f of ["src/components/InlineAds.tsx", "src/components/DockAds.tsx"]) assert.match(read(f), /"use client"/, f);
});

test("the Amazon strip: only when asked, only products with a real ASIN, no price, tagged amazon.com link", () => {
  const rows = [
    { ...row(p(1), 5000, [ebay("US", 4500)]), asin: "B012345678" },
    row(p(2), 9000, [ebay("US", 8000)]),
    { ...row(p(3), 2000, []), asin: "not-an-asin" },
  ];
  assert.equal(selectCardAds(rows).amazon, undefined);
  const ads = selectCardAds(rows, { amazon: true });
  assert.deepEqual(ads.amazon!.map((t) => t.id), [1]);
  assert.equal(ads.amazon![0].cents, 0);
  assert.match(ads.amazon![0].url, /^https:\/\/www\.amazon\.com\/dp\/B012345678\?tag=/);
  // Nothing asks for it any more (owner, 2026-11-12/13): not the card page, the quick view, the layout or the inline block.
  for (const f of ["src/app/card/[slug]/page.tsx", "src/app/api/quick/[slug]/route.ts", "src/app/layout.tsx"]) assert.doesNotMatch(readFileSync(f, "utf8"), /amazon: true/, f);
});

test("Amazon's row only for products Amazon carries (owner, 2026-11-12)", async () => {
  const { amazonCarries } = await import("@/lib/amazon-live");
  for (const t of ["Booster Box", "Booster Pack", "Starter Deck", "Tin", "Collection"]) assert.equal(amazonCarries({ id: 987654321, sealedType: t }), true, t);
  for (const t of ["Case", "Prerelease", "Insert", "Other", "Starter Deck Display", null]) assert.equal(amazonCarries({ id: 987654321, sealedType: t }), false, String(t));
});

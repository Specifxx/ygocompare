// SEO audit (2026-11-03): descriptive alt text on every product photo, the brand on the homepage title,
// an ItemList of the homepage's products, ItemLists on set and sealed hubs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(p, "utf8");
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

test("no page or component draws a photo with empty alt text (share images and the quick view aside)", () => {
  for (const f of walk("src").filter((f) => /\.(tsx|ts)$/.test(f) && !f.includes("opengraph-image") && !f.endsWith("QuickView.tsx"))) {
    assert.ok(!/<img[^>]*alt=""/.test(read(f)), f);
  }
});

test("the homepage title tries every candidate with the brand before any without", () => {
  const src = read("src/app/page.tsx");
  const ladder = src.match(/fitTitle\(\[([^\]]+)\]\)/)![1].split("`,").map((s) => s.includes("${brand}"));
  const firstBare = ladder.indexOf(false);
  assert.ok(firstBare > 0 && ladder.slice(firstBare).every((b) => !b), String(ladder));
});

test("homepage, set and sealed hubs list their products as an ItemList", () => {
  for (const f of ["src/app/page.tsx", "src/app/sets/[slug]/page.tsx", "src/app/sealed/[type]/page.tsx"]) assert.match(read(f), /"ItemList"/, f);
});

// Zero-data card pages are noindex,follow; priced or listed ones (and every card of an
// upcoming set) are indexed; JSON-LD prices carry a priceValidUntil of tomorrow.
test("card pages with no price and no listing are kept out of the index", async () => {
  const { cardIndexable, priceValidUntil } = await import("../src/lib/indexing");
  const card = { kind: "card" as const, sealedType: null };
  assert.equal(cardIndexable(card, null, 0, { upcoming: false }), false);
  assert.equal(cardIndexable(card, 250, 0, { upcoming: false }), true);
  assert.equal(cardIndexable(card, null, 1, { upcoming: false }), true);
  assert.equal(cardIndexable(card, null, 0, { upcoming: true }), true);
  assert.equal(cardIndexable({ kind: "sealed", sealedType: "Insert" }, 5000, 3, { upcoming: false }), false);
  assert.equal(priceValidUntil(Date.UTC(2026, 10, 4, 12)), "2026-11-05");
  const src = read("src/app/card/[slug]/page.tsx");
  assert.match(src, /cardIndexable\(/);
  assert.match(src, /priceValidUntil: priceValidUntil\(\)/);
});

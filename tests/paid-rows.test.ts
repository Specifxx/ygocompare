// Owner, 2026-11-12: "we just want eBay and TCGplayer as the paid links at the top". Source guards: fail the build if a
// pinned Fetch row, an unpriced Amazon row or an Amazon rail/strip comes back.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f: string) => readFileSync(new URL(`../src/components/${f}`, import.meta.url), "utf8");

test("the Amazon row needs a real price: no price, no row", () => {
  const s = read("PriceTable.tsx");
  assert.match(s, /const amazonRow = amazonUrl && amazonLive \?/);
  assert.doesNotMatch(s, /Check Amazon|Also check on Amazon/);
});

test("Fetch TCG is an ordinary store row: not pinned, no Ad or Marketplace tag", () => {
  const s = read("PriceTable.tsx");
  assert.doesNotMatch(s, /PIN_OUTLINE\.fetch/);
  const m = s.match(/data-fetch-row[\s\S]{0,1500}/);
  if (m) assert.doesNotMatch(m[0], />Marketplace<|>Ad</);
});

test("the side rails and photo strip carry eBay and TCGplayer only, never Amazon", () => {
  assert.doesNotMatch(read("SideAds.tsx"), /source: "amazon"/);
  assert.match(read("CardAds.tsx"), /const showAmazon = false as boolean;/);
});

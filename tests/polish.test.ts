// The 2026-11-14 polish pass (DECISIONS.md): the faults it fixed stay fixed.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { shortDate } from "../src/lib/format";
import { marketInSentence } from "../src/lib/site-types";

const read = (p: string) => readFileSync(p, "utf8");

test("the search box never sends Enter to a page that ignores the words, and says so when nothing matches", () => {
  const src = read("src/components/SearchBox.tsx");
  assert.ok(!/\/cards\?q=|\/sealed\?q=/.test(src), "there is no search results page: Enter must not load an unfiltered hub");
  assert.match(src, /Nothing matches/);
  for (const href of ["/sealed", "/sets", "/tools/deal-finder"]) assert.ok(src.includes(`href="${href}"`), `the empty state offers ${href}`);
});

test("the price chart writes its figures as page text, not inside the scaled drawing", () => {
  const src = read("src/components/PriceChart.tsx");
  assert.ok(!src.includes("<text"), "text inside the SVG shrinks with it (5px on a phone)");
  assert.match(src, /non-scaling-stroke/);
  assert.ok(!/#[0-9a-f]{6}/i.test(src), "the line takes the theme's up and down tokens, not a fixed hex");
});

test("the focus ring keeps the element's own corners", () => {
  const css = read("src/app/globals.css");
  const rule = css.slice(css.indexOf(":focus-visible {"), css.indexOf("}", css.indexOf(":focus-visible {")));
  assert.ok(!rule.includes("border-radius"), ":focus-visible must not reshape what it rings");
});

test("the 404 page offers the search and lists that exist, and no longer speaks of single cards", () => {
  const src = read("src/app/not-found.tsx");
  assert.ok(!/Search for the card/.test(src));
  for (const href of ["/", "/sealed", "/sets"]) assert.ok(src.includes(`href="${href}"`));
});

test("dates and market names read as words", () => {
  assert.equal(shortDate("2026-11-13"), "13 Nov 2026");
  assert.equal(shortDate(null), "—");
  assert.equal(marketInSentence("US"), "the United States");
  assert.equal(marketInSentence("CA"), "Canada");
});

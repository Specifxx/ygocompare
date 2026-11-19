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

test("the price chart's axis labels never shrink with a scaled drawing", () => {
  // OP Compare's two-line chart (owner, 2026-11-19) labels its axes inside the SVG, so it draws in real pixels once the
  // wrapper is measured: a fixed viewBox would squash 11px labels to 5px on a phone.
  const src = read("src/components/PriceHistory.tsx");
  assert.match(src, /ResizeObserver/);
  assert.match(src, /viewBox=\{`0 0 \$\{W\} \$\{H\}`\}/);
  assert.match(src, /preserveAspectRatio=\{measured == null \? "none" : undefined\}/);
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

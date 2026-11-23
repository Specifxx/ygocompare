// The list pages' filter bar and the folded directories (DECISIONS.md, 2026-11-23). Source checks: what must stay true for
// crawlers, for a browser without scripts and for the CDN (one copy per URL).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "");

test("the product grid is server HTML: every tile rendered, the fold is a class, and scripts off shows them all", () => {
  const grid = src("components/FilterGrid.tsx");
  assert.doesNotMatch(grid, /^"use client"/, "FilterGrid is a server component");
  assert.match(grid, /ranked\.map\(\(p, i\) => <ProductTile/, "every product is rendered, none sliced away");
  assert.doesNotMatch(code(grid), /\.slice\(/, "no product is cut from the HTML");
  assert.match(grid, /<noscript><style>\{`\.lc-x\{display:flex!important\}/, "without scripts the folded tiles show");
  assert.match(src("app/globals.css"), /\.lc-x \{ display: none !important; \}/);
});

test("the bar only hides and orders tiles: no fetch, no navigation, no query string, the choice in the hash", () => {
  const bar = code(src("components/ListControls.tsx"));
  assert.doesNotMatch(bar, /fetch\(|useRouter|router\.|location\.(href|assign|replace)|\?\$\{|window\.open/, "nothing leaves the page");
  assert.match(bar, /history\.replaceState\(null, "", s \? `#\$\{s\}`/, "the choice is in the hash, so the CDN still holds one copy per URL");
  assert.match(bar, /classList\.toggle\("lc-x"/);
  assert.match(bar, /style\.order/);
  assert.doesNotMatch(bar, /sponsored|ebay|amazon|tcgplayer/i, "no ad in the bar");
});

test("the type pages use the bar; the sealed hub shows ten of each type, most popular first", () => {
  assert.match(src("app/sealed/[type]/page.tsx"), /<FilterGrid items=\{items\} games /);
  assert.match(src("app/sealed/page.tsx"), /<TileGrid items=\{rankProducts\(g\.items\)\.slice\(0, 10\)\} \/>/);
});

test("the sets directory keeps every link in the HTML, folded, with a finder", () => {
  for (const [file, link] of [["app/sets/page.tsx", "href={`/sets/${s.slug}`}"]] as const) {
    const page = src(file);
    assert.ok(page.includes(link), `${file}: the link is rendered for every row`);
    assert.match(page, /list\.map\(\(s, i\) =>/, `${file}: every row is rendered`);
    assert.doesNotMatch(code(page), /list\.slice\(/, `${file}: no row is cut from the HTML`);
    assert.match(page, /<noscript><style>\{`\.ff-x\{display:flex!important\}/, `${file}: without scripts every row shows`);
    assert.match(page, /<FoldFinder /);
  }
  const finder = code(src("components/FoldFinder.tsx"));
  assert.doesNotMatch(finder, /fetch\(|useRouter|location\./, "the finder never leaves the page");
});

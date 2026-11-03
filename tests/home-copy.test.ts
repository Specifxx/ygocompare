import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SITE } from "@/site.config";
import { TITLE_MAX } from "@/lib/seo-title";
import { joinList } from "@/lib/home-faq";

// SEO report, 2026-11-03: the engine sites shared one homepage title pattern, H1,
// description and FAQ word for word. Each site now writes its own (SITE.home).

test("this site has its own homepage copy", () => {
  const h = SITE.home;
  assert.ok(h, "SITE.home is set");
  assert.ok(h.description && h.description.length <= 155, `description ${h.description?.length} chars`);
  assert.ok(h.h1 && h.h1 !== "card prices, every store, one search", "own H1");
  assert.ok((h.faqs ?? []).length >= 2, "at least two questions of its own");
  for (const t of h.titles ?? []) {
    assert.ok(t.length <= TITLE_MAX, `title over ${TITLE_MAX}: ${t}`);
    assert.ok(t.endsWith(SITE.name), `brand last: ${t}`);
  }
});

test("the homepage reads SITE.home and the shared FAQ builder", () => {
  const page = readFileSync("src/app/page.tsx", "utf8");
  assert.match(page, /SITE\.home\?\.description/);
  assert.match(page, /SITE\.home\?\.h1/);
  assert.match(page, /SITE\.home\?\.titles/);
  assert.match(page, /homeFaqs\(/);
});

test("a card with nothing to compare is noindex, and its description never prints a dash or zero prices", () => {
  const card = readFileSync("src/app/card/[slug]/page.tsx", "utf8");
  assert.match(card, /hasNothingToCompare\(p\)/);
  assert.doesNotMatch(card, /Compare \$\{stores\} live prices from TCGplayer, eBay and \$\{SITE\.gameShort\} stores, with price history\.`;\n/);
  assert.match(card, /stores > 1 \?/);
  assert.match(readFileSync("src/app/sitemap.ts", "utf8"), /hasNothingToCompare\(p\)/);
});

test("joinList reads like a sentence", () => {
  assert.equal(joinList(["a"]), "a");
  assert.equal(joinList(["a", "b"]), "a and b");
  assert.equal(joinList(["a", "b", "c"]), "a, b and c");
});

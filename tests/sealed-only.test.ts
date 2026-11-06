import { test } from "node:test";
const NEXT_CONFIG = "../next.config.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SITE } from "@/site.config";
import { products, sealedOnlyCatalog, setBySlug } from "@/lib/data";
import { retiredCardTarget } from "@/lib/card-redirects";
import { sealedSets } from "@/lib/hubs";
import { POSTS } from "@/content/blog";
import sitemap from "../src/app/sitemap";

// Sealed only (owner, 2026-11-06, DECISIONS.md): no single card is shown, every old card URL 301s, and the sitemap
// lists sealed pages only.
test("the site is sealed only and the catalogue it reads has no card", () => {
  assert.equal(SITE.sealedOnly, true);
  assert.ok(products().length > 0);
  assert.ok(products().every((p) => p.kind === "sealed"));
});

test("sealedOnlyCatalog drops cards and recounts each set from its sealed products", () => {
  const card = { id: 1, slug: "a-card-ab-001", name: "A Card", kind: "card" as const, setId: 7, number: "AB-001", rarity: "Rare", attrs: {}, sealedType: null, image: null, tcgUrl: "", printings: [] };
  const box = { ...card, id: 2, slug: "first-set-booster-box", name: "First Set Booster Box", kind: "sealed" as const, number: null, rarity: null, sealedType: "Booster Box" };
  const c = sealedOnlyCatalog({ generatedAt: "", sets: [{ id: 7, name: "First Set", code: "AB", slug: "first-set", releasedOn: null, productCount: 2, upcoming: false }], products: [card, box] }, true);
  assert.deepEqual(c.products.map((p) => p.id), [2]);
  assert.equal(c.sets[0].productCount, 1);
});

test("every retired card URL goes to its set's sealed page, or /sealed; anything else is not a card", () => {
  const raw = JSON.parse(fs.readFileSync("data/redirects/cards.json", "utf8")) as { bySet: Record<string, string[]> };
  const all = Object.values(raw.bySet).flat();
  assert.ok(all.length > 10_000, "the frozen map holds every card URL");
  const has = (s: string) => sealedSets().some((x) => x.slug === s);
  const [set, slugs] = Object.entries(raw.bySet).find(([s]) => has(s))!;
  assert.equal(retiredCardTarget(slugs[0], has), `/sets/${set}`);
  const orphan = Object.entries(raw.bySet).find(([s]) => !has(s));
  if (orphan) assert.equal(retiredCardTarget(orphan[1][0], has), "/sealed");
  assert.equal(retiredCardTarget("not-a-card-at-all", has), null);
  // No sealed product's slug is in the card map, so a sealed URL never redirects.
  const cards = new Set(all);
  assert.ok(products().every((p) => !cards.has(p.slug)));
  assert.ok(setBySlug(set));
});

test("the card page redirects a retired card permanently and the redirect file ships with the functions", () => {
  const page = fs.readFileSync("src/app/card/[slug]/page.tsx", "utf8");
  assert.match(page, /permanentRedirect\(to\)/);
  assert.match(fs.readFileSync("next.config.js", "utf8"), /\.\/data\/redirects\/\*\.json/);
});

test("the sitemap lists no card, card hub or retired page", () => {
  const urls = sitemap().map((u) => new URL(u.url).pathname);
  assert.ok(urls.length > 100);
  const sealed = new Set(products().map((p) => `/card/${p.slug}`));
  for (const u of urls) {
    assert.ok(!u.startsWith("/cards"), u);
    assert.ok(!/^\/tools\/(rising|demand|best-basket|trade)$/.test(u), u);
    if (u.startsWith("/card/")) assert.ok(sealed.has(u), `${u} is not a sealed product`);
  }
  assert.ok(!urls.some((u) => products().some((p) => p.sealedType === "Insert" && u === `/card/${p.slug}`)), "no pack insert");
});

test("retired guides 301 and the kept ones still render", async () => {
  const config = (await import(NEXT_CONFIG as string)).default as { redirects: () => Promise<{ source: string; destination: string; statusCode?: number }[]> };
  const rules = await config.redirects();
  const retired = rules.filter((r) => r.source.startsWith("/blog/"));
  assert.ok(retired.length >= 17);
  for (const r of retired) {
    assert.equal(r.statusCode, 301);
    assert.ok(!POSTS.some((p) => `/blog/${p.slug}` === r.source), `${r.source} is still a post`);
  }
  const ids = new Set(products().map((p) => String(p.id)));
  for (const p of POSTS) {
    assert.doesNotMatch(p.html, /\{\{(toplist|topall|rarity|attrstats):/, p.slug);
    for (const m of p.html.matchAll(/\{\{(?:card|price):(\d+)\}\}/g)) assert.ok(ids.has(m[1]), `${p.slug} names product ${m[1]}, not a sealed product`);
  }
});

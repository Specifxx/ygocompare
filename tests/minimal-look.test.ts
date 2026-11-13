// The minimal look (owner, 2026-11-13: "we're making things too complicated … get rid of the products on the hero … cull the
// features that we show … minimalistic, dynamic, aesthetic and smooth"; DECISIONS.md, "the minimal look"). Pinned here: ONE
// navigation (no sidebar, no ad in it); a hero of words, a search and a few ways in (never a product); products straight after it,
// on one tabbed shelf whose every list is in the HTML; the reading matter folded but still an <h2> of the page; one ad block a
// page; list pages with their products first; the card that says a product in four lines; motion that is CSS only and off for
// prefers-reduced-motion; and that what a crawler reads did not move.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SITE } from "../src/site.config";
import { deals, products } from "../src/lib/data";
import { navGroups } from "../src/lib/nav";
import { shopNav } from "../src/lib/shop-nav";
import { headerNavItems } from "../src/components/Header";
import { Fold, Folds } from "../src/components/Fold";
import { Tabs } from "../src/components/Tabs";
import { DealGrid, TileGrid } from "../src/components/ProductTile";
import { Hero, HeroPill, WaysIn, riseAt } from "../src/components/home/Hero";

(globalThis as unknown as { React: typeof React }).React = React;

const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
/** A source file without its comments: a pin is about what a file does, never about the words that explain it. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const css = src("app/globals.css");
const text = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
/** Every href anywhere inside a menu, whatever its shape (a list of groups, a list of columns). */
const hrefsIn = (menu: unknown) => [...JSON.stringify(menu ?? []).matchAll(/"href":"([^"]+)"/g)].map((m) => m[1]);

function render(el: React.ReactElement): string {
  const router = { push() {}, replace() {}, refresh() {}, prefetch() {}, back() {}, forward() {} };
  const err = console.error;
  console.error = () => {};
  try {
    return renderToStaticMarkup(React.createElement(AppRouterContext.Provider, { value: router as never }, el));
  } finally {
    console.error = err;
  }
}

async function home(): Promise<string> {
  const { default: Home } = await import("../src/app/page");
  return render(React.createElement(Home));
}

test("one navigation: no sidebar, five sections at most, no ad in it, and every link the sidebar had is still in the HTML", () => {
  const layout = code(src("app/layout.tsx"));
  assert.doesNotMatch(layout, /SideNav|<aside|max-w-shell/, "no sidebar beside the page");
  assert.ok(!existsSync(new URL("../src/components/SideNav.tsx", import.meta.url)), "the sidebar is deleted, not hidden");
  const header = code(src("components/Header.tsx"));
  assert.doesNotMatch(header, /ebay|goHref/i, "no ad in the header");
  assert.doesNotMatch(code(src("components/MobileMenu.tsx")), /ebay|goHref/i, "no ad in the phone menu");
  // The phone menu is a <dialog> in the server HTML at every width, and it is handed every group the sidebar listed.
  assert.match(header, /const groups = navGroups\(\{ history, sale, preorder, shop: shop\.groups \}\);/);
  assert.match(header, /<MobileMenu groups=\{groups\} className="lg:hidden" \/>/);
  const items = headerNavItems(navGroups({ shop: [] }), shopNav().menus);
  assert.ok(items.length >= 4 && items.length <= 5, `${items.length} sections`);
  for (const i of items) assert.doesNotMatch(i.label, /ebay|friday|monday/i, `${i.label} is a section, not an ad or a sale`);
  // Everything that is not a product type or a set (deals, stores, tools, guides…) is one click away in a header menu.
  const inMenus = new Set(items.flatMap((i) => [i.href, ...hrefsIn(i.menu)]));
  for (const l of navGroups({ shop: [] }).flatMap((g) => g.links)) assert.ok(inMenus.has(l.href), `${l.href} is in a header menu`);
  // And the shopping menus hold real links: the product types and the newest sets.
  assert.ok(hrefsIn(items[0].menu).some((h) => h.startsWith("/sealed/")), "Sealed opens the product types");
  assert.ok(hrefsIn(items[1].menu).some((h) => h.startsWith("/sets/")), "Sets opens the sets");
  assert.match(readFileSync(new URL("../tailwind.config.ts", import.meta.url), "utf8"), /maxWidth: \{ page: "1200px" \}/, "one centred column");
});

test("the hero: a section of words, a pill, a search and ways in; server markup, no script of its own", () => {
  const html = render(
    React.createElement(
      Hero,
      null,
      React.createElement(HeroPill, { href: "/preorders/glorious-victors", children: "Glorious Victors pre-orders" }),
      React.createElement("h1", { className: "hero-h1 rise-solid" }, "Headline"),
      React.createElement(WaysIn, { label: "Popular pages", links: [{ href: "/sealed/booster-box", label: "Booster boxes", icon: "box" }, { href: "/tools/deal-finder", label: "Deals", icon: "tag" }] }),
    ),
  );
  assert.match(html, /^<section class="hero"><div class="hero-bg" aria-hidden="true"><\/div><div class="hero-in">/);
  assert.match(html, /<a (?=[^>]*class="hero-pill rise")(?=[^>]*href="\/preorders\/glorious-victors")[^>]*><span class="hero-pill-dot" aria-hidden="true"><\/span>Glorious Victors pre-orders/);
  assert.match(html, /<ul class="ways rise" style="--i:4" aria-label="Popular pages">/);
  assert.match(html, /<li class="flex"><a (?=[^>]*class="way flex-1")(?=[^>]*href="\/sealed\/booster-box")[^>]*><span class="way-icon" aria-hidden="true"><svg /);
  assert.equal(count(html, /class="way flex-1"/g), 2);
  assert.deepEqual(riseAt(3), { "--i": 3 });
  assert.equal(render(React.createElement(HeroPill, null, "United States")), '<p class="hero-pill rise">United States</p>');
  const hero = src("components/home/Hero.tsx");
  assert.doesNotMatch(hero, /^"use client"/, "a server component");
  assert.doesNotMatch(code(hero), /ProductTile|<img|<canvas|useEffect|useState/, "never a product, a photo, a canvas or a script");
  // Its ground is gradients only: nothing to download, nothing to decode.
  const bg = css.slice(css.indexOf("\n.hero-bg {"), css.indexOf("\n.hero-in {"));
  assert.ok(bg.length > 0);
  assert.match(bg, /radial-gradient/);
  assert.doesNotMatch(bg, /url\(/, "no image in the hero's ground");
  // The search's suggestions open over the hero's edge and the sections under it: the hero is never the box that clips them.
  assert.doesNotMatch(/\n\.hero \{[^}]*\}/.exec(css)?.[0] ?? "", /overflow/, ".hero does not clip");
});

test("Tabs: every panel is in the server HTML (a crawler reads all of them), the first chosen, the rest hidden", () => {
  const html = render(
    React.createElement(Tabs, {
      label: "Sealed products",
      tabs: [
        { label: "Booster boxes", count: 8, panel: React.createElement("a", { href: "/card/a" }, "A") },
        { label: "Pre-orders", panel: React.createElement("a", { href: "/card/b" }, "B") },
        { label: "Deals", panel: React.createElement("a", { href: "/card/c" }, "C") },
      ],
    }),
  );
  assert.match(html, /<div role="tablist" aria-label="Sealed products" class="tabs-list">/);
  assert.equal(count(html, /role="tab"/g), 3);
  assert.equal(count(html, /aria-selected="true"/g), 1);
  assert.match(html, /<button type="button" role="tab" id="[^"]+-t0" aria-selected="true" aria-controls="[^"]+-p0" tabindex="0" class="tab">Booster boxes<span class="tab-count">8<\/span><\/button>/);
  assert.equal(count(html, /role="tabpanel"/g), 3);
  assert.equal(count(html, /role="tabpanel"[^>]* hidden=""/g), 2, "the panels not chosen are hidden, not absent");
  for (const h of ["/card/a", "/card/b", "/card/c"]) assert.match(html, new RegExp(`href="${h}"`), `${h} is in the HTML`);
  assert.equal(render(React.createElement(Tabs, { label: "x", tabs: [] })), "", "no tabs, no markup");
  const tabs = src("components/Tabs.tsx");
  for (const k of ["ArrowRight", "ArrowLeft", '"Home"', '"End"', "aria-controls", "aria-labelledby"]) assert.ok(tabs.includes(k), `the WAI-ARIA tabs pattern: ${k}`);
  assert.doesNotMatch(code(tabs), /fetch\(|useEffect/, "a change of tab costs no request");
});

test("Fold: reading matter stays in the HTML as a closed <details>, its heading still an <h2> of the page", () => {
  const html = render(React.createElement(Folds, { label: "More", children: React.createElement(Fold, { id: "guides-h", title: "Guides", "data-x": "y", children: React.createElement("p", null, "Words a crawler reads.") }) }));
  assert.match(html, /^<section aria-label="More" class="mt-20 sm:mt-24 border-t border-line"><details class="fold" data-fold="guides-h" data-x="y"><summary><h2 id="guides-h">Guides<\/h2>/);
  assert.match(html, /<div class="fold-body"><p>Words a crawler reads\.<\/p><\/div><\/details>/);
  assert.doesNotMatch(html, /<details[^>]* open/, "closed until asked for");
  assert.match(render(React.createElement(Fold, { id: "x", title: "T", open: true, children: "y" })), /^<details class="fold" open=""/);
  assert.doesNotMatch(src("components/Fold.tsx"), /^"use client"|useState|onClick/m, "a native <details>: no script");
});

test("the home page in order: hero, the one shelf, the sets, one ad block, the fold, the questions; nothing the owner cut", () => {
  const page = src("app/page.tsx");
  const order = ["<Hero>", "</Hero>", "<Tabs tabs={shelfTabs}", 'title="Latest sets"', "<InlineAds", "<Folds", '<Fold id="guides-h"', "Frequently asked questions"];
  let at = -1;
  for (const k of order) {
    const i = page.indexOf(k, at + 1);
    assert.ok(i > at, `${k} comes next`);
    at = i;
  }
  const hero = code(page.slice(page.indexOf("<Hero>"), page.indexOf("</Hero>")));
  assert.doesNotMatch(hero, /ProductTile|TileGrid|DealGrid|SealedShelf|HeroCards|<img|InlineAds|EbayCallout|AdSlot/, "words, a search and ways in: no product and no ad in the hero");
  assert.match(hero, /<h1 className="hero-h1 rise-solid">\s*<span className="text-brand">\{SITE\.gameShort\}<\/span> Booster Box Prices\s*<\/h1>/, "the same headline");
  assert.match(hero, /<SearchBox big \/>/);
  assert.match(hero, /<MarketChooser /);
  assert.match(hero, /<WaysIn links=\{ways\}/);
  // What left the page, each still a page of its own in the header's menus or the footer: the product cards and the sparks in the
  // hero, the creators bubble, the reviews row, the other games' tiles and the kits block.
  assert.doesNotMatch(code(page), /HeroCards|HeroSparks|CreatorsBubble|SiteReviews|GameTiles|KitGrid|SealedHero\b|hero-band|AdSlot/);
  for (const f of ["components/SideNav.tsx", "components/SealedHero.tsx", "components/HeroSparks.tsx", "components/home/HeroCards.tsx", "components/creators/CreatorsBubble.tsx"])
    assert.ok(!existsSync(new URL(`../src/${f}`, import.meta.url)), `${f} is deleted, not hidden`);
  assert.equal(count(page, /<InlineAds/g), 1, "one ad block");
  // What a crawler is told is the page's own business: untouched by the redesign.
  assert.match(page, /export (async )?function generateMetadata|export const metadata/);
  assert.match(page, /export const revalidate = 21600;/);
});

test("the home page as a crawler reads it: one h1, every shelf list and the fold in the HTML, valid JSON-LD, no ad in the server HTML", async () => {
  const html = await home();
  assert.equal(count(html, /<h1[ >]/g), 1, "one h1");
  assert.equal(text(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? ""), `${SITE.gameShort} Booster Box Prices`, "the same headline");
  const heroAt = html.indexOf('<section class="hero">');
  assert.ok(heroAt > 0);
  assert.doesNotMatch(html.slice(0, heroAt).replace(/<script[\s\S]*?<\/script>/g, ""), /<(a|img|h2|section)[ >]/, "nothing but structured data comes before the hero");
  const hero = html.slice(heroAt, html.indexOf("</section>", heroAt));
  assert.doesNotMatch(hero, /href="\/card\/|pc-link|<img|data-qv|<canvas/, "no product, no photo and no ad in the hero");
  assert.match(hero, /role="search"/);
  assert.match(hero, /role="group" aria-label="Choose your region"/, "the market control");
  // Four to six ways in, each a hub of the site, the three that are not a product type always there.
  const ways = [...hero.matchAll(/<a (?=[^>]*class="way flex-1")[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ways.length >= 4 && ways.length <= 6, `${ways.length} ways in`);
  for (const w of ways) assert.match(w, /^\/(sealed\/[a-z-]+|preorders|tools\/deal-finder|sets)$/, w);
  for (const w of ["/preorders", "/tools/deal-finder", "/sets"]) assert.ok(ways.includes(w), `${w} is a way in`);
  // The shelf: every list's products are in the HTML whichever tab is chosen.
  const tabs = [...html.matchAll(/role="tab"[^>]*>([^<]+)/g)].map((m) => m[1]);
  assert.equal(tabs[0], "Booster boxes");
  const panels = html.split('role="tabpanel"').slice(1);
  assert.equal(panels.length, tabs.length);
  assert.equal(count(html, /role="tabpanel"[^>]* hidden=""/g), tabs.length - 1, "the lists not chosen are hidden, not absent");
  for (const [i, p] of panels.entries()) assert.ok(count(p, /href="\/card\/[a-z0-9-]+"/g) >= 1, `the "${tabs[i]}" list is in the HTML`);
  // Every product on the page is the minimal card, a link the quick view can open.
  assert.equal(count(html, /href="\/card\/[a-z0-9-]+"/g), count(html, /class="group pc-link"/g));
  assert.equal(count(html, /class="group pc-link"/g), count(html, /data-qv="[a-z0-9-]+"/g));
  // The outline: the shelf, the sets, then the reading matter (folded) and the questions, by their own headings.
  const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => text(m[1]));
  assert.deepEqual(h2.slice(0, 2), [`${SITE.gameShort} booster boxes and sealed`, "Latest sets"]);
  assert.equal(h2.at(-1), "Frequently asked questions");
  assert.ok(h2.length <= 5, `${h2.length} headings: a page of five blocks, not twenty`);
  assert.match(html, /<details class="fold" data-fold="guides-h"><summary><h2 id="guides-h">Guides<\/h2>/, "the guides are folded, their heading still an h2");
  assert.doesNotMatch(html, /<details class="fold"[^>]* open/, "folds start closed");
  assert.ok(count(html, /<a [^>]*href="\/blog\/[a-z0-9-]+"/g) >= 1, "the guides' links are in the HTML");
  assert.ok(count(html, /<a [^>]*href="\/sets\/[a-z0-9-]+"/g) >= 1, "the latest sets are links");
  assert.ok(count(html, /<details class="faq">/g) >= 2, "the questions open one by one");
  // Structured data: every block parses, and the page still says what it is.
  const docs = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as { "@type"?: string });
  const types = docs.map((d) => d["@type"]);
  for (const t of ["Organization", "WebSite", "ItemList", "FAQPage"]) assert.ok(types.includes(t), `${t} JSON-LD`);
  // Ads: none in the server HTML (the one block is drawn in the browser into a box of its own height), never in the hero.
  assert.doesNotMatch(html, /ebay\.[a-z.]+\/|ebayimg|rel="[^"]*sponsored/i, "no ad unit in the server HTML");
  assert.match(html, /<p class="sr-only">[\d,]+(<!-- -->)? products tracked<\/p>/);
});

test("list pages show their products first: the headline, one line, the filters, the grid, the one ad block, then the reading", () => {
  const type = src("app/sealed/[type]/page.tsx");
  const typeOrder = ["<Breadcrumbs", "<h1 ", '<nav aria-label="Other product types"', "<TileGrid", "<InlineAds"];
  let at = -1;
  for (const k of typeOrder) {
    const i = type.indexOf(k, at + 1);
    assert.ok(i > at, `type page: ${k} comes next`);
    at = i;
  }
  assert.equal(count(type, /<InlineAds/g), 1);
  assert.doesNotMatch(code(type), /Other sealed products/, "the other types are the chips under the headline, not a block under the grid");
  const set = src("app/sets/[slug]/page.tsx");
  const setOrder = ["<h1 ", "<SealedQuickBuy", "<TileGrid items={sealed} />", "<InlineAds", "<Folds", "<Fold "];
  at = -1;
  for (const k of setOrder) {
    const i = set.indexOf(k, at + 1);
    assert.ok(i > at, `set page: ${k} comes next`);
    at = i;
  }
  assert.equal(count(set, /<InlineAds/g), 1);
  const sealed = src("app/sealed/page.tsx");
  assert.ok(sealed.indexOf('<nav aria-label="Product types"') > sealed.indexOf("<h1 "), "the types are chips under the headline");
  assert.ok(sealed.indexOf("<TileGrid") > sealed.indexOf('<nav aria-label="Product types"'));
  assert.equal(count(sealed, /<InlineAds/g), 1);
});

test("the product card: a photo, a name, one stock line and a price; a badge only for a real saving; still the quick view's link", () => {
  const two = products().slice(0, 2);
  assert.equal(two.length, 2);
  const grid = render(React.createElement(TileGrid, { items: two }));
  assert.match(grid, /^<div class="pc-grid">/);
  assert.equal(count(grid, /class="group pc-link"/g), 2);
  for (const p of two) assert.match(grid, new RegExp(`<a (?=[^>]*href="/card/${p.slug}")(?=[^>]*data-qv="${p.slug}")(?=[^>]*data-qv-name=")[^>]*>`), `${p.slug} opens the quick view`);
  assert.equal(count(grid, /class="pc-name"/g), 2);
  assert.equal(count(grid, /class="pc-stock /g), 2);
  assert.equal(count(grid, /class="pc-price"/g), 2);
  assert.equal(count(grid, /pc-badge/g), 0, "no badge without a saving");
  assert.match(render(React.createElement(TileGrid, { items: two, roomy: true })), /^<div class="pc-grid pc-grid-4">/);
  const d = deals(6).filter((x, i, all) => all.findIndex((y) => y.p.id === x.p.id) === i);
  if (d.length) {
    const dg = render(React.createElement(DealGrid, { items: d }));
    assert.equal(count(dg, /class="pc-badge"/g), d.length, "a deal carries its saving, once");
    assert.equal(count(dg, /class="pc-per">market /g), d.length, "and the market price it is measured against");
  }
  const tile = code(src("components/ProductTile.tsx"));
  assert.doesNotMatch(tile, /"use client"|card-surface|StockPill|pct\(|Compare /, "no frame, no pill, no 7-day figure, no cue");
  // The home shelf's cards are the same card, priced in the visitor's market, and carry only what a card draws.
  const shelf = src("components/home/SealedShelf.tsx");
  for (const k of ['className="group pc-link"', "data-qv={i.slug}", "pc-stock", "pc-price", "pc-badge"]) assert.ok(shelf.includes(k), `the shelf card: ${k}`);
  const item = /export interface HeroItem \{[\s\S]*?\n\}/.exec(src("lib/sealed-hero.ts"))?.[0] ?? "";
  assert.ok(item.length > 0);
  assert.doesNotMatch(item + (/export interface HeroPrice \{[\s\S]*?\n\}/.exec(src("lib/sealed-hero.ts"))?.[0] ?? ""), /\burl\b|\bebay\b/, "no link or eBay listing is sent that no card reads");
});

test("motion is CSS only: transforms and opacity, off for prefers-reduced-motion, and the headline is never hidden", () => {
  const motion = css.slice(css.indexOf("/* Motion."));
  assert.ok(motion.length > 0);
  // Everything that moves by itself sits inside the no-preference query (screen only: a printed page shows everything).
  const block = motion.slice(motion.indexOf("@media screen and (prefers-reduced-motion: no-preference)"), motion.indexOf("@keyframes rise "));
  for (const k of [".rise {", ".rise-solid {", ".hero-bg::before", ".reveal {"]) assert.ok(block.includes(k), `${k} only without a reduced-motion preference`);
  assert.doesNotMatch(css.replace(block, ""), /^\s*\.(rise|rise-solid|reveal) \{[^}]*animation:/m, "no entrance animation outside that query");
  // The headline moves 10px but keeps its opacity: the largest paint is not held back.
  assert.match(motion, /@keyframes rise-solid \{\s*from \{\s*transform: translateY\(10px\);\s*\}\s*\}/);
  // Scroll reveals only where the browser ties them to the scroll position itself; elsewhere the content is simply there.
  assert.match(motion, /@supports \(animation-timeline: view\(\)\) \{\s*\.reveal \{/);
  for (const k of ["rise", "rise-solid", "reveal", "drift-a", "drift-b", "hdr-line"]) {
    const kf = new RegExp(`@keyframes ${k} \\{([\\s\\S]*?)\\n\\}`).exec(motion)?.[1] ?? "";
    assert.ok(kf.length > 0, k);
    assert.doesNotMatch(kf, /\b(width|height|margin|padding|top|left|right|bottom|font-size)\s*:/, `${k} moves nothing in the layout`);
  }
  assert.match(motion, /@media \(prefers-reduced-motion: reduce\) \{\s*\.tab-panel,[\s\S]*?animation: none;[\s\S]*?transition: none;[\s\S]*?transform: none;/);
  // The header takes its line once the page moves under it, and only where the browser ties that to the scroll: no listener.
  assert.match(motion, /@media screen and \(prefers-reduced-motion: no-preference\) \{\s*@supports \(animation-timeline: scroll\(\)\) \{\s*\.hdr \{\s*animation: hdr-line linear both;\s*animation-timeline: scroll\(root\);/);
  assert.match(src("components/Header.tsx"), /<header className="hdr sticky top-0 /);
  // The old scroll motion and the hero's canvas are gone with their classes.
  assert.doesNotMatch(css, /\.sd-stagger|@keyframes sd-in|\.hero-sparks|\.hero-band/);
  // No animation library, no scroll listener, no observer for looks.
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { dependencies?: Record<string, string> };
  for (const dep of ["framer-motion", "motion", "gsap", "aos", "lottie-web", "animejs"]) assert.ok(!(dep in (pkg.dependencies ?? {})), `${dep} is not a dependency`);
  for (const f of ["components/home/Hero.tsx", "components/Fold.tsx", "components/Tabs.tsx", "components/home/SealedShelf.tsx"]) assert.doesNotMatch(src(f), /IntersectionObserver|addEventListener\("scroll"|requestAnimationFrame/, f);
});

test("a phone's page is as wide as the phone: a sideways scroller is its own containing block, and a list's column can shrink", () => {
  // A visually hidden label inside an unpositioned sideways scroller is not clipped by it and counts toward the page's width: the
  // ad block's made every page that carries it 962px wide on a 390px phone (measured 2026-11-13).
  assert.match(css, /:where\(\.scroller, \.overflow-x-auto, \.overflow-x-scroll\) \{\s*position: relative;\s*\}/);
  // A grid's own column is as wide as its longest unbroken line unless it is told it may shrink: the movers and the price report
  // were 674px wide on a phone for one long product name.
  assert.match(src("app/movers/page.tsx"), /<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">/);
  assert.match(src("app/price-report/page.tsx"), /<section className="grid grid-cols-1 gap-6 lg:grid-cols-2">/);
});

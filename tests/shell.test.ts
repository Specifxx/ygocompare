import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { navGroups, phoneNav } from "@/lib/nav";
import { isActivePath } from "@/components/NavLink";
import { MIN_WIDTH, MAX_TILES } from "@/components/DockAds";
import { ebayTilesFor } from "@/lib/inline-ads";
import type { CardAds } from "@/lib/card-ads";

// The engine's shell (2026-11-04: Gundam Compare runs the Dex / MTG Compare engine's look): one sticky header row, the phone menu
// a <dialog>, and no side rails (owner, 2026-11-13). Since the minimal look (owner, 2026-11-13: "we're making things too
// complicated") the header is the ONE navigation: the desktop sidebar is deleted and every page is one centred 1200px column.
/** A source file without its comments: these pins are about what a file does, never about the words that explain it. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("the shell is one header row over one centred column: no sidebar, no ad in the navigation, one strip at most", () => {
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  assert.doesNotMatch(layout, /max-w-shell|SideNav|navGroups|shopNav/, "no shell beside a sidebar");
  assert.ok(!existsSync("src/components/SideNav.tsx"), "the sidebar is deleted, not hidden");
  assert.match(layout, /<main id="main" className="min-w-0 flex-1">\s*<div className="page py-6">\{children\}<\/div>\s*<\/main>/);
  assert.match(layout, /<DockAds /);
  assert.doesNotMatch(layout, /sidenav-w|fonts\.googleapis/);
  // One line under the header at most: the sale's strip in its season, else the release on pre-order (its link is in the Deals menu).
  assert.match(layout, /\{holidayNav\(\) \? <HolidayStrip \/> : <PreorderStrip \/>\}/);
  const header = readFileSync("src/components/Header.tsx", "utf8");
  assert.match(header, /h-\[var\(--hdr\)\]/);
  assert.match(header, /<header className="hdr sticky top-0 /, "the header takes its line on scroll (globals.css .hdr)");
  assert.match(header, /<div className="page flex h-full items-center /, "the header's row is the page's own column");
  assert.doesNotMatch(code(header), /ebay|goHref|max-w-shell/i, "no ad in the navigation");
  assert.match(header, /preorder: NavLink|preorderNav\(\)/, "the release on pre-order is in the Deals menu");
  const menu = readFileSync("src/components/MobileMenu.tsx", "utf8");
  assert.match(menu, /<dialog/);
  assert.doesNotMatch(code(menu), /ebay|goHref|btn-ad/i, "no ad in the phone menu either");
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /--hdr: 60px/);
  assert.match(css, /:root:not\(\[data-theme="light"\]\)/);
  assert.doesNotMatch(css, /max-w-shell/);
  assert.match(readFileSync("tailwind.config.ts", "utf8"), /maxWidth: \{ page: "1200px" \}/, "one centred column");
  assert.match(css, /\.page \{\s*@apply mx-auto w-full max-w-page px-4 sm:px-6;/);
});

test("the current section is marked by whole path segments", () => {
  assert.ok(isActivePath("/sets/newtype-rising", "/sets"));
  assert.ok(isActivePath("/card/x", "/cards", ["/card"]));
  assert.ok(!isActivePath("/setsx", "/sets"));
  assert.ok(!isActivePath("/", "/cards"));
});

test("no side rails: the dock is the only fixed ad, below 1280px, and nothing narrows the page column for an ad", () => {
  assert.equal(MIN_WIDTH, 1280);
  assert.equal(MAX_TILES, 10);
  assert.ok(!existsSync("src/components/SideAds.tsx"), "the rail code is deleted");
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /rail-scroll|--rail|side-rail/, "no rail and no room kept for one (owner, 2026-11-13)");
  const t = (id: number) => ({ id, slug: `s${id}`, name: "x", image: null, cents: 100, currency: "USD", url: "https://www.ebay.com/itm/1", ref: null });
  const ads: CardAds = { ebay: { US: [t(1), t(2), t(3)], UK: [t(4)] }, tcgplayer: [] };
  assert.equal(ebayTilesFor(ads, "UK").market, "US");
  assert.equal(ebayTilesFor(ads, "US").tiles.length, 3);
});

test("every navigation link points at a page of the site, and prices come first", () => {
  const groups = navGroups();
  assert.equal(groups[0].title, "Prices");
  assert.equal(groups[groups.length - 1].title, "Guides & news");
  const hrefs = [...groups.flatMap((g) => g.links), ...phoneNav()].map((l) => l.href);
  for (const h of hrefs) {
    assert.match(h, /^\/[a-z0-9/-]+$/, h);
    const dir = `src/app${h}`;
    let ok = false;
    try {
      readFileSync(`${dir}/page.tsx`);
      ok = true;
    } catch {
      // A hub under a dynamic segment ("/games/<slug>") is pinned by its own test.
      ok = /^\/games\//.test(h) || /^\/sealed\/[a-z-]+$/.test(h);
    }
    assert.ok(ok, `${h} has no page`);
  }
  // The menus never repeat a link, and the phone row is a subset of them.
  const rail = groups.flatMap((g) => g.links).map((l) => l.href);
  assert.equal(new Set(rail).size, rail.length);
  for (const l of phoneNav()) assert.ok(l.href === "/tools" || rail.includes(l.href), `${l.href} is in the phone row but not the menus`);
  // The release on pre-order (lib/preorder-nav.ts) sits just before the pre-order hub, in the Deals menu's group.
  const pre = { href: "/preorders/some-set", label: "Some Set pre-orders" };
  const deals = navGroups({ preorder: pre, shop: [] }).find((g) => g.title === "Deals & stock")!.links.map((l) => l.href);
  assert.equal(deals[deals.indexOf("/preorders") - 1], pre.href);
  assert.ok(!navGroups({ shop: [] }).flatMap((g) => g.links).some((l) => l.href.startsWith("/preorders/")), "no release, no link");
});

// The minimal look (owner, 2026-11-13): the hero with no product, ONE tabbed shelf (the deals are one of its lists), the latest
// sets, the one ad block, then the guides folded and the questions. tests/minimal-look.test.ts reads the rendered page.
test("the homepage, in order: the hero, the one shelf, the latest sets, the one ad block, the guides folded, the FAQ, and nothing else", () => {
  const src = readFileSync("src/app/page.tsx", "utf8");
  const order = ["Today's top deals", "<Hero>", "</Hero>", "<InlineAds ", "booster boxes and sealed`}", "<Tabs tabs={shelfTabs}", 'title="Latest sets"', "<Folds ", 'title="Guides"', "Frequently asked questions"];
  let at = -1;
  for (const o of order) {
    const i = src.indexOf(o, at + 1);
    assert.ok(i > at, `${o} out of order`);
    at = i;
  }
  for (const gone of ["TOOLS", "MoverList", "Set price guides", "CreatorsTeaser", "AdSlot", "HeroSparks", "CreatorsBubble", "HeroCards", "SealedHero ", "SiteReviews", "hero-band", "KitGrid"]) assert.doesNotMatch(src, new RegExp(gone), gone);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { navGroups, phoneNav } from "@/lib/nav";
import { isActivePath } from "@/components/NavLink";
import { railFits, MIN_WIDTH, MAX_TILES, ebayTilesFor } from "@/components/SideAds";
import type { CardAds } from "@/lib/card-ads";

// The engine's shell (2026-11-04: Gundam Compare runs the Dex / MTG Compare engine's look): one sticky header row, the
// sidebar in the flow beside <main> from xl, the phone menu a <dialog>, and the side rails outside the shell only on a wide screen.
test("the shell is the engine's: header, sidebar beside main, no fixed rail variable", () => {
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  assert.match(layout, /max-w-shell/);
  assert.match(layout, /<SideNav /);
  assert.match(layout, /<main id="main" className="min-w-0 flex-1">/);
  assert.match(layout, /<SideAds /);
  assert.doesNotMatch(layout, /sidenav-w|fonts\.googleapis/);
  assert.match(readFileSync("src/components/SideNav.tsx", "utf8"), /hidden w-60 shrink-0 xl:block/);
  assert.match(readFileSync("src/components/Header.tsx", "utf8"), /h-\[var\(--hdr\)\]/);
  assert.match(readFileSync("src/components/MobileMenu.tsx", "utf8"), /<dialog/);
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /--hdr: 60px/);
  assert.match(css, /:root:not\(\[data-theme="light"\]\)/);
});

test("the current section is marked by whole path segments", () => {
  assert.ok(isActivePath("/sets/newtype-rising", "/sets"));
  assert.ok(isActivePath("/card/x", "/cards", ["/card"]));
  assert.ok(!isActivePath("/setsx", "/sets"));
  assert.ok(!isActivePath("/", "/cards"));
});

test("the side rails show on every regular 16:9 and 16:10 screen and scroll through up to ten tiles", () => {
  assert.equal(MIN_WIDTH, 1280, "owner, 2026-11-06");
  assert.equal(MAX_TILES, 10);
  assert.ok(!railFits(300), "too short for one whole tile: no rail");
  assert.ok(railFits(720), "a 1280×720 window has rails");
  const src = readFileSync(new URL("../src/components/SideAds.tsx", import.meta.url), "utf8");
  assert.match(src, /min-\[1280px\]:flex/);
  assert.match(src, /overflow-y-auto/, "the list scrolls inside the rail");
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.max-w-shell \{\s*max-width: none;\s*width: auto;\s*margin-left: 136px;\s*margin-right: 136px;/, "the shell leaves the rails their room");
  assert.match(readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8"), /cardAds\(\{ limit: 10 \}\)/);
  const t = (id: number) => ({ id, slug: `s${id}`, name: "x", image: null, cents: 100, currency: "USD", url: "https://www.ebay.com/itm/1", ref: null });
  const ads: CardAds = { ebay: { US: [t(1), t(2), t(3)], UK: [t(4)] }, tcgplayer: [] };
  assert.equal(ebayTilesFor(ads, "UK").market, "US");
  assert.equal(ebayTilesFor(ads, "US").tiles.length, 3);
});

test("every rail link points at a page of the site, and prices come first", () => {
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
  // The rail never repeats a link, and the phone row is a subset of the rail.
  const rail = groups.flatMap((g) => g.links).map((l) => l.href);
  assert.equal(new Set(rail).size, rail.length);
  for (const l of phoneNav()) assert.ok(l.href === "/tools" || rail.includes(l.href), `${l.href} is in the phone row but not the rail`);
});

test("the homepage is RiftCompare's order: hero, ads, deals, sealed, the newest set's sealed, reviews, guides, FAQ, and nothing else", () => {
  const src = readFileSync("src/app/page.tsx", "utf8");
  const order = ["<HeroSparks />", "<CreatorsBubble />", "<LandingAds ", "Today's top deals", "<SealedHero", "booster boxes and sealed`}", "<SiteReviews />", 'title="Guides"', "Frequently asked questions"];
  let at = -1;
  for (const o of order) {
    const i = src.indexOf(o, at + 1);
    assert.ok(i > at, `${o} out of order`);
    at = i;
  }
  for (const gone of ["TOOLS", "MoverList", "Set price guides", "CreatorsTeaser", "AdSlot"]) assert.doesNotMatch(src, new RegExp(gone), gone);
});

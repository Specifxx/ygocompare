import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { navGroups, phoneNav } from "@/lib/nav";

// The left rail (components/SideNav.tsx, owner 2026-11-03) and the room the
// page keeps for it: the CSS variable and the layout's padding must agree, and
// every link the rail shows must be a page that exists.
test("the rail's width is one variable, read by the layout and the rail alike", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /--sidenav-w: 0px/);
  assert.match(css, /@media \(min-width: 1024px\) \{ :root \{ --sidenav-w: 15rem; \} \}/);
  assert.match(readFileSync("src/app/layout.tsx", "utf8"), /lg:pl-\[var\(--sidenav-w\)\]/);
  assert.match(readFileSync("src/components/SideNav.tsx", "utf8"), /w-\[var\(--sidenav-w\)\]/);
  assert.match(readFileSync("src/components/SideNav.tsx", "utf8"), /hidden .*lg:flex/);
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
      ok = /^\/games\//.test(h);
    }
    assert.ok(ok, `${h} has no page`);
  }
  // The rail never repeats a link, and the phone row is a subset of the rail.
  const rail = groups.flatMap((g) => g.links).map((l) => l.href);
  assert.equal(new Set(rail).size, rail.length);
  // (/tools, the index the phone row links, is one page for the rail's whole "Free tools" group.)
  for (const l of phoneNav()) assert.ok(l.href === "/tools" || rail.includes(l.href), `${l.href} is in the phone row but not the rail`);
});

test("the homepage is RiftCompare's order: hero, deals, sealed, chase cards, reviews, guides, FAQ, and nothing else", () => {
  const src = readFileSync("src/app/page.tsx", "utf8");
  const order = ["<HeroSparks />", "<CreatorsBubble />", "Today's top deals", "<SealedHero", "chase cards", "<SiteReviews />", 'title="Guides"', "Frequently asked questions"];
  let at = -1;
  for (const o of order) {
    const i = src.indexOf(o, at + 1);
    assert.ok(i > at, `${o} out of order`);
    at = i;
  }
  for (const gone of ["TOOLS", "MoverList", "Set price guides", "CreatorsTeaser", "AdSlot"]) assert.doesNotMatch(src, new RegExp(gone), gone);
});

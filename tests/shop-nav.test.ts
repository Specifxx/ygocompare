import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { navGroups } from "@/lib/nav";
import { shopNav } from "@/lib/shop-nav";
import { sealedHubs, sealedSets } from "@/lib/hubs";

// Navigation by product type and set (owner, 2026-11-09): the header dropdowns, the sidebar's shop groups and the phone menu read
// one list, built from the hubs that exist, so nothing links a page with no products.
test("every shop link is a hub that exists, and the sidebar lists every dropdown link", () => {
  const s = shopNav();
  const hubs = new Set<string>(["/sealed", "/sets"]);
  for (const h of sealedHubs()) hubs.add(`/sealed/${h.slug}`);
  const setSlugs = new Set(sealedSets().map((x) => `/sets/${x.slug}`));
  const menu = [...s.menus.sealed, ...s.menus.sets].flatMap((g) => g.links);
  const rail = navGroups({ shop: s.groups }).flatMap((g) => g.links).map((l) => l.href);
  for (const l of [...menu, ...s.groups.flatMap((g) => g.links)]) assert.ok(hubs.has(l.href) || setSlugs.has(l.href), `${l.href} is not a hub`);
  for (const l of menu) assert.ok(rail.includes(l.href), `${l.href} is in a dropdown but not the sidebar`);
  assert.equal(new Set(rail).size, rail.length, "the sidebar repeats a link");
  assert.equal(navGroups({ shop: s.groups })[0].title, "Sealed by type");
});

test("the dropdowns are server HTML and the phone menu reads the same groups", () => {
  const header = readFileSync("src/components/Header.tsx", "utf8");
  assert.match(header, /shopNav\(\)/);
  assert.match(header, /<MobileMenu groups=\{groups\}/);
  assert.doesNotMatch(readFileSync("src/components/HeaderNav.tsx", "utf8"), /useState/);
});

test("the search finds a product by its set code", () => {
  assert.match(readFileSync("src/app/api/search/route.ts", "utf8"), /setById\(p\.setId\)\?\.code/);
});

// Owner, 2026-11-09: every dropdown is one shared mega menu (components/NavMenu.tsx), and Deals & stock has its own.
test("header: Deals opens a dropdown of real links, seven items at most, and NavMenu has hover intent, Escape, arrows and aria", async () => {
  const { headerNavItems } = await import("@/components/Header");
  const items = headerNavItems(navGroups({ shop: [] }), shopNav().menus, null);
  assert.ok(items.length <= 7, items.map((i) => i.label).join());
  const deals = items.find((i) => i.label === "Deals");
  assert.ok(deals?.menu?.[0]?.links.length, "Deals has a dropdown");
  assert.ok(deals!.menu!.flatMap((c) => c.links).some((l) => l.href === "/tools/deal-finder"));
  const src = readFileSync(new URL("../src/components/NavMenu.tsx", import.meta.url), "utf8");
  for (const needle of ["OPEN_MS", "CLOSE_MS", 'e.key === "Escape"', "ArrowDown", "aria-expanded", "aria-controls", "pointerdown", "onBlur", "usePathname"]) assert.ok(src.includes(needle), needle);
});

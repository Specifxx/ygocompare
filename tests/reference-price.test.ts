import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { referenceCents } from "@/lib/import/tcgcsv";

// A card's headline price is what it SELLS for (TCGplayer's market price), never
// one seller's asking price (mid or low with nothing sold). With the fallback,
// a $28,000 ask on a serial-numbered card topped every "most valuable" list,
// trending row and set value, and visitors called the site made up
// (BandaiCompare, 2026-11-03).
test("the reference price is TCGplayer's market price only", () => {
  assert.equal(referenceCents({ Normal: { market: 982, low: 1000, mid: 1400 } }), 982);
  assert.equal(referenceCents({ Foil: { market: null, low: 2800000, mid: 2800000 } }), null);
  assert.equal(referenceCents({ Normal: { market: null, low: 500, mid: 600 }, Foil: { market: 250, low: 200, mid: 300 } }), 250);
  assert.equal(referenceCents(undefined), null);
});

test("deals come from stores, never eBay rows, and history pages hide until there is history", async () => {
  const data = readFileSync("src/lib/data.ts", "utf8");
  assert.match(data, /o\.source === "ebay"/, "deals() must skip eBay offers");
  assert.match(data, /export function historyOn/);
  const tools = readFileSync("src/lib/tools.ts", "utf8");
  assert.match(tools, /o\.source === "ebay"/, "dealRows() must skip eBay offers");
  const nav = readFileSync("src/lib/nav.ts", "utf8");
  for (const h of ["/movers", "/tools/rising", "/price-report"]) assert.ok(nav.includes(`"${h}"`), `${h} is gated on history in nav.ts`);
  const { navGroups, phoneNav } = await import("@/lib/nav");
  const links = (o: { history?: boolean }) => [...navGroups(o).flatMap((g) => g.links), ...phoneNav(o)].map((l) => l.href);
  assert.ok(!links({ history: false }).some((h) => h === "/movers" || h === "/tools/rising" || h === "/price-report"));
  assert.ok(links({ history: true }).includes("/movers"));
});

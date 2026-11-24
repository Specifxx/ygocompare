// The owner's UX review (2026-11-23), ported from DexCompare: what the code must keep doing. DECISIONS.md, 2026-11-24.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MAX_POPUPS, popupDue } from "../src/lib/ad-heavy";
import { isTypingTarget } from "../src/lib/visitor-busy";

const read = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");

test("P0 1: the heavy pop-up opens at most once a visit, never on the landing page", () => {
  assert.equal(MAX_POPUPS, 1);
  assert.equal(popupDue(1, 0), false, "never the landing page");
  assert.equal(popupDue(2, 0), true);
  assert.equal(popupDue(5, 0), true, "a page skipped while typing may try later");
  assert.equal(popupDue(5, 1), false, "once a visit");
});

test("P0 1: nothing self-opening fires while the visitor types, and the slide-in is gone", () => {
  for (const f of ["src/components/heavy/HeavyAds.tsx", "src/components/account/SignInCorner.tsx", "src/components/site-reviews/RateCard.tsx"]) {
    assert.match(read(f), /visitorBusy\(\)/, f);
  }
  const heavy = read("src/components/heavy/HeavyAds.tsx");
  assert.match(heavy, /claimPromptSlot\("heavy-popup"\)/, "the pop-up takes the visit's one prompt slot");
  assert.doesNotMatch(heavy, /data-heavy-slide/, "no floating card over the content");
  assert.equal(isTypingTarget(null), false);
});

test("P0 2: two imports a day, and an alarm when the data is over 12 hours old", () => {
  const wf = read(".github/workflows/refresh-prices.yml");
  assert.match(wf, /cron: "17 12 \* \* \*"/);
  assert.match(wf, /cron: "17 0 \* \* \*"/);
  const fresh = read(".github/workflows/freshness.yml");
  assert.match(fresh, /data_h" -ge 12/);
  assert.match(fresh, /gh workflow run refresh-prices.yml -f ebay=false/, "a restart never spends eBay calls twice");
});

test("P0 3: listings sort by % under market and filter by set, era, edition and price", () => {
  const lc = read("src/components/ListControls.tsx");
  for (const k of ['"under"', '"lo"', '"hi"', '"new"']) assert.ok(lc.includes(k), k);
  for (const k of ["setSet", "setEra", "setEd", "setBand"]) assert.ok(lc.includes(k), k);
  assert.match(read("src/app/sets/[slug]/page.tsx"), /<FilterGrid items=\{sealed\}/);
});

test("P1 10: on the product page the stores lead and the marketplaces sit in a labelled block below", () => {
  const t = read("src/components/PriceTable.tsx");
  assert.match(t, /const below = !compact && !maxRows/);
  assert.match(t, /data-marketplaces/);
  assert.ok(t.indexOf("{storeRows.map(") < t.indexOf("{marketRows.map("), "stores before marketplaces");
});

test("P1 12: the cart is the Shortlist and says we sell nothing", () => {
  assert.match(read("src/components/cart/CartDrawer.tsx"), /We sell nothing/);
  assert.doesNotMatch(read("src/components/cart/CartAddButton.tsx"), /Add to cart"/);
});

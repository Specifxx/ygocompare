// The return nudge (lib/return-nudge.ts, components/ReturnNudge.tsx; owner 2026-11-18). Pinned: only after a store click, once, the "on" arm only,
// never Amazon, the same product's links only, and the nudge's own placement tag.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isStoreClick, nudgeEligible, nudgeHref, nudgeShows, parseGo, pickArm, pickPaidLinks, NUDGE_MIN_AWAY_MS, NUDGE_WINDOW_MS, type NudgeState } from "../src/lib/return-nudge";

const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
const ok: NudgeState = { arm: "on", clickedAt: 1000, now: 60_000, awayMs: 10_000, shownBefore: false, blocked: false, hasLinks: true };

test("it shows only after a store click, a real absence, once, in the on arm, with links and nothing in the way", () => {
  assert.ok(nudgeShows(ok));
  assert.ok(!nudgeShows({ ...ok, clickedAt: 0 }), "no store click, no nudge (a new visitor never sees it)");
  assert.ok(!nudgeShows({ ...ok, awayMs: NUDGE_MIN_AWAY_MS - 1 }), "a tab flick is not a visit elsewhere");
  assert.ok(!nudgeShows({ ...ok, now: 1000 + NUDGE_WINDOW_MS + 1 }), "stale");
  assert.ok(!nudgeShows({ ...ok, shownBefore: true }), "once a session");
  assert.ok(!nudgeShows({ ...ok, arm: "off" }), "the control arm sees nothing");
  assert.ok(nudgeEligible({ ...ok, arm: "off" }), "but is counted as eligible, so the arms compare");
  assert.ok(!nudgeShows({ ...ok, blocked: true }));
  assert.ok(!nudgeShows({ ...ok, hasLinks: false }));
  assert.equal(pickArm(0.49), "on");
  assert.equal(pickArm(0.5), "off");
});

test("a store click is a /go link for a product whose source pays nothing; links come from the same product, never Amazon", () => {
  assert.ok(isStoreClick(parseGo("/go?u=https%3A%2F%2Fs.com&s=somestore&m=US&p=12&from=card_row")));
  assert.ok(!isStoreClick(parseGo("/go?u=x&s=ebay&m=US&p=12")));
  assert.ok(!isStoreClick(parseGo("/go?u=x&s=somestore&m=US")), "needs a product");
  const hrefs = ["/go?u=a&s=amazon&m=US&p=12", "/go?u=b&s=ebay&m=US&p=99", "/go?u=c&s=ebay&m=US&p=12&from=card_pinned_search", "/go?u=d&s=tcgplayer&m=US&p=12"];
  assert.deepEqual(pickPaidLinks(hrefs, "12"), { ebay: hrefs[2], tcg: hrefs[3] });
});

test("the nudge's links keep their tags and add the placement suffix once", () => {
  const h = nudgeHref("/go?u=c&s=ebay&m=US&p=12&from=card_pinned_search&r=1");
  assert.match(h, /from=card_pinned_search_nudge/);
  assert.match(h, /s=ebay/);
  assert.equal(nudgeHref(h), h);
});

test("the component and the click log carry the arm, and it is mounted once in the layout", () => {
  assert.match(src("components/ReturnNudge.tsx"), /track\("nudge_eligible"/);
  assert.match(src("components/ReturnNudge.tsx"), /\[data-rate-card\]/);
  assert.match(src("components/BuyClickTracker.tsx"), /nudge_arm/);
  assert.match(src("app/layout.tsx"), /<ReturnNudge \/>/);
  assert.doesNotMatch(src("components/ReturnNudge.tsx"), /amazon/i);
});

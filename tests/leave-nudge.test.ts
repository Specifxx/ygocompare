// The leave nudge (lib/leave-nudge.ts, components/LeaveNudge.tsx; owner 2026-11-18). Pinned: never on load, only after real reading, never
// after a buy click, once a session and once every three days, the "on" arm only, the page's own product only, never Amazon.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { leaveEligible, leaveHref, leaveShows, pageProduct, LEAVE_GAP_MS, LEAVE_MIN_DWELL_MS, LEAVE_PHONE_DWELL_MS, type LeaveState } from "../src/lib/leave-nudge";

const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");
const ok: LeaveState = { arm: "on", trigger: "exit", dwellMs: 20_000, scrolled: false, boughtThisSession: false, shownThisSession: false, lastShownAt: 0, now: 10 * LEAVE_GAP_MS, blocked: false, hasLinks: true };

test("it shows only to a reader who clicked nothing, after real reading, once, in the on arm", () => {
  assert.ok(leaveShows(ok));
  assert.ok(!leaveShows({ ...ok, dwellMs: LEAVE_MIN_DWELL_MS - 1 }), "never on load");
  assert.ok(!leaveShows({ ...ok, trigger: "dwell", dwellMs: LEAVE_PHONE_DWELL_MS, scrolled: false }), "a phone reader must have scrolled");
  assert.ok(leaveShows({ ...ok, trigger: "dwell", dwellMs: LEAVE_PHONE_DWELL_MS, scrolled: true }));
  assert.ok(!leaveShows({ ...ok, trigger: "dwell", dwellMs: LEAVE_PHONE_DWELL_MS - 1, scrolled: true }));
  assert.ok(!leaveShows({ ...ok, boughtThisSession: true }), "a visitor who already clicked a buy link is left alone");
  assert.ok(!leaveShows({ ...ok, shownThisSession: true }), "once a session");
  assert.ok(!leaveShows({ ...ok, lastShownAt: ok.now - LEAVE_GAP_MS + 1 }), "once every three days");
  assert.ok(leaveShows({ ...ok, lastShownAt: ok.now - LEAVE_GAP_MS }));
  assert.ok(!leaveShows({ ...ok, blocked: true }), "yields to dialogs and the other cards");
  assert.ok(!leaveEligible({ ...ok, blocked: true }), "and is not counted then, in either arm");
  assert.ok(!leaveShows({ ...ok, hasLinks: false }));
  assert.ok(!leaveShows({ ...ok, arm: "off" }), "the control arm sees nothing");
  assert.ok(leaveEligible({ ...ok, arm: "off" }), "but is counted, so the arms compare");
});

test("it offers only the product page's own eBay and TCGplayer links, never an ad unit's, never Amazon", () => {
  const hrefs = [
    "/go?u=a&s=ebay&m=US&p=694826&from=card-banner-ebay",
    "/go?u=b&s=tcgplayer&m=US&p=711214&from=card-banner-tcg",
    "/go?u=c&s=amazon&m=US&p=713238&from=card_amazon",
    "/go?u=d&s=tcgplayer&m=US&p=713238&from=card_top",
    "/go?u=e&s=ebay&m=US&p=713238&from=card-ebay-search",
    "/go?u=f&s=somestore&m=US&p=713238&from=card_row",
  ];
  assert.deepEqual(pageProduct(hrefs, "/card/glorious-victors-booster-box"), { p: "713238", ebay: hrefs[4], tcg: hrefs[3] });
  assert.equal(pageProduct(hrefs, "/sealed"), null, "only on a product page");
  assert.equal(pageProduct(["/go?u=a&s=ebay&m=US&p=1&from=card_top", "/go?u=b&s=ebay&m=US&p=2&from=card_top"], "/card/x"), null, "two products: none");
  assert.equal(pageProduct(["/go?u=a&s=amazon&m=US&p=1&from=card_top"], "/card/x"), null, "never Amazon");
  assert.equal(new URL(leaveHref(hrefs[3]), "https://x.invalid").searchParams.get("from"), "card_top_leave");
  assert.equal(leaveHref(leaveHref(hrefs[3])), leaveHref(hrefs[3]), "labelled once");
});

test("the card is a dismissible Ad-labelled status card, never a modal, and every buy click carries the arm", () => {
  const c = src("components/LeaveNudge.tsx");
  const card = c.slice(c.indexOf("if (!view) return null;"));
  assert.match(card, /role="status"/);
  assert.doesNotMatch(card, /aria-modal|role="dialog"/);
  assert.doesNotMatch(c, /window\.open/);
  assert.match(c, /aria-label="Close"/);
  assert.match(c, />Ad</);
  assert.match(c, /rel="sponsored nofollow noopener"/);
  assert.match(src("components/BuyClickTracker.tsx"), /leave_arm/);
  assert.match(src("app/layout.tsx"), /<LeaveNudge \/>/);
});

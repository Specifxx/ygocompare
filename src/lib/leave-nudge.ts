// The leave nudge (owner, 2026-11-18: "we could have pop up affiliate clicks", on top of "more clicks to our affiliate links"). The return
// nudge (lib/return-nudge.ts) only reaches visitors who clicked a store. This one reaches the larger group who read a product page and
// clicked NOTHING: when they are about to leave (desktop: the pointer leaves through the top of the window) or have read the page for a
// while on a phone, a small dismissible card offers the SAME product's eBay and TCGplayer links that are already on the page (tagged /go
// links, re-labelled `from=<placement>_leave`).
// Rules (DECISIONS.md, 2026-11-18 "Leave nudge"): never on load, only after real reading (LEAVE_MIN_DWELL_MS desktop, LEAVE_PHONE_DWELL_MS
// and a scroll on phones), never after any buy click this session, once a session and at most once every LEAVE_GAP_MS per visitor,
// dismissible, never Amazon, never a price or a "best" claim, never a modal, yields to dialogs, the rating card and the return nudge.
// Half of the visitors never see it (control arm, localStorage `ln-arm`): `leave_eligible` fires for both arms and every later `buy_click`
// carries `leave_arm`, so the lift is paid clicks per eligible visit, on against off. Roll back: remove <LeaveNudge /> from the layout.
import { parseGo, type GoParts } from "./return-nudge";

export const LEAVE_ARM_KEY = "ln-arm";
export const LEAVE_LAST_KEY = "ln-last";
export const LEAVE_SESSION_KEY = "ln-session";
export const LEAVE_SUFFIX = "_leave";
export const LEAVE_MIN_DWELL_MS = 8_000;
export const LEAVE_PHONE_DWELL_MS = 35_000;
export const LEAVE_GAP_MS = 3 * 24 * 60 * 60 * 1000;

/** Ad units that show OTHER products (banners, the phone dock, rails, strips, picks): never read as the page's own product. */
const AD_PLACEMENT = /banner|dock|rail|inline|strip|picks|nudge|leave/i;

/**
 * The one product a product page (/card/<slug>) is about, read from its own paid links: every eBay or TCGplayer /go link outside the ad
 * units names the same product. Any other page, a page whose own links name two products, or one with no paid link gives null, so the
 * nudge only ever offers what the page itself offers.
 */
export function pageProduct(hrefs: string[], path: string): { p: string; ebay?: string; tcg?: string } | null {
  if (!path.startsWith("/card/")) return null;
  const paid = hrefs
    .map((h) => [h, parseGo(h)] as const)
    .filter((x): x is readonly [string, GoParts] => !!x[1] && !!x[1].p && (x[1].s === "ebay" || x[1].s === "tcgplayer") && !AD_PLACEMENT.test(x[1].from));
  if (!paid.length) return null;
  const ps = new Set(paid.map(([, g]) => g.p));
  if (ps.size !== 1) return null;
  const out: { p: string; ebay?: string; tcg?: string } = { p: paid[0][1].p };
  for (const [h, g] of paid) {
    if (g.s === "ebay" && !out.ebay) out.ebay = h;
    if (g.s === "tcgplayer" && !out.tcg) out.tcg = h;
  }
  return out;
}

/** The same link, labelled as the leave nudge's own placement so the click log and Vercel events can tell it apart. */
export function leaveHref(href: string): string {
  try {
    const u = new URL(href, "https://x.invalid");
    const from = u.searchParams.get("from") ?? "page";
    if (!from.endsWith(LEAVE_SUFFIX)) u.searchParams.set("from", from.replace(/_nudge$/, "").slice(0, 40) + LEAVE_SUFFIX);
    return `${u.pathname}${u.search}`;
  } catch {
    return href;
  }
}

export interface LeaveState {
  arm: "on" | "off";
  trigger: "exit" | "dwell";
  dwellMs: number;
  scrolled: boolean;
  boughtThisSession: boolean;
  shownThisSession: boolean;
  lastShownAt: number;
  now: number;
  blocked: boolean;
  hasLinks: boolean;
}

/** Counted in both arms: a reader who clicked nothing and is leaving (or has read a while on a phone), with nothing else on screen. */
export function leaveEligible(s: LeaveState): boolean {
  if (!s.hasLinks || s.blocked || s.boughtThisSession || s.shownThisSession) return false;
  if (s.lastShownAt > 0 && s.now - s.lastShownAt < LEAVE_GAP_MS) return false;
  if (s.trigger === "exit") return s.dwellMs >= LEAVE_MIN_DWELL_MS;
  return s.dwellMs >= LEAVE_PHONE_DWELL_MS && s.scrolled;
}

/** Eligible and in the "on" arm. */
export function leaveShows(s: LeaveState): boolean {
  return leaveEligible(s) && s.arm === "on";
}

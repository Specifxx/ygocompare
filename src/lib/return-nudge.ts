// The return nudge (owner, 2026-11-18: "targeted ads … very subtle ways we can boost the revenue"). About 70% of buy clicks go to stores that
// pay nothing. When a visitor has clicked a store, then comes back to this tab, a small dismissible card says "Back from <store>?" and offers
// the SAME product's eBay and TCGplayer links that are already on the page (tagged /go links, re-labelled `from=<placement>_nudge`).
// Rules (DECISIONS.md, 2026-11-18): only after a store click this session (never a new visitor's first view), once per session, dismissible,
// never Amazon, never a price or a "best" claim, yields to dialogs, the rating card and the buy bar. Half of the visitors never see it (the
// control arm, stored in localStorage `rn-arm`): `nudge_eligible` fires for both arms and every later `buy_click` carries `nudge_arm`, so the
// lift is paid clicks per eligible return, on against off. Pure helpers; the component is components/ReturnNudge.tsx.
export const NUDGE_WINDOW_MS = 30 * 60 * 1000;
export const NUDGE_MIN_AWAY_MS = 4000;
export const NUDGE_ARM_KEY = "rn-arm";
export const NUDGE_STATE_KEY = "rn-state";
export const NUDGE_SUFFIX = "_nudge";
const PAID = ["ebay", "tcgplayer", "amazon"];

export interface GoParts {
  s: string;
  p: string;
  m: string;
  from: string;
}

export function parseGo(href: string, base = "https://x.invalid"): GoParts | null {
  try {
    const u = new URL(href, base);
    if (u.pathname !== "/go") return null;
    return { s: u.searchParams.get("s") ?? "", p: u.searchParams.get("p") ?? "", m: u.searchParams.get("m") ?? "", from: u.searchParams.get("from") ?? "" };
  } catch {
    return null;
  }
}

/** A store row: a /go link for a product whose source pays nothing. */
export function isStoreClick(g: GoParts | null): g is GoParts {
  return !!g && !!g.s && !!g.p && !PAID.includes(g.s);
}

/** The first eBay and TCGplayer /go links for product `p` among `hrefs` (never Amazon). */
export function pickPaidLinks(hrefs: string[], p: string): { ebay?: string; tcg?: string } {
  const out: { ebay?: string; tcg?: string } = {};
  for (const h of hrefs) {
    const g = parseGo(h);
    if (!g || g.p !== p) continue;
    if (g.s === "ebay" && !out.ebay) out.ebay = h;
    if (g.s === "tcgplayer" && !out.tcg) out.tcg = h;
  }
  return out;
}

/** The same link, labelled as the nudge's own placement so the click log and Vercel events can tell it apart. */
export function nudgeHref(href: string): string {
  try {
    const u = new URL(href, "https://x.invalid");
    const from = u.searchParams.get("from") ?? "page";
    if (!from.endsWith(NUDGE_SUFFIX)) u.searchParams.set("from", from.slice(0, 40) + NUDGE_SUFFIX);
    return `${u.pathname}${u.search}`;
  } catch {
    return href;
  }
}

export const pickArm = (rand: number): "on" | "off" => (rand < 0.5 ? "on" : "off");

export interface NudgeState {
  arm: "on" | "off";
  clickedAt: number;
  now: number;
  awayMs: number;
  shownBefore: boolean;
  blocked: boolean;
  hasLinks: boolean;
}

export function nudgeEligible(s: NudgeState): boolean {
  return s.clickedAt > 0 && s.now - s.clickedAt <= NUDGE_WINDOW_MS && s.awayMs >= NUDGE_MIN_AWAY_MS && !s.shownBefore;
}

/** Eligible, in the "on" arm, with something to offer and nothing in the way. */
export function nudgeShows(s: NudgeState): boolean {
  return nudgeEligible(s) && s.arm === "on" && s.hasLinks && !s.blocked;
}

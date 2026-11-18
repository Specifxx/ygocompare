// Lever 2 of the retention programme (owner, 2026-11-18): "Since your last visit". Pure helpers for
// components/SinceLastVisit.tsx. A product page notes the prices the visitor saw (localStorage `seen-prices`, at most
// SEEN_MAX products, newest first, each market's lowest in-stock store price as on the page). On the first page of a
// LATER day, the strip reads this site's own static /alert-feed.json (the same prices, rebuilt every release) and,
// when something the visitor looked at is now cheaper in their market, shows one in-page line naming up to three of
// them. Half of the visitors are the control arm (`since-arm`), counted but shown nothing. Nothing leaves the browser
// except the arm and counts on the events `since_eligible`, `since_shown` and `since_click`.
import type { Market } from "./site-types";

export const SEEN_KEY = "seen-prices";
export const SINCE_ARM_KEY = "since-arm";
export const SINCE_DAY_KEY = "since-day";
export const SEEN_MAX = 30;
/** A drop counts only when it is at least this share of the price seen (1%), and at least one cent. */
export const MIN_DROP = 0.01;

export type SinceArm = "on" | "off";
export const pickSinceArm = (rand: number): SinceArm => (rand < 0.5 ? "on" : "off");

/** One product the visitor looked at: its id, the day (YYYY-MM-DD, local) and the lowest prices then, in cents. */
export interface Seen { id: string; d: string; p: Partial<Record<Market, number>> }

export function parseSeen(raw: string | null): Seen[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter((x) => x && typeof x.id === "string" && typeof x.d === "string" && x.p && typeof x.p === "object")
      .slice(0, SEEN_MAX);
  } catch {
    return [];
  }
}

/** Notes a product view: newest first, one entry a product, the day's prices replacing older ones. */
export function noteSeen(list: Seen[], id: string, day: string, prices: Partial<Record<Market, number>>): Seen[] {
  const clean: Partial<Record<Market, number>> = {};
  for (const [m, c] of Object.entries(prices)) if (typeof c === "number" && c > 0) clean[m as Market] = Math.round(c);
  if (!Object.keys(clean).length) return list;
  return [{ id, d: day, p: clean }, ...list.filter((s) => s.id !== id)].slice(0, SEEN_MAX);
}

/** True when some product was seen on a day before today (the strip has something to compare). */
export const hasEarlier = (list: Seen[], day: string) => list.some((s) => s.d < day);

export interface FeedItem { n: string; u: string; p: Partial<Record<Market, number>> }
export interface Drop { id: string; name: string; url: string; was: number; now: number; pct: number }

/** Products seen on an earlier day that are now cheaper in `market`, biggest drop (share) first. */
export function findDrops(list: Seen[], items: Record<string, FeedItem>, market: Market, day: string): Drop[] {
  const out: Drop[] = [];
  for (const s of list) {
    if (s.d >= day) continue;
    const was = s.p[market];
    const it = items[s.id];
    const now = it?.p?.[market];
    if (!(typeof was === "number" && was > 0 && typeof now === "number" && now > 0)) continue;
    if (now >= was || was - now < Math.max(1, was * MIN_DROP)) continue;
    if (typeof it.u !== "string" || !it.u.startsWith("/")) continue; // same-site paths only
    out.push({ id: s.id, name: String(it.n ?? "").slice(0, 120), url: it.u, was, now, pct: Math.round(((was - now) / was) * 100) });
  }
  return out.sort((a, b) => b.pct - a.pct || b.was - b.now - (a.was - a.now));
}

/** After the comparison, the seen prices move to today's, so the same drop is never announced twice. */
export function rebase(list: Seen[], items: Record<string, FeedItem>, day: string): Seen[] {
  return list.map((s) => {
    if (s.d >= day) return s;
    const p = items[s.id]?.p;
    return p && Object.keys(p).length ? { ...s, p: { ...s.p, ...p } } : s;
  });
}

/** The visitor-day mark: the strip is worked out at most once a day. */
export const checkedToday = (stored: string | null, day: string) => stored === day;

/** The local day as YYYY-MM-DD. */
export const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

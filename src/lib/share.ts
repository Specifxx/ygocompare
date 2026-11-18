// Word of mouth (owner, 2026-11-02: "word of mouth to be a big driver"): the
// share button, the shared-list page and the share image all use these. Pure,
// so the client button, the server image and the tests agree.
//
// Every shared link carries utm_source=share and utm_medium=<what was shared>,
// so a visit it brings is counted: ShareArrival sends one Vercel "share_visit"
// event, the button one "share" event, and RiftCompare's growth report reads
// both per site from the Web Analytics API. No pop-up, no account.
//
// Share-for-a-deal (owner, 2026-11-18: "if you share … you can open Deal
// Finder"): half of browsers (shareArm, kept per browser) see the button say so,
// and after a share completes it shows today's best store deal in their market
// under the button, from the static /share-deal.json. Everything it shows is free
// anyway (never the cheapest price withheld, never eBay or Amazon); the other
// half is the control. share { medium, arm } and share_unlock { medium } let the
// growth report see whether the offer raises sharing.
import { SITE } from "@/site.config";
import type { Market, Offer } from "./site-types";

export type ShareMedium = "card" | "sealed" | "list" | "page" | "daily" | "set" | "guide" | "tool";

/** `path` on the canonical host with the share tags (an existing query string is kept). */
export function shareUrl(base: string, path: string, medium: ShareMedium): string {
  const u = new URL(path, base);
  u.searchParams.set("utm_source", "share");
  u.searchParams.set("utm_medium", medium);
  return u.toString();
}

const NAMES: Record<string, string> = { tcgplayer: "TCGplayer", amazon: "Amazon", ...Object.fromEntries(SITE.stores.map((s) => [s.key, s.name])) };
export const storeName = (o: Pick<Offer, "source" | "market">) => (o.source === "ebay" ? (o.market === "US" ? "eBay" : `eBay ${o.market}`) : NAMES[o.source] ?? o.source);

export interface PriceGap {
  low: Offer;
  high: Offer;
  /** How much less the cheapest is than the dearest, whole percent. */
  pct: number;
  sellers: number;
}

/**
 * The real spread one market shows today: its cheapest and dearest in-stock
 * item price in its own currency, from two different sellers. Null when there
 * is no spread to show (fewer than two sellers, or the same price everywhere).
 * Never converted, never a reference row from another market.
 */
export function priceGap(offers: readonly Offer[], market: Market): PriceGap | null {
  const local = offers.filter((o) => o.market === market && o.inStock && o.cents > 0);
  if (!local.length) return null;
  const currency = local.slice().sort((a, b) => a.cents - b.cents)[0].currency;
  const same = local.filter((o) => o.currency === currency).sort((a, b) => a.cents - b.cents);
  const low = same[0];
  const high = same[same.length - 1];
  const sellers = new Set(same.map((o) => o.source)).size;
  if (sellers < 2 || high.cents <= low.cents) return null;
  return { low, high, pct: Math.round(((high.cents - low.cents) / high.cents) * 100), sellers };
}

/** The message the phone's share sheet sends with the link. */
export function shareText(name: string, gap: PriceGap | null, money: (cents: number, currency: string) => string): string {
  if (!gap) return `${name}: every store's price on ${SITE.name}`;
  return `${name}: ${money(gap.low.cents, gap.low.currency)} at ${storeName(gap.low)}, up to ${money(gap.high.cents, gap.high.currency)} elsewhere (${gap.pct}% less). Compared on ${SITE.name}`;
}

// A shared list (/list?i=…): product ids and quantities in the URL, no account
// and nothing stored. "123*4.456" = four of 123 and one of 456.
export const LIST_MAX = 100;

export function encodeList(items: readonly { id: number; qty: number }[]): string {
  return items
    .filter((i) => Number.isInteger(i.id) && i.id > 0)
    .slice(0, LIST_MAX)
    .map((i) => (i.qty > 1 ? `${i.id}*${Math.min(99, Math.floor(i.qty))}` : String(i.id)))
    .join(".");
}

export function decodeList(s: string | null | undefined): { id: number; qty: number }[] {
  const out = new Map<number, number>();
  for (const part of String(s ?? "").split(/[.,]/).slice(0, LIST_MAX)) {
    const m = /^(\d{1,12})(?:\*(\d{1,2}))?$/.exec(part.trim());
    if (!m) continue;
    const id = Number(m[1]);
    const qty = Math.max(1, Math.min(99, Number(m[2] ?? 1)));
    if (id > 0) out.set(id, (out.get(id) ?? 0) + qty);
  }
  return [...out].map(([id, qty]) => ({ id, qty: Math.min(99, qty) }));
}

// ---- Share-for-a-deal test ----
export type ShareArm = "reward" | "plain";
export const SHARE_ARM_KEY = "share_arm";

/** The browser's arm, drawn once and kept (a roll in [0,1) decides it: under half is the reward). */
export function pickShareArm(saved: string | null | undefined, roll: number): ShareArm {
  if (saved === "reward" || saved === "plain") return saved;
  return roll < 0.5 ? "reward" : "plain";
}

/** One market's deal the thank-you shows: a store row only, never eBay, Amazon or TCGplayer. */
export interface ShareDeal {
  slug: string;
  name: string;
  store: string;
  cents: number;
  currency: string;
  /** Whole percent under TCGplayer's market price. */
  saving: number;
}

export interface DealLike {
  slug: string;
  name: string;
  source: string;
  offerMarket: string;
  cents: number;
  currency: string;
  saving: number;
  market: number;
  usd: number;
}

/** Up to `per` deals per market, biggest dollar saving first, one row per product. */
export function shareDeals(rows: readonly DealLike[], name: (source: string, market: string) => string, per = 3): Record<string, ShareDeal[]> {
  const out: Record<string, ShareDeal[]> = {};
  const seen = new Set<string>();
  const sorted = rows.slice().sort((a, b) => b.market - b.usd - (a.market - a.usd));
  for (const r of sorted) {
    if (r.source === "ebay" || r.source === "amazon" || r.source === "tcgplayer") continue;
    const list = (out[r.offerMarket] ??= []);
    const key = `${r.offerMarket}:${r.slug}`;
    if (list.length >= per || seen.has(key)) continue;
    seen.add(key);
    list.push({ slug: r.slug, name: r.name, store: name(r.source, r.offerMarket), cents: r.cents, currency: r.currency, saving: r.saving });
  }
  return out;
}

// ---- The share image's sparkline (pure, so the image and the tests agree) ----
/** The last `days` days of a [day, cents] series as an SVG path in a w×h box; null under three points or a flat line. */
export function sparkPath(series: readonly [number, number][], w: number, h: number, days = 30): string | null {
  if (!series.length) return null;
  const last = series[series.length - 1][0];
  const pts = series.filter(([d, c]) => d > last - days && c > 0);
  if (pts.length < 3) return null;
  const xs = pts.map(([d]) => d);
  const ys = pts.map(([, c]) => c);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (x1 === x0 || y1 === y0) return null;
  const pad = 4;
  return pts
    .map(([d, c], i) => `${i ? "L" : "M"}${(((d - x0) / (x1 - x0)) * (w - pad * 2) + pad).toFixed(1)} ${(h - pad - ((c - y0) / (y1 - y0)) * (h - pad * 2)).toFixed(1)}`)
    .join(" ");
}

/** The one-line "what's moving" note on the share image, from real changes only. */
export function moveNote(c7: number | null | undefined, c30: number | null | undefined): string | null {
  const r = (v: number) => Math.round(Math.abs(v));
  if (c7 != null && Math.abs(c7) >= 3) return `${c7 > 0 ? "Up" : "Down"} ${r(c7)}% this week`;
  if (c30 != null && Math.abs(c30) >= 5) return `${c30 > 0 ? "Up" : "Down"} ${r(c30)}% this month`;
  if (c7 != null || c30 != null) return "Steady this month";
  return null;
}

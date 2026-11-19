// The cheapest in-stock STORE price per product per market, one point per change, as committed JSON
// (data/store-lows/<setId>.json: { [productId]: { [MARKET]: [[day, cents], ...] } }, day = days since 1970-01-01, cents in
// that market's own currency, 0 = no store had it in stock that day). Written by the daily import for the price
// history chart's local line (components/PriceHistory.tsx, owner 2026-11-19). data/history is TCGplayer's reference price
// only; it cannot tell whether a STORE's price is its lowest. Never eBay, Amazon or TCGplayer; never converted.
// Same shape and rules as import/history.ts: change-only points, 730 days kept. Public data, never anything private.
import fs from "node:fs";
import path from "node:path";
import type { Offer } from "@/lib/site-types";
import { appendPoint, valueOn } from "./history";
import type { Series } from "@/lib/series";

export type SetLows = Record<string, Record<string, Series>>;
export const LOWS_DIR = path.join(process.cwd(), "data", "store-lows");

export function readSetLows(setId: number, dir = LOWS_DIR): SetLows {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, `${setId}.json`), "utf8"));
  } catch {
    return {};
  }
}

export function writeSetLows(setId: number, lows: SetLows, dir = LOWS_DIR): void {
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, `${setId}.json`);
  const body = JSON.stringify(lows);
  if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== body) fs.writeFileSync(f, body);
}

/** Pure: today's cheapest in-stock store price per market from a product's offers. */
export function storeLowsByMarket(offers: Offer[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of offers) {
    if (!o.inStock || o.preorder || o.source === "ebay" || o.source === "tcgplayer" || o.source === "amazon" || !(o.cents > 0)) continue;
    if (out[o.market] == null || o.cents < out[o.market]) out[o.market] = o.cents;
  }
  return out;
}

/** Pure: record today's lows into a product's series (a market with no stock records 0, but only once it has a series). */
export function recordLows(cur: Record<string, Series> | undefined, today: number, lows: Record<string, number>): Record<string, Series> {
  const next: Record<string, Series> = { ...(cur ?? {}) };
  for (const [m, c] of Object.entries(lows)) next[m] = appendPoint(next[m] ?? [], today, c);
  for (const m of Object.keys(next)) if (lows[m] == null) next[m] = appendPoint(next[m], today, 0);
  return next;
}

/** Pure: the daily series for the `days` before `today` (today excluded), oldest first; days before the first point are skipped. */
export function dailyBefore(series: Series | undefined, today: number, days: number): number[] {
  if (!series?.length) return [];
  const out: number[] = [];
  for (let d = today - days; d < today; d++) {
    if (d < series[0][0]) continue;
    out.push(valueOn(series, d) ?? 0);
  }
  return out;
}

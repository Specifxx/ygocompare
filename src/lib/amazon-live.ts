// What a sealed product's page may show of Amazon, per market: the ASIN's own tagged link (data/amazon/asins-<MARKET>.json,
// written by scripts/amazon-asins.ts in the daily refresh; ASINs may be stored) and, only while under 24 hours old, the
// price this build fetched from the Creators API (data/amazon-live/<MARKET>.json, git-ignored, never committed: Amazon's
// licence lets a price be kept 24 hours and shown with its time). Read only by the product page, for its Amazon row
// (components/PriceTable.tsx): never by a sort, the cheapest badge, deals, movers, alerts, history, the feed, metadata or the
// quick view (tests/amazon-api.test.ts). The page sits in the CDN for hours, so the browser checks the age again and hides
// the price past 24 hours (components/AmazonPrice.tsx).
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { amazonItemUrl } from "./affiliate";
import { money } from "./format";
import { CURRENCY, MARKETS, type Market } from "./site-types";

/** One market's Amazon row: the link (the item's own page, else the tagged search) and this build's price while fresh. */
export interface AmazonCell {
  url: string;
  live?: { price: string; at: string; timeZone: string; zoneLabel: string };
}
export type AsinFile = Record<string, { asin: string | null; checked: string }>;
export type LiveFile = { fetchedAt: string; prices: Record<string, { asin: string; cents: number }> };

export const asinFile = (m: Market) => path.join(process.cwd(), "data", "amazon", `asins-${m}.json`);
export const liveFile = (m: Market) => path.join(process.cwd(), "data", "amazon-live", `${m}.json`);

export const AMAZON_MAX_AGE_H = 24;
/** Whether a price fetched at `at` may still be shown at `now`. */
export const isFreshAmazonPrice = (at: string | undefined, now = Date.now()) =>
  !!at && Number.isFinite(Date.parse(at)) && now - Date.parse(at) < AMAZON_MAX_AGE_H * 3600_000 && Date.parse(at) <= now + 60_000;

/** The clock an Amazon price's "as of" time is shown in: the market's own. */
export const AMAZON_CLOCK: Partial<Record<Market, { timeZone: string; label: string }>> = {
  US: { timeZone: "America/New_York", label: "New York time" },
  UK: { timeZone: "Europe/London", label: "London time" },
  CA: { timeZone: "America/Toronto", label: "Toronto time" },
  AU: { timeZone: "Australia/Sydney", label: "Sydney time" },
  EU: { timeZone: "Europe/Berlin", label: "Berlin time" },
};

const cache = new Map<string, { asins: AsinFile; live: LiveFile | null }>();
function files(m: Market) {
  let c = cache.get(m);
  if (!c) {
    const read = <T,>(f: string): T | null => {
      try {
        return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as T) : null;
      } catch {
        return null;
      }
    };
    c = { asins: read<AsinFile>(asinFile(m)) ?? {}, live: read<LiveFile>(liveFile(m)) };
    cache.set(m, c);
  }
  return c;
}

/**
 * The product's Amazon row per market: `searches` (lib/affiliate.ts amazonSearchUrls, the markets with a tag) upgraded to the
 * item's own page where the daily refresh found its ASIN, with this build's price while under 24 hours old.
 */
export function amazonCells(productId: number, searches: Partial<Record<Market, string>> | null, now = Date.now()): Partial<Record<Market, AmazonCell>> | null {
  if (!searches) return null;
  const out: Partial<Record<Market, AmazonCell>> = {};
  for (const m of MARKETS) {
    const search = searches[m];
    if (!search) continue;
    const { asins, live } = files(m);
    const asin = asins[String(productId)]?.asin;
    const url = (asin && amazonItemUrl(asin, m)) || search;
    const l = asin && live && isFreshAmazonPrice(live.fetchedAt, now) ? live.prices[String(productId)] : undefined;
    const clock = AMAZON_CLOCK[m];
    out[m] = l && l.asin === asin && clock ? { url, live: { price: money(l.cents, CURRENCY[m]), at: live!.fetchedAt, timeZone: clock.timeZone, zoneLabel: clock.label } } : { url };
  }
  return out;
}

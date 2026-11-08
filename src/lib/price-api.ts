// The free public price file (competitor scan, 2026-11-08; Scryfall's model: free data, credited with a link, is
// how a price site gets used by bots, deck tools and blogs). Served as the static file /prices.json
// (src/app/prices.json/route.ts), built once per deploy from the same feed RiftCompare's alert service reads
// (lib/alert-feed.ts), so no function runs for it and only a release changes it. The cheapest in-stock price per
// market from a store or TCGplayer, in that market's own currency: never eBay, never converted.
import { SITE } from "@/site.config";
import { buildAlertFeed, type AlertFeed } from "./alert-feed";
import { SITE_URL } from "./site";
import { CURRENCY, MARKETS } from "./site-types";

export interface PriceApi {
  version: 1;
  source: string;
  home: string;
  licence: string;
  attribution: { text: string; url: string; html: string };
  generatedAt: string;
  /** market code to ISO 4217 currency */
  currency: Record<string, string>;
  products: { id: string; name: string; prices: Record<string, { cents: number; url: string }> }[];
}

export const PRICE_API_PATH = "/prices.json";

export function attributionHtml(siteUrl = SITE_URL, siteName = SITE.name): string {
  return `<a href="${siteUrl}">Prices from ${siteName}</a>`;
}

/** Pure: the public file from the alert feed (tests feed it a fixture). */
export function priceApiFrom(feed: AlertFeed, siteUrl: string, siteName: string, now: Date): PriceApi {
  const products = Object.entries(feed.items)
    .map(([id, it]) => ({
      id,
      name: it.n,
      prices: Object.fromEntries(Object.entries(it.p).map(([m, cents]) => [m, { cents: cents as number, url: siteUrl + it.u.replace("{r}", m.toLowerCase()) }])),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    version: 1,
    source: siteName,
    home: siteUrl,
    licence: `Free for any use, including commercial, if you show a visible link to ${siteUrl} wherever the prices appear.`,
    attribution: { text: `Prices from ${siteName}`, url: siteUrl, html: attributionHtml(siteUrl, siteName) },
    generatedAt: now.toISOString(),
    currency: Object.fromEntries(MARKETS.map((m) => [m, CURRENCY[m]])),
    products,
  };
}

export function buildPriceApi(now = new Date()): PriceApi {
  return priceApiFrom(buildAlertFeed(now), SITE_URL, SITE.name, now);
}

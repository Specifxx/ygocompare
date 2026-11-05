// Helpers the two Amazon scripts share: the sealed products of a market, read from data/public through lib/data.ts, with
// their in-stock STORE prices (never eBay or TCGplayer): most stores, then dearest, first.
import { priceOf, products } from "@/lib/data";
import type { Market, Product } from "@/lib/site-types";

export const API_MARKETS: Market[] = ["US", "UK", "CA", "AU", "EU"];

export function marketSealed(market: Market): { p: Product; prices: number[] }[] {
  return products()
    .filter((p) => p.kind === "sealed")
    .map((p) => ({
      p,
      prices: priceOf(p.id)
        .offers.filter((o) => o.market === market && o.inStock && !o.preorder && o.source !== "ebay" && o.source !== "tcgplayer" && o.cents > 0)
        .map((o) => o.cents)
        .sort((a, b) => a - b),
    }))
    .filter((x) => x.prices.length)
    .sort((a, b) => b.prices.length - a.prices.length || b.prices[0] - a.prices[0]);
}

export function median(xs: number[]): number | undefined {
  if (!xs.length) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

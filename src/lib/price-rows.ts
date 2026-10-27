// The order of a product's price rows for one market, shared by the price
// table, the phone buy block and the sticky buy bar so they can never disagree
// about which row is "cheapest" (RiftCompare's computeMarket, same rule).
//
//   1. the market's own in-stock offers, cheapest item price first
//   2. outside the US, TCGplayer and eBay US as the reference ("≈" converted)
//   3. the market's out-of-stock offers, cheapest first (the table folds them)
//
// Item price only, like every RiftCompare row: postage is shown, never added,
// because most stores' postage depends on the basket.
import type { Market, Offer } from "./site-types";

export interface PriceRows {
  inStock: Offer[];
  refs: Offer[];
  outOfStock: Offer[];
  /** The market's cheapest in-stock offer, or null. Never a reference row. */
  cheapest: Offer | null;
}

const byPrice = (a: Offer, b: Offer) => a.cents - b.cents;

export function priceRows(offers: Offer[], market: Market): PriceRows {
  const local = offers.filter((o) => o.market === market);
  const inStock = local.filter((o) => o.inStock).sort(byPrice);
  const outOfStock = local.filter((o) => !o.inStock).sort(byPrice);
  const refs = market === "US" ? [] : offers.filter((o) => o.market === "US" && (o.source === "tcgplayer" || o.source === "ebay")).sort(byPrice);
  return { inStock, refs, outOfStock, cheapest: inStock[0] ?? null };
}

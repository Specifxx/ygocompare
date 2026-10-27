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
  /**
   * When `cheapest` is a store (whose link pays nothing), the market's cheapest
   * in-stock eBay or TCGplayer offer if it is within PAID_ALTERNATIVE_BAND of
   * it, with how much more it costs; else null. The phone buy block names it on
   * a second line (2026-10-27, owner: more eBay and TCGplayer clicks). A real
   * row at its real price, never called cheaper, never reordered.
   */
  paidAlternative: { offer: Offer; pctMore: number } | null;
  /**
   * The table's display order (owner, 2026-10-27: "the top rows should be eBay
   * and TCGplayer, even if they are not the cheapest"): the market's cheapest
   * eBay offer, then its cheapest TCGplayer offer (a local row, else the US
   * reference), then every other live row (in stock, then references), then
   * out of stock. `pinned` holds the two moved rows. `cheapest` is unchanged.
   */
  display: Offer[];
  pinned: Offer[];
}

/** At most 20% above the cheapest in-stock item price. */
export const PAID_ALTERNATIVE_BAND = 1.2;

const isPaidSource = (o: Offer) => o.source === "ebay" || o.source === "tcgplayer";

const byPrice = (a: Offer, b: Offer) => a.cents - b.cents;

export function priceRows(offers: Offer[], market: Market): PriceRows {
  const local = offers.filter((o) => o.market === market);
  const inStock = local.filter((o) => o.inStock).sort(byPrice);
  const outOfStock = local.filter((o) => !o.inStock).sort(byPrice);
  const refs = market === "US" ? [] : offers.filter((o) => o.market === "US" && (o.source === "tcgplayer" || o.source === "ebay")).sort(byPrice);
  const cheapest = inStock[0] ?? null;
  let paidAlternative: PriceRows["paidAlternative"] = null;
  if (cheapest && !isPaidSource(cheapest)) {
    const alt = inStock.find(isPaidSource);
    if (alt && alt.cents <= cheapest.cents * PAID_ALTERNATIVE_BAND) {
      paidAlternative = { offer: alt, pctMore: cheapest.cents > 0 ? Math.round(((alt.cents - cheapest.cents) / cheapest.cents) * 100) : 0 };
    }
  }
  const live = [...inStock, ...refs];
  const pick = (src: string) => inStock.find((o) => o.source === src) ?? refs.find((o) => o.source === src);
  const pinned = [pick("ebay"), pick("tcgplayer")].filter((o): o is Offer => o != null);
  const display = [...pinned, ...live.filter((o) => !pinned.includes(o)), ...outOfStock];
  return { inStock, refs, outOfStock, cheapest, paidAlternative, display, pinned };
}

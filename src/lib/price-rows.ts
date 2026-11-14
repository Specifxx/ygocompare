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
   * a second line (2026-10-27, owner: more eBay and TCGplayer clicks), or an eBay
   * search when there is none (2026-10-28). A real
   * row at its real price, never called cheaper, never reordered.
   */
  paidAlternative: { offer: Offer; pctMore: number } | null;
  /**
   * The table's display order (owner, 2026-10-27: "the top rows should be eBay
   * and TCGplayer, even if they are not the cheapest"): the market's cheapest
   * eBay offer and its cheapest TCGplayer offer (a local row, else the US
   * reference), eBay on top (`pinnedOrder`), then every other live row (in stock, then references), then
   * out of stock. `pinned` holds the two moved rows. `cheapest` is unchanged.
   */
  display: Offer[];
  pinned: Offer[];
}

/** At most 50% above the cheapest in-stock item price (20% until 2026-10-28, when the owner asked for eBay to be pushed harder). */
export const PAID_ALTERNATIVE_BAND = 1.5;

const isPaidSource = (o: Offer) => o.source === "ebay" || o.source === "tcgplayer";

const byPrice = (a: Offer, b: Offer) => a.cents - b.cents;

/** eBay and Amazon are never "the cheapest" or "Best price" (owner rule, every Compare site; 2026-11-14 an eBay row was badged Best price). */
export const neverCheapest = (o: Offer) => o.source === "ebay" || o.source === "amazon";

export function priceRows(offers: Offer[], market: Market): PriceRows {
  const local = offers.filter((o) => o.market === market);
  const inStock = local.filter((o) => o.inStock).sort(byPrice);
  const outOfStock = local.filter((o) => !o.inStock).sort(byPrice);
  const refs = market === "US" ? [] : offers.filter((o) => o.market === "US" && (o.source === "tcgplayer" || o.source === "ebay")).sort(byPrice);
  const cheapest = inStock.find((o) => !neverCheapest(o)) ?? null;
  let paidAlternative: PriceRows["paidAlternative"] = null;
  if (cheapest && !isPaidSource(cheapest)) {
    const alt = inStock.find(isPaidSource);
    if (alt && alt.cents >= cheapest.cents && alt.cents <= cheapest.cents * PAID_ALTERNATIVE_BAND) {
      paidAlternative = { offer: alt, pctMore: cheapest.cents > 0 ? Math.round(((alt.cents - cheapest.cents) / cheapest.cents) * 100) : 0 };
    }
  }
  const live = [...inStock, ...refs];
  const pick = (src: string) => inStock.find((o) => o.source === src) ?? refs.find((o) => o.source === src);
  const pinned = pinnedOrder(pick("ebay") ?? null, pick("tcgplayer") ?? null, market);
  const display = [...pinned, ...live.filter((o) => !pinned.includes(o)), ...outOfStock];
  return { inStock, refs, outOfStock, cheapest, paidAlternative, display, pinned };
}

/**
 * The two pinned rows in display order: eBay always first, then TCGplayer
 * (owner, 2026-11-06: eBay and Amazon "sit on the very top", eBay first and
 * Amazon second; the price table draws Amazon right under eBay). From
 * 2026-10-27 to 2026-11-06 the cheaper of the two led, TCGplayer on a tie.
 */
export function pinnedOrder(ebay: Offer | null, tcgplayer: Offer | null, _market?: Market): Offer[] {
  return [ebay, tcgplayer].filter((o): o is Offer => o != null);
}

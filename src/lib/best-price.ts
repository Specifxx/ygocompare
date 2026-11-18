// How the table marks its "Best price" row (owner, 2026-11-18). A row that pays us (eBay, TCGplayer, Amazon, or a store on Awin / Impact /
// a direct deal) keeps the full highlight; a plain store that pays nothing gets a small neutral "Best price" tag and a one-line hint
// that eBay and TCGplayer are worth a look, so the loudest row is never the one that earns nothing. Display only: sorting, which row is
// the cheapest, the links and every feed are untouched (lib/price-rows.ts).
import { awinUrl } from "./awin";
import type { Offer } from "./site-types";

/** Rows that earn commission: eBay, TCGplayer, Amazon, and any store whose link goes through one of our affiliate programmes. */
export function isPaidRow(o: Pick<Offer, "source" | "url">): boolean {
  if (o.source === "ebay" || o.source === "tcgplayer" || o.source === "amazon") return true;
  try {
    return awinUrl(o.url, "x") !== null;
  } catch {
    return false;
  }
}

export interface BestTreatment {
  /** true: the full existing highlight (a paid row is the cheapest). false: the plain tag. */
  loud: boolean;
  /** The muted hint for a plain best row, or null: shown only when the list really has an eBay and/or a TCGplayer row. */
  hint: string | null;
}

export function bestTreatment(cheapest: Offer | null, rows: Pick<Offer, "source">[]): BestTreatment {
  if (!cheapest || isPaidRow(cheapest)) return { loud: true, hint: null };
  const names = [rows.some((o) => o.source === "ebay") ? "eBay" : null, rows.some((o) => o.source === "tcgplayer") ? "TCGplayer" : null].filter(
    (n): n is string => n !== null,
  );
  return { loud: false, hint: names.length ? `Prices and stock change: also check ${names.join(" and ")}` : null };
}

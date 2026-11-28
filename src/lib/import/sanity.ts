// Price sanity for the rows the import builds itself (TCGplayer and eBay).
// Store rows are checked as they match (scripts/import-all.ts, step 1); these
// two were trusted as they came, and showed a US$1.00 TCGplayer "low" on a
// US$150 booster box and a booster-box listing as a booster pack on eBay.

/** TCGplayer's "low" is its single cheapest listing, junk included. Under half
 *  the market price it is a mislisting or a damaged copy, not a price anyone
 *  can count on: show the market price instead. Below US$3 (the store rule's
 *  floor) a cent-level low is normal and stays. */
export function tcgplayerOfferCents(lows: number[], ref: number | null | undefined): number | null {
  const low = lows.length ? Math.min(...lows) : null;
  if (low == null) return ref ?? null;
  if (ref != null && ref >= 300 && low < ref * 0.5) return ref;
  return low;
}

/** The USD price an eBay row is judged against: TCGplayer's reference, or for a
 *  product TCGplayer doesn't price yet (a launch-week pack) the cheapest
 *  in-stock store price. Null means nothing to judge by. */
export function ebayReferenceUsd(ref: number | null | undefined, storeUsd: number[]): number | null {
  if (ref != null) return ref;
  return storeUsd.length ? Math.min(...storeUsd) : null;
}

/** An eBay row is shown only against a reference, and only within a quarter to
 *  four times it (the store rule): outside that it is another product. */
export function ebayTrusted(usd: number, reference: number | null): boolean {
  return reference != null && usd >= reference * 0.25 && usd <= reference * 4;
}

const words = (s: string): string[] => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** A display's single unit in the same set: TCGplayer names it the display's name without "Display" ("Midterm Paradox
 *  Mini Box Display" -> "Midterm Paradox Mini Box"; "Special Edition Display Box" -> "Special Edition Box"). Map of
 *  display id -> unit id; a display with no such sibling is left out. */
export function displayUnits(products: { id: number; setId: number; name: string; kind: string }[]): Map<number, number> {
  const byName = new Map<string, number>();
  for (const p of products) if (p.kind === "sealed") byName.set(`${p.setId}|${words(p.name).join(" ")}`, p.id);
  const out = new Map<number, number>();
  for (const p of products) {
    if (p.kind !== "sealed") continue;
    const w = words(p.name);
    if (!w.includes("display")) continue;
    const base = w.filter((x) => x !== "display");
    const unit = byName.get(`${p.setId}|${base.join(" ")}`) ?? byName.get(`${p.setId}|${base.filter((x) => x !== "box").join(" ")}`);
    if (unit != null && unit !== p.id) out.set(p.id, unit);
  }
  return out;
}

/** Live 2026-11-28 (YGO): j2games' "...midterm-paradox-mini-box-display-toys" at US$11.99 sat on the Midterm Paradox
 *  Mini Box Display (US$33 market), inside the quarter-to-4x band, while one mini box is US$9.45. A display priced like
 *  one of its units (at most 1.5x the unit's market) and under half the display's own market is one unit, not the
 *  display. It can only refuse. */
export function pricedAsOneUnit(usd: number, displayRef: number | null | undefined, unitRef: number | null | undefined): boolean {
  return displayRef != null && unitRef != null && unitRef > 0 && usd <= unitRef * 1.5 && usd < displayRef * 0.5;
}

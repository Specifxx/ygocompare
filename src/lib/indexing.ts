// Which card pages ask to be indexed, and how long a price in JSON-LD is good for.
//
// Zero-data rule (Gemini SEO research, 2026-11-04; Google's scaled-content and
// soft-404 guidance): a programmatic page with nothing of its own, no TCGplayer
// reference price and no store or eBay listing, is a template with a name in it.
// It stays reachable (noindex, follow: crawlers still walk its links) but out of
// the index, so the thin long tail does not drag the rest of the domain down.
// Cards in an upcoming set are kept: they have no price yet because the set is
// not out, and reveal-week searches are exactly when people look for them.
// Nothing is deleted and no URL changes (owner, 2026-11-03: narrow, never delete).
export function cardIndexable(p: { kind: "card" | "sealed"; sealedType: string | null }, refCents: number | null, offerCount: number, set: { upcoming: boolean } | null | undefined): boolean {
  if (p.sealedType === "Insert") return false; // pack inserts, as before (DECISIONS.md, 2026-10-28)
  if (set?.upcoming) return true;
  return refCents != null || offerCount > 0;
}

/**
 * Core-update quality pass (2026-11-19): Google's November 2026 update took YGO Compare from ~120 impressions a day to
 * almost none, and 1,086 sealed pages asked to be indexed for 54 impressions in 56 days. A sealed page now asks only when
 * it is a real comparison: three or more stores list it and one has it in stock. An upcoming set's product, and any page
 * Search Console shows people finding (lib/search-demand.ts), still ask. The rest stay live, noindex, follow.
 */
export const SEALED_INDEX_MIN_STORES = 3;
export function sealedAsksIndex(
  p: { kind: "card" | "sealed"; sealedType: string | null },
  refCents: number | null,
  s: { listedSources: number; inStockSources: number },
  set: { upcoming: boolean } | null | undefined,
  found: boolean,
): boolean {
  if (!cardIndexable(p, refCents, s.listedSources, set)) return false;
  if (set?.upcoming || found) return true;
  return s.listedSources >= SEALED_INDEX_MIN_STORES && s.inStockSources >= 1;
}

/** A set page asks to be indexed when people find it, or when at least two of its sealed products do. Pure. */
export function setAsksIndex(asking: number, found: boolean, upcoming: boolean): boolean {
  return found || upcoming || asking >= 2;
}

/** Store prices refresh on the daily import, so a price in JSON-LD is good until tomorrow (schema.org priceValidUntil, YYYY-MM-DD). */
export function priceValidUntil(now = Date.now()): string {
  return new Date(now + 86400e3).toISOString().slice(0, 10);
}

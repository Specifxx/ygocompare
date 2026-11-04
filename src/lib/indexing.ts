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

/** Store prices refresh on the daily import, so a price in JSON-LD is good until tomorrow (schema.org priceValidUntil, YYYY-MM-DD). */
export function priceValidUntil(now = Date.now()): string {
  return new Date(now + 86400e3).toISOString().slice(0, 10);
}

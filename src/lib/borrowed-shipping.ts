// SHIPPING BORROWED FROM THE SISTER SITES (2026-11-25, for Best Basket). YGO Compare measures no store's shipping itself, but most
// of its shops are the same shops DexCompare and MTG Compare already measure every week: they ask each Shopify store's own checkout
// what one item at a few prices costs to post to several addresses per market (CompareEmpire apps/dexcompare-sealed
// scripts/probe-shipping-rates.ts). A shop's postage does not depend on which game the item is, so scripts/borrow-shipping.ts copies
// those measurements here, matched to OUR store by host AND market, never by name: data/shipping/borrowed.json. A shop neither
// sister measures has no figure (Best Basket leaves it out). Pure: the file is passed in.
import type { Market } from "./site-types";

export interface ShippingPoint {
  subtotalCents: number;
  rates: Record<string, number | null>;
}

export interface StoreShipping {
  market: Market;
  currency: string;
  measuredAt: string;
  points: ShippingPoint[];
  /** Which sister's measurement this is ("dexcompare", "mtgcompare"). */
  from?: string;
}

export interface BorrowedShipping {
  version: 1;
  generatedAt: string | null;
  addresses: Partial<Record<string, { id: string; label: string }[]>>;
  stores: Record<string, StoreShipping>;
}

export const EMPTY_BORROWED: BorrowedShipping = { version: 1, generatedAt: null, addresses: {}, stores: {} };

/** A store's host without www, or null. */
export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** The file as read from disk, checked: anything malformed is dropped rather than priced. */
export function validBorrowed(raw: unknown): BorrowedShipping {
  const r = raw as Partial<BorrowedShipping> | null;
  if (!r || r.version !== 1 || !r.stores || typeof r.stores !== "object") return EMPTY_BORROWED;
  const stores: Record<string, StoreShipping> = {};
  for (const [k, s] of Object.entries(r.stores)) {
    if (!s || typeof s.market !== "string" || typeof s.currency !== "string" || !Array.isArray(s.points)) continue;
    const points = s.points.filter(
      (p) => p && Number.isInteger(p.subtotalCents) && p.subtotalCents > 0 && p.rates && Object.values(p.rates).every((c) => c === null || (Number.isInteger(c) && (c as number) >= 0)),
    );
    if (points.some((p) => Object.values(p.rates).some((c) => c != null))) stores[k] = { ...s, points };
  }
  return { version: 1, generatedAt: typeof r.generatedAt === "string" ? r.generatedAt : null, addresses: r.addresses ?? {}, stores };
}

/**
 * Our stores' measurements from the sisters' snapshots: for each of our stores, the sister store with the same host and market
 * (the freshest measurement when both sisters have it). Only a store whose currency is its market's own is kept.
 */
export function borrow(
  ours: { key: string; base: string; market: string }[],
  sisters: { from: string; stores: { key: string; base: string; market: string }[]; snapshot: { addresses?: BorrowedShipping["addresses"]; stores: Record<string, Omit<StoreShipping, "from">> } }[],
  currencyOf: (market: string) => string | null,
  now: Date,
): BorrowedShipping {
  const byHost = new Map<string, StoreShipping>();
  const addresses: BorrowedShipping["addresses"] = {};
  for (const s of sisters) {
    for (const [m, list] of Object.entries(s.snapshot.addresses ?? {})) if (list?.length && !addresses[m]) addresses[m] = list;
    for (const st of s.stores) {
      const meas = s.snapshot.stores[st.key];
      const h = hostOf(st.base);
      if (!meas || !h || meas.market !== st.market) continue;
      const k = `${h}|${st.market}`;
      const cur = byHost.get(k);
      if (!cur || cur.measuredAt < meas.measuredAt) byHost.set(k, { ...meas, from: s.from });
    }
  }
  const stores: Record<string, StoreShipping> = {};
  for (const o of ours) {
    const h = hostOf(o.base);
    const m = h ? byHost.get(`${h}|${o.market}`) : undefined;
    if (m && m.currency === currencyOf(o.market)) stores[o.key] = m;
  }
  return validBorrowed({ version: 1, generatedAt: now.toISOString(), addresses, stores });
}

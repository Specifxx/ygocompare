// The Black Friday / Cyber Monday pages' ONE deal list (owner's review of DexCompare's Black Friday page, 2026-11-24, applied to
// every site: deals above the fold, one list with a toggle, a discount badge on every row, filters and sort, per-row freshness,
// delivered price, a sparkline). It merges the lists the page had: "under TCGplayer's market price" (US, deals()) and "under the
// middle of the stores" (every market, storeDealsIn()). Each row carries ONE offer (the cheapest in-stock store price in its
// market) and both discounts are measured against that same price; the toggle picks which basis ranks and badges the list.
// Pure and browser-safe: the loader is lib/sale-deals-data.ts, the list components/SaleDeals.tsx.

export type SaleBasis = "tcg" | "median";

export interface SaleDealRow {
  key: string;
  id: number;
  slug: string;
  name: string;
  /** The game's short name on a multi-game site, else null. */
  game: string | null;
  productType: string;
  imageUrl: string | null;
  market: string;
  currency: string;
  preorder: boolean;
  priceCents: number;
  storeName: string;
  buyHref: string;
  ebayHref: string | null;
  /** When we last read this store (ISO), or null. */
  checkedAt: string | null;
  /** The store's shipping for this item as we read it, cents (0 = free), or null when unknown. */
  shipCents: number | null;
  /** Under TCGplayer's market price (US dollars on both sides, 8–60% under). */
  tcg: { pct: number; cents: number } | null;
  /** Under the middle price of the 3+ stores that have it in stock in this market (10–45% under). */
  median: { pct: number; cents: number; stores: number } | null;
  /** The last 30 days' cheapest in-stock store price in this market, oldest first (null: nothing recorded that day). */
  spark: (number | null)[];
}

export const PRICE_BANDS = [
  { key: "u50", min: 0, max: 5000 },
  { key: "50-150", min: 5000, max: 15000 },
  { key: "150-500", min: 15000, max: 50000 },
  { key: "500+", min: 50000, max: Infinity },
] as const;
export type PriceBand = (typeof PRICE_BANDS)[number]["key"];

export type SaleSort = "pct" | "price";
export type SaleStock = "all" | "now" | "pre";

export interface SaleFilters {
  basis: SaleBasis;
  market: string;
  game: string; // "" = every game
  type: string; // "" = every type
  band: PriceBand | "";
  stock: SaleStock;
  sort: SaleSort;
}

export const DEFAULT_FILTERS: SaleFilters = { basis: "tcg", market: "US", game: "", type: "", band: "", stock: "all", sort: "pct" };

export function pctOn(row: SaleDealRow, basis: SaleBasis): number | null {
  return row[basis]?.pct ?? null;
}

export function refCents(row: SaleDealRow, basis: SaleBasis): number | null {
  return row[basis]?.cents ?? null;
}

/** Price plus the store's shipping, or null when we do not know it. */
export function deliveredCents(row: SaleDealRow): number | null {
  return row.shipCents == null ? null : row.priceCents + row.shipCents;
}

/** The bases a market's rows can be ranked on (TCGplayer's price is US dollars, so only the US has that one). */
export function basesIn(rows: readonly SaleDealRow[], market: string): SaleBasis[] {
  const here = rows.filter((r) => r.market === market);
  return (["tcg", "median"] as const).filter((b) => here.some((r) => r[b]));
}

/** The rows the filters keep, in the chosen order. A row without a discount on the chosen basis is left out. */
export function applyFilters(rows: readonly SaleDealRow[], f: SaleFilters): SaleDealRow[] {
  const band = PRICE_BANDS.find((b) => b.key === f.band);
  const kept = rows.filter((r) => {
    if (r.market !== f.market) return false;
    if (pctOn(r, f.basis) == null) return false;
    if (f.game && r.game !== f.game) return false;
    if (f.type && r.productType !== f.type) return false;
    if (band && (r.priceCents < band.min || r.priceCents >= band.max)) return false;
    if (f.stock === "now" && r.preorder) return false;
    if (f.stock === "pre" && !r.preorder) return false;
    return true;
  });
  const byPct = (a: SaleDealRow, b: SaleDealRow) => (pctOn(b, f.basis) ?? 0) - (pctOn(a, f.basis) ?? 0) || a.priceCents - b.priceCents || a.name.localeCompare(b.name);
  if (f.sort === "price") return kept.sort((a, b) => a.priceCents - b.priceCents || byPct(a, b));
  return kept.sort(byPct);
}

/** Values of one field among a market's rows with a discount on `basis`, most common first. */
export function valuesOf(rows: readonly SaleDealRow[], f: Pick<SaleFilters, "basis" | "market">, field: "productType" | "game"): string[] {
  const n = new Map<string, number>();
  for (const r of rows) {
    const v = r[field];
    if (r.market === f.market && pctOn(r, f.basis) != null && v) n.set(v, (n.get(v) ?? 0) + 1);
  }
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
}

/** A store read longer ago than this is flagged on its row (owner: "flag anything older than about 12 hours"). */
export const STALE_HOURS = 12;

export function isStale(checkedAt: string | null, now: number = Date.now()): boolean {
  if (!checkedAt) return false;
  const t = Date.parse(checkedAt);
  return Number.isFinite(t) && now - t > STALE_HOURS * 3_600_000;
}

/** "3h ago", "2 days ago", "just now". */
export function agoLabel(iso: string, now: number = Date.now()): string {
  const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (!Number.isFinite(m)) return "";
  if (m < 2) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)} days ago`;
}

/** The sparkline's SVG path (width w, height h), or "" when fewer than two days carry a price. */
export function sparkPath(spark: readonly (number | null)[], w: number, h: number): string {
  const pts = spark.map((c, i) => (c == null ? null : { i, c })).filter((p): p is { i: number; c: number } => p != null);
  if (pts.length < 2) return "";
  const lo = Math.min(...pts.map((p) => p.c));
  const hi = Math.max(...pts.map((p) => p.c));
  const span = hi - lo || 1;
  const step = spark.length > 1 ? w / (spark.length - 1) : w;
  return pts.map((p, k) => `${k ? "L" : "M"}${(p.i * step).toFixed(1)},${(h - 1 - ((p.c - lo) / span) * (h - 2)).toFixed(1)}`).join(" ");
}

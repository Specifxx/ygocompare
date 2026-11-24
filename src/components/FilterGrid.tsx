// A product grid with its filter and sort bar (ListControls.tsx). Server HTML: every tile is in the page, most likely to be
// bought first (lib/home-demand.ts rankProducts); tiles past the first screenful carry .lc-x (hidden) until the visitor asks for
// more, so a type page is a few screens long instead of a hundred. Without scripts the <noscript> rule shows them all.
import type { Product } from "@/lib/site-types";
import { refCents, setById, summaryOf } from "@/lib/data";
import { isPreorder } from "@/lib/preorders";
import { rankProducts } from "@/lib/home-demand";
import { LINES, lineById } from "@/lib/lines";
import { ProductTile } from "@/components/ProductTile";
import { ListControls, type LcGame, type LcSet } from "@/components/ListControls";

/** The printing a sealed title names (YGO Compare matches English product only, so the edition is the split a buyer reads). */
export function editionOf(name: string): "1st" | "unl" | "" {
  if (/\b1st edition\b/i.test(name)) return "1st";
  if (/\bunlimited\b/i.test(name)) return "unl";
  return "";
}

/** How far the cheapest in-stock US store sits under TCGplayer's market price, in whole percent (US$ on both sides; never eBay,
 *  never TCGplayer itself, never a converted price). "" when there is no such store price or it is not under. */
export function underMarket(p: Product): number | "" {
  const ref = refCents(p.id);
  if (!ref) return "";
  const usd = summaryOf(p.id).best.filter((o) => o.market === "US" && o.inStock && o.currency === "USD" && o.source !== "ebay" && o.source !== "tcgplayer");
  if (!usd.length) return "";
  const low = Math.min(...usd.map((o) => o.cents));
  const pct = Math.round((1 - low / ref) * 100);
  return pct > 0 && pct <= 60 ? pct : "";
}

/** What the bar reads of a tile: release date | market cents | stores in stock | pre-order | game | set id | edition | % under market. */
export function lcData(p: Product): string {
  const set = setById(p.setId);
  return [set?.releasedOn ?? "", refCents(p.id) ?? 0, summaryOf(p.id).inStockSources, set && isPreorder(set) ? 1 : 0, set?.line ?? "", p.setId, editionOf(p.name), underMarket(p)].join("|");
}

export function FilterGrid({ items, id = "lc-grid", first = 40, games = false, noun }: { items: Product[]; id?: string; first?: number; games?: boolean; noun?: string }) {
  const ranked = rankProducts(items);
  const counts = new Map<string, number>();
  if (games) for (const p of ranked) { const l = setById(p.setId)?.line; if (l) counts.set(l, (counts.get(l) ?? 0) + 1); }
  const gameList: LcGame[] = LINES.filter((l) => counts.has(l.id)).map((l) => ({ id: l.id, name: lineById(l.id)?.short ?? l.name, n: counts.get(l.id)! }));
  // The set filter (owner's UX review, 2026-11-23, P0 3): every set the list holds, newest first.
  const setCounts = new Map<number, number>();
  for (const p of ranked) setCounts.set(p.setId, (setCounts.get(p.setId) ?? 0) + 1);
  const setList: LcSet[] = [...setCounts]
    .map(([id, n]) => ({ id: String(id), name: setById(id)?.name ?? "Other", date: setById(id)?.releasedOn ?? "", n }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
  // A short list needs no bar (owner's UX review, 2026-11-23: every listing of 8 or more gets one).
  if (ranked.length < 8)
    return <div className="pc-grid">{ranked.map((p) => <ProductTile key={p.id} p={p} />)}</div>;
  return (
    <div className="lc-wrap">
      <noscript><style>{`.lc-x{display:flex!important}.lc{display:none!important}`}</style></noscript>
      <ListControls target={id} total={ranked.length} games={gameList} sets={setList} first={first} noun={noun} />
      <div id={id} className="pc-grid lc-grid">
        {ranked.map((p, i) => <ProductTile key={p.id} p={p} lc={lcData(p)} folded={i >= first} />)}
      </div>
    </div>
  );
}

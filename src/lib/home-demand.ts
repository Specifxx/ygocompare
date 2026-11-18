// The home page's ranking input and how a product reads into it (lib/home-rank.ts; DECISIONS.md "Home pages rank items by
// demand", 2026-11-18). data/demand.json is written by the daily refresh (scripts/pull-demand.sh, from RiftCompare's
// /api/demand/<site>: product page views and buy clicks, last 28 and 7 days) and rides the daily data commit: imported, so a page
// reads no file and no database for it.
import raw from "../../data/demand.json";
import type { Product } from "@/lib/site-types";
import { refCents, setById, summaryOf } from "@/lib/data";
import { isPreorder } from "@/lib/preorders";
import { rankItems, type DemandFile, type RankFacts } from "./home-rank";

export const HOME_DEMAND = raw as DemandFile;

const NOT_A_STORE = new Set(["ebay", "amazon", "tcgplayer"]);

/** What the ranking reads of a product: its page's views, stores in stock, TCGplayer and eBay rows, price, release. */
export function productFacts(p: Product): RankFacts {
  const sm = summaryOf(p.id);
  const set = setById(p.setId);
  const stores = new Set(sm.best.filter((o) => (o.inStock || o.preorder) && !NOT_A_STORE.has(o.source)).map((o) => o.source)).size;
  const tcg = refCents(p.id);
  const usStore = sm.best.filter((o) => o.market === "US" && o.inStock && !NOT_A_STORE.has(o.source)).reduce<number | null>((m, o) => (m == null || o.cents < m ? o.cents : m), null);
  return {
    paths: [`/card/${p.slug}`, `/kit/${p.slug}`],
    clickKey: p.slug,
    priceCents: tcg ?? usStore,
    inStock: stores,
    marketplace: tcg != null,
    paidRows: (tcg != null ? 1 : 0) + (sm.ebay.some((o) => o.inStock) ? 1 : 0),
    releaseDate: set?.releasedOn ?? null,
    preorder: set ? isPreorder(set) : false,
    dropPct: tcg && usStore && usStore < tcg ? (tcg - usStore) / tcg : null,
  };
}

/** Products, most likely to earn first (lib/home-rank.ts). */
export const rankProducts = <T extends Product>(list: readonly T[]): T[] => rankItems(list, productFacts, HOME_DEMAND);

/** Anything that carries a product (a deal, a shelf row), most likely to earn first. */
export const rankBy = <T,>(list: readonly T[], product: (t: T) => Product): T[] => rankItems(list, (t) => productFacts(product(t)), HOME_DEMAND);

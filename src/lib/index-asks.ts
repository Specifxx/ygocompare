// Which product and set pages ask Google to index them (2026-11-19, core-update quality pass): the rules in
// lib/indexing.ts applied to today's data, for the card page, the set page and the sitemap alike.
import { products, refCents, setById, summaryOf } from "./data";
import { sealedInSet } from "./hubs";
import { sealedAsksIndex, setAsksIndex } from "./indexing";
import { searchFound } from "./search-demand";

type P = ReturnType<typeof products>[number];

export function productAsksIndex(p: P): boolean {
  return p.kind === "sealed" && sealedAsksIndex(p, refCents(p.id), summaryOf(p.id), setById(p.setId), searchFound(`/card/${p.slug}`));
}

let bySet: Map<number, number> | null = null;
export function setPageAsksIndex(s: { id: number; slug: string; upcoming?: boolean }): boolean {
  if (!bySet) {
    bySet = new Map();
    for (const p of products()) if (productAsksIndex(p)) bySet.set(p.setId, (bySet.get(p.setId) ?? 0) + 1);
  }
  return sealedInSet(s.id).length > 0 && setAsksIndex(bySet.get(s.id) ?? 0, searchFound(`/sets/${s.slug}`), !!s.upcoming);
}

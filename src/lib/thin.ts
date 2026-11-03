// A product page with nothing to compare (SEO report, 2026-11-03: a YGO card page
// read "worth about — today. Compare 0 live prices"). No TCGplayer price and no
// store, eBay or Amazon offer anywhere means the page says nothing a search result
// could use, so it is noindex,follow and out of the sitemap. Products of a set
// that has not released yet are always kept: in spoiler and pre-order season an
// unpriced card or box is exactly what people search for.
import { refCents, setById, summaryOf } from "./data";
import { isPreorder } from "./preorders";
import type { Product } from "./site-types";

export function hasNothingToCompare(p: Pick<Product, "id" | "setId">): boolean {
  if ((refCents(p.id) ?? 0) > 0) return false;
  // The summary, not the per-set offer shards: the sitemap asks this of every product.
  const s = summaryOf(p.id);
  if (s.listedSources > 0 || s.best.length > 0 || s.ebay.length > 0) return false;
  const set = setById(p.setId);
  return !(set && isPreorder(set));
}

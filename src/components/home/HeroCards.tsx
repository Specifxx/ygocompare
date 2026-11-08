import Link from "@/components/Link";
import type { Product } from "@/lib/site-types";
import { imageAt } from "@/lib/image";
import { money } from "@/lib/format";
import { refCents, setById, summaryOf } from "@/lib/data";
import { shortName } from "@/lib/names";
import { isPreorder } from "@/lib/preorders";

/**
 * The hero's featured products (owner, 2026-11-08: KaeYoung and ScentCompare's hero, "feature some products on the hero"): two big
 * product cards with the photo, the product type, TCGplayer's market price (the tiles' headline, lib/data.ts refCents), and how many
 * stores have it. Plain links to the product pages in the server HTML, with the quick view's data attributes.
 * Nothing here is a heading. Styles: globals.css .hc-*.
 */
export function HeroCards({ items }: { items: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4">
      {items.map((p, i) => {
        const ref = refCents(p.id);
        const e = summaryOf(p.id);
        const setInfo = setById(p.setId);
        const pre = !!setInfo && isPreorder(setInfo);
        const name = shortName(p.name);
        const img = p.image ? imageAt(p.image, "400w") : null;
        return (
          <li key={p.id} className="min-w-0">
            <Link
              href={`/card/${p.slug}`}
              data-qv={p.slug}
              data-qv-name={name}
              data-qv-sub={setInfo?.name || undefined}
              data-qv-img={img ?? undefined}
              className="hc-card group"
            >
              <span className="hc-art plate">
                {img ? (
                  <img
                    src={img}
                    alt={name}
                    width={240}
                    height={240}
                    decoding="async"
                    fetchPriority={i === 0 ? "high" : undefined}
                    className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04] sm:p-4"
                  />
                ) : (
                  <span className="text-sm font-semibold text-muted">{p.sealedType}</span>
                )}
              </span>
              <span className="flex flex-1 flex-col gap-1 border-t border-line p-3 text-left">
                {p.sealedType && <span className="eyebrow truncate">{p.sealedType}</span>}
                <span className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink group-hover:text-brand sm:text-sm">{name}</span>
                <span className="mt-auto pt-1">
                  <span className="tabular font-display text-lg font-bold text-ink sm:text-xl">{money(ref)}</span>
                  <span className="ml-1 text-[11px] text-muted">market</span>
                </span>
                <span className="text-xs text-muted">
                  {e.inStockSources > 0 ? `${pre ? "Pre-order" : "In stock"} at ${e.inStockSources} store${e.inStockSources === 1 ? "" : "s"}` : `Compare ${e.listedSources} price${e.listedSources === 1 ? "" : "s"}`}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

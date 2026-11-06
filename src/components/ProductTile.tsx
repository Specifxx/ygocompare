import Link from "@/components/Link";
import type { Product } from "@/lib/site-types";
import { imageAt } from "@/lib/image";
import { money, pct } from "@/lib/format";
import { refCents, setById, summaryOf } from "@/lib/data";
import { shortName } from "@/lib/names";
import { StockPill } from "./StockPill";

/**
 * A product card (the engine's ProductCard, from MTG Compare): the art on a plate, the name, the set and number, the stock pill,
 * the headline price (TCGplayer market, lib/data.ts refCents) and "Compare N prices →". A plain click opens the quick view
 * (QuickView.tsx); the link itself stays for crawlers and new tabs.
 */
export function ProductTile({ p, change }: { p: Product; change?: number | null }) {
  const ref = refCents(p.id);
  const e = summaryOf(p.id);
  const ch = change !== undefined ? change : e.change7d;
  const stores = e.inStockSources;
  const set = setById(p.setId)?.name;
  const name = shortName(p.name);
  return (
    <Link
      href={`/card/${p.slug}`}
      data-qv={p.slug}
      data-qv-name={name}
      data-qv-sub={[set, p.number].filter(Boolean).join(" · ") || undefined}
      data-qv-img={p.image ? imageAt(p.image, "400w")! : undefined}
      className="group card flex flex-col overflow-hidden p-2 transition-colors hover:border-ink/40"
    >
      <div className="plate aspect-[5/7]">
        {p.image ? (
          <img src={imageAt(p.image, "400w")!} alt={`${name} ${p.kind === "card" ? "card" : ""}`} loading="lazy" decoding="async" className="h-full w-full object-contain p-1.5 transition-transform group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-xs text-neutral-500">No image yet</div>
        )}
      </div>
      <div className="card-body flex flex-1 flex-col gap-1 px-1 pb-1 pt-2.5">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-ink group-hover:text-brand">{name}</p>
        <p className="truncate text-xs text-muted">{set}{p.number ? ` · ${p.number}` : ""}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
          <StockPill state={stores > 0 ? "open" : "soldout"} size="sm">
            {stores > 0 ? (
              <>
                In stock<span className="stock-unit"> · {stores} store{stores === 1 ? "" : "s"}</span>
              </>
            ) : (
              "Sold out"
            )}
          </StockPill>
          {ch != null && <span className={`tabular text-xs font-semibold ${ch >= 0 ? "text-up" : "text-down"}`}>{pct(ch)}</span>}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="tabular text-base font-bold text-ink">{money(ref)}</span>
          <span className="text-[11px] font-semibold text-brand">Compare {e.listedSources} price{e.listedSources === 1 ? "" : "s"} →</span>
        </div>
      </div>
    </Link>
  );
}

export function TileGrid({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((p) => <ProductTile key={p.id} p={p} />)}
    </div>
  );
}

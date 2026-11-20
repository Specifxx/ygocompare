"use client";
// The Hot 100 row's price and Buy button (boardroom, 2026-11-20: Reddit visitors land on the chart and almost never
// click buy, 0.7-3% against 12-23% from Google). The price is the cheapest in-stock store price in the visitor's
// market (summaryOf(id).best, the same figure the set page's quick buy shows), else TCGplayer's. "Buy" is a link to
// the product page that a plain click turns into the quick view (QuickView.tsx), whose price table puts eBay and
// TCGplayer first; a crawler, a new tab or a modified click still gets the product page.
import Link from "@/components/Link";
import { money } from "@/lib/format";
import type { Offer } from "@/lib/site-types";
import { useMarket } from "./ClientPrefs";

export interface HotBuyItem {
  slug: string;
  name: string;
  sub?: string;
  img: string | null;
  /** summaryOf(id).best: the cheapest in-stock offer per market, plus TCGplayer. */
  best: Offer[];
}

export function cheapestFor(best: Offer[], market: string): Offer | null {
  return (
    best.find((o) => o.market === market && o.inStock && o.source !== "tcgplayer") ??
    best.find((o) => o.source === "tcgplayer" && o.inStock) ??
    null
  );
}

export function HotBuy({ item }: { item: HotBuyItem }) {
  const { market } = useMarket();
  const o = cheapestFor(item.best, market);
  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className="hidden w-16 text-right tabular-nums text-muted sm:inline" title="Cheapest in stock in your market">
        {o ? money(o.cents, o.currency) : ""}
      </span>
      <Link
        href={`/card/${item.slug}`}
        data-qv={item.slug}
        data-qv-name={item.name}
        data-qv-sub={item.sub}
        data-qv-img={item.img ?? undefined}
        data-hot-buy=""
        className="btn-buy min-h-9 whitespace-nowrap px-3 py-1 text-xs">
        Buy{o ? <span className="ml-1 tabular-nums sm:hidden">{money(o.cents, o.currency)}</span> : null}
      </Link>
    </span>
  );
}

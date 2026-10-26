"use client";
// The price rows: every offer for the visitor's market, cheapest in-stock
// first, each with a tracked buy button. TCGplayer and eBay US stay listed in
// every market as the reference ("≈" converted at the day's ECB rate).
import { SITE } from "@/site.config";
import { CURRENCY, MARKET_LABEL, type Offer } from "@/lib/site-types";
import { money } from "@/lib/format";
import { goHref } from "@/lib/affiliate";
import { useMarket } from "./ClientPrefs";
import { EbayWord } from "./EbayCallout";

const NAMES: Record<string, string> = {
  tcgplayer: "TCGplayer",
  ebay: "eBay",
  ...Object.fromEntries(SITE.stores.map((s) => [s.key, s.name])),
};

export function sourceName(o: Offer) {
  if (o.source === "ebay") return o.market === "US" ? "eBay" : `eBay ${o.market}`;
  return NAMES[o.source] ?? o.source;
}

export function PriceTable({ offers, fx, productId, page, compact = false }: { offers: Offer[]; fx: Record<string, number>; productId: number; page: string; compact?: boolean }) {
  const { market } = useMarket();
  const local = offers.filter((o) => o.market === market);
  const refs = market === "US" ? [] : offers.filter((o) => o.market === "US" && (o.source === "tcgplayer" || o.source === "ebay"));
  const rows = [...local, ...refs];
  const cur = CURRENCY[market];
  const conv = (o: Offer) => (o.currency === cur ? null : Math.round((o.cents / (fx[o.currency] ?? 1)) * (fx[cur] ?? 1)));
  if (!rows.length)
    return (
      <p className="rounded-lg border border-dashed border-ink-700 p-4 text-sm text-muted">
        No live listings in {MARKET_LABEL[market]} right now. Switch market at the top of the page, or check eBay below.
      </p>
    );
  const shown = compact ? rows.slice(0, 6) : rows;
  const cheapest = local.find((o) => o.inStock);
  return (
    <div className="overflow-hidden rounded-xl border border-ink-700/60">
      <table className="w-full text-sm">
        <thead className="bg-ink-850 text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-3 py-2">Store</th>
            <th className="hidden px-3 py-2 sm:table-cell">Details</th>
            <th className="px-3 py-2 text-right">Price</th>
            <th className="px-3 py-2"><span className="sr-only">Buy</span></th>
          </tr>
        </thead>
        <tbody>
          {shown.map((o, i) => {
            const c = conv(o);
            const best = o === cheapest;
            return (
              <tr key={i} className={`border-t border-ink-800 ${best ? "bg-buy/10" : o.source === "ebay" ? "bg-[#0064d2]/[0.07]" : ""} ${o.inStock ? "" : "opacity-60"}`}>
                <td className="px-3 py-2.5">
                  {o.source === "ebay" ? (
                    <span className="font-medium"><EbayWord className="text-[15px]" />{o.market !== "US" && <span className="ml-1 text-xs text-muted">{o.market}</span>}</span>
                  ) : (
                    <span className="font-medium text-fg">{sourceName(o)}</span>
                  )}
                  {best && <span className="ml-2 rounded bg-buy px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Cheapest</span>}
                </td>
                <td className="hidden px-3 py-2.5 text-xs text-muted sm:table-cell">
                  {o.printing && o.printing !== "Normal" && <span className="chip mr-1">{o.printing}</span>}
                  {o.preorder && <span className="chip mr-1 border-brand text-brand-400">Pre-order</span>}
                  {!o.inStock && <span className="chip mr-1">Out of stock</span>}
                  {o.source === "tcgplayer" && <span>Lowest listing</span>}
                  {o.shippingCents != null && <span>+{money(o.shippingCents, o.currency)} shipping</span>}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                  {money(o.cents, o.currency)}
                  {c != null && <span className="block text-xs font-normal text-muted">≈ {money(c, cur)}</span>}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <a href={goHref(o, productId, page)} rel="sponsored nofollow noopener" target="_blank" className={o.source === "ebay" ? "btn bg-[#0064d2] px-3 py-1.5 text-white hover:bg-[#0053ad]" : "btn-buy"}>
                    {o.source === "ebay" ? "Buy on eBay" : o.inStock ? "Buy" : "View"}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The cheapest in-stock price for the visitor's market, for tiles. */
export function LocalPrice({ offers, fallbackUsd }: { offers: Offer[]; fallbackUsd: number | null }) {
  const { market } = useMarket();
  const o = offers.find((x) => x.market === market && x.inStock);
  if (o) return <span>{money(o.cents, o.currency)}</span>;
  return <span>{money(fallbackUsd, "USD")}</span>;
}

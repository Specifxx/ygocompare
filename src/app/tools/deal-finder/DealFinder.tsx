"use client";
import { useMemo, useState } from "react";
import type { DealRow } from "@/lib/tools";
import { money } from "@/lib/format";
import { goHref } from "@/lib/affiliate";
import { sourceName } from "@/components/PriceTable";
import { useMarket } from "@/components/ClientPrefs";
import { MARKETS, type Market } from "@/lib/site-types";

export function DealFinder({ rows }: { rows: DealRow[] }) {
  const { market } = useMarket();
  const [mk, setMk] = useState<Market | "ALL" | "MINE">("MINE");
  const [kind, setKind] = useState<"all" | "card" | "sealed">("all");
  const [min, setMin] = useState(10);
  const [minPrice, setMinPrice] = useState(5);
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const want = mk === "MINE" ? market : mk;
    return rows.filter(
      (r) =>
        (want === "ALL" || r.offerMarket === want) &&
        (kind === "all" || r.kind === kind) &&
        r.saving >= min &&
        r.market >= minPrice * 100 &&
        (!q || `${r.name} ${r.set}`.toLowerCase().includes(q.toLowerCase())),
    );
  }, [rows, mk, market, kind, min, minPrice, q]);
  const sel = "min-h-10 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-ink/30";
  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        <select className={sel} value={mk} onChange={(e) => setMk(e.target.value as Market)}>
          <option value="MINE">My market ({market})</option>
          <option value="ALL">All markets</option>
          {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className={sel} value={kind} onChange={(e) => setKind(e.target.value as "all")}>
          <option value="all">Cards and sealed</option><option value="card">Cards</option><option value="sealed">Sealed</option>
        </select>
        <select className={sel} value={min} onChange={(e) => setMin(Number(e.target.value))}>
          {[8, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n}%+ under</option>)}
        </select>
        <select className={sel} value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))}>
          {[1, 5, 20, 50, 100].map((n) => <option key={n} value={n}>Worth ${n}+</option>)}
        </select>
        <input className={`${sel} min-w-48 flex-1`} placeholder="Filter by name or set" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="mt-4 text-sm tabular-nums text-muted">{shown.length} {shown.length === 1 ? "deal" : "deals"}</p>
      <div className="card mt-2 overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead className="bg-raised text-left text-xs uppercase tracking-wide text-muted"><tr><th className="px-3 py-2">Product</th><th className="hidden px-3 py-2 sm:table-cell">Where</th><th className="hidden px-3 py-2 text-right sm:table-cell">Market</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Under</th><th /></tr></thead>
          <tbody>
            {shown.slice(0, 300).map((r) => (
              <tr key={`${r.id}-${r.source}-${r.offerMarket}`} className="border-t border-line">
                <td className="min-w-[9rem] px-3 py-2.5"><a className="font-medium hover:underline" href={`/card/${r.slug}`}>{r.name}</a><span className="block text-xs text-muted">{r.set}</span><span className="block text-xs text-muted sm:hidden">{sourceName({ source: r.source, market: r.offerMarket } as never)} {r.offerMarket} · market {money(r.market)}</span></td>
                <td className="hidden px-3 py-2.5 text-muted sm:table-cell">{sourceName({ source: r.source, market: r.offerMarket } as never)} <span className="text-xs">{r.offerMarket}</span></td>
                <td className="hidden px-3 py-2.5 text-right text-muted sm:table-cell">{money(r.market)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-buy-400">{money(r.cents, r.currency)}{r.currency !== "USD" && <span className="block text-xs font-normal text-muted">≈ {money(r.usd)}</span>}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">−{r.saving}%</td>
                <td className="py-2.5 pl-1 pr-3 text-right"><a className="btn-buy" rel="sponsored nofollow noopener" target="_blank" href={goHref({ url: r.url, source: r.source, market: r.offerMarket }, r.id, "deal-finder")}>Buy</a></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <p className="p-6 text-center text-muted">No deals match these filters. Try a lower discount or another market.</p>}
      </div>
    </div>
  );
}

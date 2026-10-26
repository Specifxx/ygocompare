// The homepage banner directly under the hero (Rift Compare's "eBay Picks"
// slot): the most valuable cards with a live US eBay listing from today's
// import, each an affiliate link. Costs no extra eBay calls (built from the
// import's results, data/public/ebay-picks.json).
import { ebayPicks } from "@/lib/data";
import { money } from "@/lib/format";
import { goHref } from "@/lib/affiliate";
import { imageAt } from "@/lib/image";

export function EbayPicks() {
  const picks = ebayPicks().slice(0, 8);
  if (!picks.length) return null;
  return (
    <section data-ad aria-labelledby="ebay-picks" className="card-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="ebay-picks" className="text-lg font-bold">Chase cards on eBay right now</h2>
        <span className="text-xs text-muted">Sponsored · cheapest live Buy It Now</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {picks.map((p) => (
          <a key={p.productId} href={goHref({ url: p.url, source: "ebay", market: "US" }, p.productId, "home-picks")} rel="sponsored nofollow noopener" target="_blank" className="w-36 shrink-0 rounded-lg border border-ink-700 bg-ink-850 p-2 hover:border-brand">
            {p.image && <img src={imageAt(p.image, "200w")!} alt={p.name} loading="lazy" className="mx-auto h-40 object-contain" />}
            <p className="mt-1 line-clamp-2 text-xs">{p.name}</p>
            <p className="text-sm font-bold text-buy-400">{money(p.cents, p.currency)}</p>
            {p.marketCents && <p className="text-[11px] text-muted">Market {money(p.marketCents)}</p>}
          </a>
        ))}
      </div>
    </section>
  );
}

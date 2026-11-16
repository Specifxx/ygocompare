import Link from "@/components/Link";
import { money } from "@/lib/format";
import { imageAt } from "@/lib/image";
import { shortName } from "@/lib/names";
import { summaryOf, setById, type Deal, type StoreDeal } from "@/lib/data";
import { lineOfSet } from "@/lib/lines";
import { sourceNameServer } from "@/lib/sources";
import { goHref, subId, tagged } from "@/lib/affiliate";
import { CartAddButton } from "@/components/cart/CartAddButton";
import type { Product } from "@/lib/site-types";

// A deal as a card (2026-11-16, Black Friday redesign): the photo, the game, the name, the store's price large, what it is
// measured against, the one real badge (the saving), and the two actions every price row carries: the labelled
// "Add to cart" and "View deal". Every figure is a store's own in-stock price at the last read, stores only (never eBay or
// Amazon); the 30-day figure is the product's own TCGplayer market movement from our price history, shown only when it
// fell 5% or more. Never a "was" price, a deadline or urgency copy. Server HTML: every price and link is in the page.

/** The game a product belongs to, "" on a single-game site. */
export function gameOf(p: Product): { id: string; name: string; short: string } | null {
  const l = lineOfSet(setById(p.setId));
  return l ? { id: l.id, name: l.name, short: l.short } : null;
}

function Card({ p, offer, saving, against, againstLabel, page }: { p: Product; offer: Deal["offer"]; saving: number; against: number; againstLabel: string; page: string }) {
  const name = shortName(p.name);
  const img = p.image ? imageAt(p.image, "400w") : null;
  const game = gameOf(p);
  const change30 = summaryOf(p.id).change30d;
  const store = sourceNameServer(offer);
  return (
    <li className="flex gap-3 rounded-xl border border-line bg-raised p-3">
      <Link href={`/card/${p.slug}`} className="plate relative block h-24 w-20 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-24">
        {img ? <img src={img} alt={name} loading="lazy" decoding="async" className="h-full w-full object-contain" /> : <span className="flex h-full items-center justify-center p-1 text-center text-[10px] text-muted">No image</span>}
        <span className="pc-badge" title={`${saving}% under ${againstLabel}`}>−{saving}%</span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {game && <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{game.short}</p>}
        <Link href={`/card/${p.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-brand">{name}</Link>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-xl font-extrabold tabular-nums">{money(offer.cents, offer.currency)}</span>
          <span className="text-xs text-muted">{againstLabel} {money(against, offer.currency)}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
          <span>at {store}</span>
          {change30 != null && change30 <= -5 && <span className="text-up">market down {Math.abs(change30)}% in 30 days</span>}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <a href={goHref(offer, p.id, page)} rel="sponsored nofollow noopener" target="_blank" className="btn-soft min-h-10 whitespace-nowrap px-3 py-1.5 text-sm">
            View deal <span aria-hidden="true">↗</span>
          </a>
          <CartAddButton href={tagged(offer.url, subId(offer.market, `${page}_cart`, p.id), { checkout: true })} productUrl={offer.url} storeName={store} title={name} detail={offer.printing && offer.printing !== "Normal" ? offer.printing : null} priceCents={offer.cents} currency={offer.currency} image={p.image} className="text-muted [&_.ce-cart-more]:!inline" />
        </div>
      </div>
    </li>
  );
}

export function UnderTcgCards({ rows, page }: { rows: Deal[]; page: string }) {
  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {rows.map((d) => <Card key={d.p.id} p={d.p} offer={d.offer} saving={d.saving} against={d.market} againstLabel="TCGplayer market" page={page} />)}
    </ul>
  );
}

export function UnderStoresCards({ rows, page }: { rows: StoreDeal[]; page: string }) {
  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {rows.map((d) => <Card key={d.p.id} p={d.p} offer={d.offer} saving={d.saving} against={d.median} againstLabel={`middle of ${d.stores} stores`} page={page} />)}
    </ul>
  );
}

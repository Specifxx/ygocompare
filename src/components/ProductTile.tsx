import Link from "@/components/Link";
import { SITE } from "@/site.config";
import type { Product } from "@/lib/site-types";
import { imageAt } from "@/lib/image";
import { money } from "@/lib/format";
import { refCents, setById, summaryOf, type Deal } from "@/lib/data";
import { shortName } from "@/lib/names";
import { isPreorder } from "@/lib/preorders";

const STORE_NAME = new Map(SITE.stores.map((s) => [s.key as string, s.name]));

/**
 * A product, as little as says it (owner, 2026-11-13: "cull … all the display aesthetics"): its photo on a plate, its name, one
 * muted stock line and the headline price (TCGplayer market, lib/data.ts refCents). No frame around the card (the plate is the
 * card), no set line (the name says the set), no 7-day figure and no "Compare N prices" cue: the whole card is the link. A plain
 * click opens the quick view (QuickView.tsx reads the data-qv attributes); the link itself stays for crawlers and new tabs.
 * Short classes from globals.css (.pc-*): a type page repeats the card hundreds of times, in the HTML and the payload.
 *
 * `deal` (the home page's deals, lib/data.ts deals): the same card with the store's price as the headline, TCGplayer's market
 * price beside it and the one badge a photo may carry, the saving. Never a badge without a saving.
 */
export function ProductTile({ p, deal }: { p: Product; deal?: Deal }) {
  const ref = refCents(p.id);
  const e = summaryOf(p.id);
  const stores = e.inStockSources;
  const setInfo = setById(p.setId);
  const set = setInfo?.name;
  // Not out yet: a store "in stock" is taking pre-orders (2026-11-06, a box out 13 Nov showed "In stock").
  const pre = !!setInfo && isPreorder(setInfo);
  const name = shortName(p.name);
  const img = p.image ? imageAt(p.image, "400w") : null;
  const unit = deal ? STORE_NAME.get(deal.offer.source) ?? deal.offer.source : `${stores} store${stores === 1 ? "" : "s"}`;
  const open = deal ? true : stores > 0;
  const state = pre ? "Pre-order" : "In stock";
  return (
    <Link
      href={`/card/${p.slug}`}
      data-qv={p.slug}
      data-qv-name={name}
      data-qv-sub={[set, p.number].filter(Boolean).join(" · ") || undefined}
      data-qv-img={img ?? undefined}
      className="group pc-link"
    >
      {/* The photo on its plate (globals.css .plate): white in light mode, a light plate in dark mode, so a store's white-backed
          photo is never a glaring square on a dark page. */}
      <div className="plate pc-plate">
        {img ? <img src={img} alt={p.kind === "card" ? `${name} card` : name} loading="lazy" decoding="async" className="pc-img" /> : <div className="pc-noimg">No image yet</div>}
        {deal && (
          <span className="pc-badge" title={`${deal.saving}% under TCGplayer's market price`}>
            −{deal.saving}%
          </span>
        )}
      </div>
      <div className="card-body pc-body">
        <p className="pc-name">{name}</p>
        <div className="mt-auto">
          {/* Where it can be bought, in one quiet line: only the dot carries the state's colour (calm palette). A card too narrow
              for the count drops it (globals.css .card-body); the line's title keeps the whole sentence. */}
          <p className={`pc-stock ${open ? (pre ? "pc-pre" : "pc-open") : "pc-sold"}`} title={open ? `${state} at ${unit}` : "Sold out at every store we track"}>
            {open ? (
              <>
                {state}
                <span className="stock-unit"> · {unit}</span>
              </>
            ) : (
              "Sold out"
            )}
          </p>
          <p className="pc-row">
            <span className="pc-price">{deal ? money(deal.offer.cents, deal.offer.currency) : money(ref)}</span>
            <span className="pc-per">{deal ? `market ${money(deal.market)}` : "market"}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

/**
 * A grid of products: two across on a phone, five on a desktop's 1200px column (a type page lists every product of its type, so
 * its cards are a size down from the home page's). `roomy`: the home shelf's four across.
 */
export function TileGrid({ items, roomy = false }: { items: Product[]; roomy?: boolean }) {
  return (
    <div className={roomy ? "pc-grid pc-grid-4" : "pc-grid"}>
      {items.map((p) => (
        <ProductTile key={p.id} p={p} />
      ))}
    </div>
  );
}

/** The home page's deals: one card a product, the store's price against TCGplayer's market price. */
export function DealGrid({ items }: { items: Deal[] }) {
  return (
    <div className="pc-grid pc-grid-4">
      {items.map((d) => (
        <ProductTile key={d.p.id} p={d.p} deal={d} />
      ))}
    </div>
  );
}

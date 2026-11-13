"use client";
// The home shelf's market-priced cards (lib/sealed-hero.ts): the newest booster boxes, and the sets on pre-order, at today's
// cheapest store in the visitor's market with the real saving. The page is one cached copy for everyone, so every market's price
// is in the props and the market is picked here on hydration, like every price island. The cards are the site's minimal product
// card (globals.css .pc-*): the photo, the name, one stock line, the price ("From": the cheapest store's; the quick view names
// it). The tabs around them are components/Tabs.tsx; every tab's cards are in the server HTML, so a crawler reads every product.
// Until 2026-11-13 this was SealedHero.tsx, a swipeable row with tabs of its own.
import Link from "@/components/Link";
import { money } from "@/lib/format";
import { MARKET_LABEL, type Market } from "@/lib/site-types";
import type { HeroItem } from "@/lib/sealed-hero";
import { useMarket } from "@/components/ClientPrefs";

function ShelfCard({ i, market }: { i: HeroItem; market: Market }) {
  const pr = i.prices[market] ?? null;
  const pre = !!i.releasesOn || !!pr?.preorder;
  const unit = pr ? `${pr.stores} store${pr.stores === 1 ? "" : "s"}` : "";
  return (
    <Link href={`/card/${i.slug}`} data-qv={i.slug} data-qv-name={i.name} data-qv-sub={i.set ?? undefined} data-qv-img={i.image ?? undefined} className="group pc-link">
      <div className="plate pc-plate">
        {i.image ? <img src={i.image} alt={i.name} width={400} height={400} loading="lazy" decoding="async" className="pc-img" /> : <div className="pc-noimg">No image yet</div>}
        {/* The one badge a photo may carry: a real saving (lib/sealed-hero.ts storeSaving), never a guess. */}
        {pr?.saving && (
          <span className="pc-badge" title={pr.saving.vs === "tcgplayer" ? `${pr.saving.pct}% under TCGplayer's market price` : `${pr.saving.pct}% under the middle store's price`}>
            −{pr.saving.pct}%
          </span>
        )}
      </div>
      <div className="card-body pc-body">
        <p className="pc-name">{i.name}</p>
        <div className="mt-auto">
          <p className={`pc-stock ${pr ? (pre ? "pc-pre" : "pc-open") : "pc-sold"}`} title={pr ? `${pre ? "Pre-order" : "In stock"} at ${unit} in ${MARKET_LABEL[market]}` : undefined}>
            {pr ? (
              <>
                {pre ? "Pre-order" : "In stock"}
                <span className="stock-unit"> · {unit}</span>
              </>
            ) : (
              `Not listed in ${market} yet`
            )}
          </p>
          <p className="pc-row" title={pr ? `${money(pr.cents, pr.currency)} at ${pr.store}` : undefined}>
            {pr && <span className="pc-per">From</span>}
            <span className="pc-price">{pr ? money(pr.cents, pr.currency) : "—"}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

/** One list of the shelf. `sub`: a fact about the list ("Out 4 Dec"), said after what the prices are. */
export function SealedShelf({ items, sub }: { items: HeroItem[]; sub?: string }) {
  const { market } = useMarket();
  // The products this market's stores sell first, the rest in their order.
  const list = [...items].sort((a, b) => Number(!a.prices[market]) - Number(!b.prices[market]));
  return (
    <>
      <p className="-mt-1 mb-5 text-sm text-muted">
        Each at its cheapest store in {MARKET_LABEL[market]} today.{sub ? ` ${sub}.` : ""}
      </p>
      <div className="pc-grid pc-grid-4">
        {list.map((i) => (
          <ShelfCard key={i.id} i={i} market={market} />
        ))}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { byValue, products, setById } from "@/lib/data";
import { InlineAds } from "@/components/InlineAds";
import { adSearch, cardAds } from "@/lib/card-ads";
import { SEALED_ORDER as ORDER, SEALED_PLURAL as PLURAL, sealedHref } from "@/lib/hubs";
import Link from "@/components/Link";
import { TileGrid } from "@/components/ProductTile";

export const revalidate = 86400; // data only changes with a release (DECISIONS.md, "Vercel cost")
export const metadata: Metadata = {
  title: `${SITE.gameShort} booster box prices — cheapest sealed product`,
  description: `Compare ${SITE.game} booster box, booster pack, starter deck and sealed product prices across TCGplayer, eBay and ${SITE.stores.length} stores.`,
  ...canon("/sealed"),
};


// The minimal look (2026-11-13): the headline, one line, the product types as a row of chips (the page's filters: each goes to its
// own page), then the products, the newest sets first within each type.
export default function Sealed() {
  const sealed = products().filter((p) => p.kind === "sealed");
  const groups = ORDER.map((t) => ({ t, items: byValue(sealed.filter((p) => p.sealedType === t)) })).filter((g) => g.items.length);
  const types = groups.filter((g) => sealedHref(g.t));
  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{SITE.gameShort} booster box and sealed prices</h1>
        <p className="mt-3 text-sm text-muted">Newest sets first within each type. Open any product to compare every store.</p>
        {types.length > 1 && (
          <nav aria-label="Product types" className="mt-5">
            {/* One row that scrolls sideways at every width: a wrapping row changes its line count when the web font arrives. */}
            <ul className="scroller -mx-4 scroll-px-4 gap-2 px-4 sm:mx-0 sm:px-0">
              {types.map((g) => (
                <li key={g.t}>
                  <Link href={sealedHref(g.t)!} className="chip min-h-10 whitespace-nowrap">
                    {PLURAL[g.t] ?? g.t} <span className="tabular text-xs text-faint">{g.items.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <InlineAds ads={cardAds({ kind: "sealed", limit: 10 })} search={adSearch()} page="sealed" />
      {groups.map((g) => {
        const href = sealedHref(g.t);
        return (
          <section key={g.t}>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{PLURAL[g.t] ?? g.t}</h2>
              {href && (
                <Link href={href} className="-my-2 inline-flex min-h-10 shrink-0 items-center text-sm font-semibold text-muted transition-colors hover:text-ink">
                  All {g.items.length} →
                </Link>
              )}
            </div>
            <TileGrid items={g.items.sort((a, b) => (setById(b.setId)?.releasedOn ?? "").localeCompare(setById(a.setId)?.releasedOn ?? "")).slice(0, 24)} />
          </section>
        );
      })}
    </div>
  );
}

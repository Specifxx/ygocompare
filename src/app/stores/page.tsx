import type { Metadata } from "next";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { meta } from "@/lib/data";
import { MARKET_LABEL } from "@/lib/site-types";
import { PageHead } from "@/components/Section";
import { Fold } from "@/components/Fold";
import { kitStoreStatus } from "@/lib/kits";
import { SuggestStore } from "@/components/ReportForms";

export const revalidate = 86400;
export const metadata: Metadata = { title: `${SITE.gameShort} stores we compare`, description: `Every online ${SITE.game} store ${SITE.name} compares, by country.`, ...canon("/stores") };

/**
 * Every store, one market a row (2026-11-14): each market folds to one line with its count, and opens to the stores in columns, the
 * name first and what we matched in quiet words after it. Every store, link and count stays in the HTML; the page was a phone's
 * eighteen screens of underlined links.
 */
export default function Stores() {
  const m = meta();
  const markets = [...new Set(SITE.stores.map((s) => s.market))];
  return (
    <article className="mx-auto max-w-4xl">
      <PageHead title={`${SITE.gameShort} stores we compare`} size="article" />
      <div className="prose-site mt-6">
        <p>Plus TCGplayer and eBay (US, UK, Canada and Australia). Know a store we should compare? <a href="#suggest">Suggest it below</a>. Run one? <a href="/list-your-store">List your store</a>, free. Every store is checked before it is listed and every week after: <a href="/how-we-pick-stores">how we pick stores</a>.</p>
      </div>
      <div className="mt-8 border-t border-line">
        {markets.map((mk) => {
          const list = SITE.stores.filter((s) => s.market === mk);
          return (
            <Fold key={mk} id={`stores-${mk.toLowerCase()}`} title={MARKET_LABEL[mk]} meta={`${list.length} ${list.length === 1 ? "store" : "stores"}`}>
              <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <li key={s.key} className="flex min-h-10 min-w-0 items-baseline justify-between gap-3 border-b border-line/70 py-2 text-sm">
                    <a href={s.base} rel="noopener nofollow" className="min-w-0 font-medium text-ink [overflow-wrap:anywhere] hover:text-brand hover:underline hover:underline-offset-2">{s.name}</a>
                    {m?.stores[s.key]?.matched ? <span className="shrink-0 text-xs tabular-nums text-muted">{m.stores[s.key].matched.toLocaleString("en-US")} {m.stores[s.key].matched === 1 ? "listing" : "listings"} matched</span> : null}
                  </li>
                ))}
              </ul>
            </Fold>
          );
        })}
      </div>
      {SITE.kits && (
        <section className="prose-site mt-10">
          <h2>{SITE.kits.label} shops</h2>
          <p>For <a href="/kits">{SITE.kits.noun}</a>, matched by the barcode on the box.</p>
          <ul>
            {SITE.kits.stores.map((s) => (
              <li key={s.key}><a href={s.base} rel="noopener nofollow">{s.name}</a> <span className="text-muted">— {MARKET_LABEL[s.market]}{kitStoreStatus()[s.key]?.matched ? `, ${kitStoreStatus()[s.key].matched.toLocaleString()} kits matched` : ""}</span></li>
            ))}
          </ul>
        </section>
      )}
      <section id="suggest" className="prose-site mt-12">
        <h2>Suggest a store</h2>
        <p>Tell us about a {SITE.gameShort} store we don&apos;t compare yet. We check every suggestion and add the store if we can read its prices.</p>
        <SuggestStore regions={markets.map((mk) => [mk, MARKET_LABEL[mk]])} what={`${SITE.gameShort} products`} buttonClassName="btn-primary" />
      </section>
    </article>
  );
}

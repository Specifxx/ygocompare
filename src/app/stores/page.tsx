import type { Metadata } from "next";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { meta } from "@/lib/data";
import { MARKET_LABEL } from "@/lib/site-types";
import { StaticPage } from "@/components/StaticPage";
import { kitStoreStatus } from "@/lib/kits";

export const revalidate = 86400;
export const metadata: Metadata = { title: `${SITE.gameShort} stores we compare`, description: `Every online ${SITE.game} store ${SITE.name} compares, by country.`, ...canon("/stores") };

export default function Stores() {
  const m = meta();
  const markets = [...new Set(SITE.stores.map((s) => s.market))];
  return (
    <StaticPage title={`${SITE.gameShort} stores we compare`}>
      <p>Plus TCGplayer and eBay (US, UK and Australia). Run a store? <a href="/contact">Ask to be listed</a> — it&apos;s free.</p>
      {markets.map((mk) => (
        <section key={mk}>
          <h2>{MARKET_LABEL[mk]}</h2>
          <ul>
            {SITE.stores.filter((s) => s.market === mk).map((s) => (
              <li key={s.key}><a href={s.base} rel="noopener nofollow">{s.name}</a> {m?.stores[s.key]?.matched ? <span className="text-muted">— {m.stores[s.key].matched.toLocaleString()} listings matched</span> : null}</li>
            ))}
          </ul>
        </section>
      ))}
      {SITE.kits && (
        <section>
          <h2>{SITE.kits.label} shops</h2>
          <p>For <a href="/kits">{SITE.kits.noun}</a>, matched by the barcode on the box.</p>
          <ul>
            {SITE.kits.stores.map((s) => (
              <li key={s.key}><a href={s.base} rel="noopener nofollow">{s.name}</a> <span className="text-muted">— {MARKET_LABEL[s.market]}{kitStoreStatus()[s.key]?.matched ? `, ${kitStoreStatus()[s.key].matched.toLocaleString()} kits matched` : ""}</span></li>
            ))}
          </ul>
        </section>
      )}
    </StaticPage>
  );
}

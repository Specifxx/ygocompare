import type { Metadata } from "next";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { meta } from "@/lib/data";
import { MARKET_LABEL } from "@/lib/site-types";
import { StaticPage } from "@/components/StaticPage";

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
    </StaticPage>
  );
}

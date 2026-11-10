import type { Metadata } from "next";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { StaticPage } from "@/components/StaticPage";

export const revalidate = 86400;
export const metadata: Metadata = { title: "How our prices work", description: `Where ${SITE.name}'s ${SITE.gameShort} prices come from and how often they update.`, ...canon("/methodology") };

export default function Methodology() {
  return (
    <StaticPage title="How our prices work">
      <ul>
        <li><b>TCGplayer market price</b>: the headline price on every product. It is TCGplayer&apos;s market price (what copies actually sold for), refreshed daily. A product nobody has sold yet has no headline price: one seller&apos;s asking price is not a value, so it never ranks in the most valuable lists, trending or set values. Price history and the 7- and 30-day changes are built from it.</li>
        <li><b>Store prices</b> — read once a day from each store&apos;s public catalogue, in the store&apos;s own currency, for a new, sealed copy. A listing is shown only when we can match it to the exact product (set, product type and edition); when in doubt we leave it out. We compare sealed product only, no single cards.</li>
        <li><b>eBay</b> — the cheapest matching Buy It Now listing (ungraded, no lots or proxies). eBay limits how often we can search, so every search goes to sealed product: every booster box, pack, tin and deck in the US, UK, Canada and Australia: every product daily in the US, and every two to three days elsewhere.</li>
        <li><b>Currencies</b> — store prices are shown as the store charges them. Converted figures (marked ≈) use the day&apos;s European Central Bank reference rate.</li>
      </ul>
      <p>The store&apos;s checkout price is always final. Shipping is shown where the listing publishes it.</p>
    </StaticPage>
  );
}

import type { Metadata } from "next";
import { SITE } from "@/site.config";
import { canon, SITE_URL } from "@/lib/site";
import { MARKET_LABEL } from "@/lib/site-types";
import { StaticPage } from "@/components/StaticPage";
import { ListYourStore } from "@/components/ListYourStore";
import { storeBadge } from "@/lib/embed";

// The store-owner page every Compare Empire site shares (owner, 2026-11-04).
export const revalidate = 86400;
export const metadata: Metadata = {
  title: `List your ${SITE.gameShort} store, free`,
  description: `Run a store that sells ${SITE.game} products? Get it listed on ${SITE.name}'s price comparison for free: buyers comparing prices go straight to your product pages.`,
  ...canon("/list-your-store"),
};

function listWords(items: string[]): string {
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items[0] ?? "";
}

export default function ListYourStorePage() {
  const markets = [...new Set([...SITE.stores.map((s) => s.market), ...(SITE.kits?.stores.map((s) => s.market) ?? [])])];
  const storeCount = SITE.stores.length + (SITE.kits?.stores.length ?? 0);
  return (
    <StaticPage title={`List your store on ${SITE.name}`}>
      <ListYourStore
        badge={storeBadge(SITE_URL, SITE.name, SITE.gameShort)}
        showTitle={false}
        site={SITE.name}
        what={`${SITE.gameShort} products`}
        markets={listWords(markets.map((mk) => MARKET_LABEL[mk]))}
        storeCount={storeCount}
        regions={markets.map((mk) => [mk, MARKET_LABEL[mk]])}
        email={SITE.supportEmail}
        pricesRule="a price under a quarter of TCGplayer's market price is dropped as a likely mistake"
        suggestHref="/stores#suggest"
        buttonClassName="btn-buy"
      />
    </StaticPage>
  );
}

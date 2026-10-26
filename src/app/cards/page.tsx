import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { byValue, products, sets } from "@/lib/data";
import { rarityHubs } from "@/lib/hubs";
import { TileGrid } from "@/components/ProductTile";
import { SearchBox } from "@/components/SearchBox";
import { CardSearch } from "./CardSearch";

export const revalidate = 21600;
export const metadata: Metadata = {
  title: `${SITE.gameShort} card prices — every card, cheapest first`,
  description: `Search and compare prices for every ${SITE.game} card across TCGplayer, eBay and ${SITE.stores.length} stores. Updated daily.`,
  ...canon("/cards"),
};

export default function Cards() {
  const top = byValue(products().filter((p) => p.kind === "card")).slice(0, 60);
  return (
    <div>
      <h1 className="font-display text-3xl font-black">{SITE.gameShort} card prices</h1>
      <p className="mt-2 text-muted">Search any card, or browse by set. Every card page compares all the stores we track.</p>
      <div className="my-5 max-w-xl"><SearchBox /></div>
      <Suspense><CardSearch /></Suspense>
      <div className="mb-6 flex flex-wrap gap-2">
        {sets().filter((s) => s.productCount > 20).map((s) => (
          <Link key={s.id} href={`/sets/${s.slug}`} className="chip hover:border-brand">{s.name}</Link>
        ))}
      </div>
      <h2 className="mb-2 text-lg font-bold">Browse by rarity</h2>
      <div className="mb-6 flex flex-wrap gap-2">
        {rarityHubs().map((h) => <Link key={h.slug} href={`/cards/rarity/${h.slug}`} className="chip hover:border-brand">{h.label}</Link>)}
      </div>
      <h2 className="mb-3 text-xl font-bold">Most valuable {SITE.gameShort} cards</h2>
      <TileGrid items={top} />
    </div>
  );
}

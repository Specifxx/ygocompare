"use client";
// The banner under the home hero (the Dex / MTG Compare engine's LandingAds, owner 2026-11-03: eBay and TCGplayer side by side):
// one dashed .ad-box with two panels of real cards and today's prices, eBay (live Buy It Now in the visitor's market, eBay US where
// the market is thin) beside TCGplayer (market price). The tiles are the import's own results (lib/card-ads.ts): no request, no
// extra eBay call. Labelled "Ad" and disclosed; every link goes through /go, rel sponsored.
import { SITE } from "@/site.config";
import type { AdTile, CardAds } from "@/lib/card-ads";
import { ebaySearchUrl, goHref } from "@/lib/affiliate";
import { money } from "@/lib/format";
import { useMarket } from "./ClientPrefs";
import { EbayWord } from "./EbayCallout";
import { ebayTilesFor } from "./SideAds";

const SEARCH_MARKETS = ["US", "UK", "AU", "CA"] as const;
const MIN_TILES = 3;
export const EBAY_BLUE = "#0064d2";
export const TCG_BLUE = "#1f6fe5";

function Panel({ brand, accent, tiles, allHref, tileHref, usd, note }: { brand: React.ReactNode; accent: string; tiles: AdTile[]; allHref: string; tileHref: (t: AdTile) => string; usd?: boolean; note?: string }) {
  return (
    <div className="min-w-0 p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          {brand}
          <span className="ad-pill">Ad</span>
        </span>
        <a href={allHref} rel="sponsored nofollow noopener" target="_blank" className="text-xs font-bold hover:underline" style={{ color: accent }}>
          See all →
        </a>
      </div>
      <ul role="list" className="scroller gap-2">
        {tiles.map((t) => (
          <li key={t.id} className="w-[104px]">
            <a href={tileHref(t)} rel="sponsored nofollow noopener" target="_blank" title={`${t.name} · ${money(t.cents, t.currency)}`} className="group block rounded-lg border border-line bg-surface p-1.5 transition-colors hover:border-ink/40">
              <span className="relative block aspect-[5/7] overflow-hidden rounded-md bg-raised">
                {t.image && <img src={t.image} alt={t.name} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" />}
              </span>
              <span className="mt-1 block truncate text-[11px] font-semibold leading-4 group-hover:text-brand">{t.name}</span>
              <span className="tabular block truncate text-sm font-bold leading-5">
                {usd ? "US" : ""}
                {money(t.cents, t.currency)}
              </span>
            </a>
          </li>
        ))}
      </ul>
      {note && <p className="mt-1.5 text-[10px] text-muted">{note}</p>}
    </div>
  );
}

export function LandingAds({ ads }: { ads: CardAds }) {
  const { market } = useMarket();
  const { tiles: ebayTiles, market: ebayMarket } = ebayTilesFor(ads, market);
  const showEbay = ebayTiles.length >= MIN_TILES;
  const showTcg = ads.tcgplayer.length >= MIN_TILES;
  if (!showEbay && !showTcg) return null;
  const searchMarket = (SEARCH_MARKETS as readonly string[]).includes(market) ? (market as (typeof SEARCH_MARKETS)[number]) : "US";
  const ebayQuery = `${SITE.ebay.query} card`;
  const tcgAll = `https://www.tcgplayer.com/search/${SITE.tcgplayerSlug}/product?productLineName=${SITE.tcgplayerSlug}&view=grid`;
  return (
    <aside data-ad="landing" aria-label="Sponsored listings on eBay and TCGplayer" className="ad-box grid divide-y divide-dashed divide-ad-line md:grid-cols-2 md:divide-x md:divide-y-0">
      {showEbay && (
        <Panel
          brand={<EbayWord className="text-xl" />}
          accent={EBAY_BLUE}
          tiles={ebayTiles.slice(0, 10)}
          allHref={goHref({ url: ebaySearchUrl(ebayQuery, searchMarket), source: "ebay", market: searchMarket }, undefined, "home-ebay-all")}
          tileHref={(t) => goHref({ url: t.url, source: "ebay", market: ebayMarket }, t.id, "home-ebay")}
          note={ebayMarket !== market ? "Buy It Now on eBay US · affiliate links" : "Buy It Now today · affiliate links"}
        />
      )}
      {showTcg && (
        <Panel
          brand={
            <span className="text-lg font-black tracking-tight" aria-label="TCGplayer">
              TCG<span style={{ color: TCG_BLUE }}>player</span>
            </span>
          }
          accent={TCG_BLUE}
          tiles={ads.tcgplayer.slice(0, 10)}
          allHref={goHref({ url: tcgAll, source: "tcgplayer", market: "US" }, undefined, "home-tcg-all")}
          tileHref={(t) => goHref({ url: t.url, source: "tcgplayer", market: "US" }, t.id, "home-tcg")}
          usd={market !== "US"}
          note={market !== "US" ? "Market prices in US$ · affiliate links" : "Market prices today · affiliate links"}
        />
      )}
    </aside>
  );
}

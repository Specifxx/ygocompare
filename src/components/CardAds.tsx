"use client";
// The small card ad pair (lib/card-ads.ts): a slim box of real cards with
// their photos and today's prices, eBay (live Buy It Now in the visitor's
// market) beside TCGplayer (market price). Labelled "Ad" and disclosed. Since
// 2026-11-03 (owner: "get rid of the ads under the hero … have them show up on
// every card page and quick view open … a smaller section") this pair is the
// only card ad on the site: under a card page's price and in the quick view.
// Pages are cached for everyone, so the server sends every market's tiles and
// the visitor's market is picked here.
import { SITE } from "@/site.config";
import type { Market } from "@/lib/site-types";
import type { AdTile, CardAds } from "@/lib/card-ads";
import { ebaySearchUrl, goHref } from "@/lib/affiliate";
import { money } from "@/lib/format";
import { useMarket } from "./ClientPrefs";
import { EbayWord } from "./EbayCallout";

const EBAY_SEARCH_MARKETS = ["US", "UK", "AU", "CA"] as const;
const MIN_TILES = 4;

function TcgWord({ className = "" }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight ${className}`} aria-label="TCGplayer">
      <span className="text-ink">TCG</span>
      <span style={{ color: "#4fa3ff" }}>player</span>
    </span>
  );
}

function AdLabel() {
  return <span className="ad-pill">Ad</span>;
}

function MiniRow({ brand, tiles, href, accent, tileHref, sub }: { brand: React.ReactNode; tiles: AdTile[]; href: string; accent: string; tileHref: (t: AdTile) => string; sub?: string }) {
  return (
    // min-w-0: the row is a grid item, whose min-width is auto, so without it the row grew to the rail's content width (688px on
    // a 390px phone), the rail never scrolled and the card page laid out 713px wide (2026-11-03 phone audit).
    <div className="flex min-w-0 items-stretch gap-2">
      <a href={href} rel="sponsored nofollow noopener" target="_blank" className="flex w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-md text-center" aria-label="See all">
        {brand}
        <span className="text-[10px] font-bold" style={{ color: accent }}>All →</span>
      </a>
      <div className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto pb-1">
        {tiles.map((t) => (
          <a
            key={t.id}
            href={tileHref(t)}
            rel="sponsored nofollow noopener"
            target="_blank"
            title={`${t.name} · ${money(t.cents, t.currency)}${sub ? ` · ${sub}` : ""}`}
            aria-label={`${t.name}, ${money(t.cents, t.currency)}${sub ? `, ${sub}` : ""}`}
            className="group flex w-[56px] shrink-0 snap-start flex-col overflow-hidden rounded-md border border-line bg-surface hover:border-[var(--ad-accent)]"
            style={{ ["--ad-accent" as string]: accent }}
          >
            <span className="relative block aspect-[5/7] overflow-hidden bg-raised">
              {t.image && <img src={t.image} alt={t.name} loading="lazy" decoding="async" className="h-full w-full object-contain p-0.5" />}
            </span>
            <span className="truncate px-1 py-0.5 text-center text-[10px] font-black text-white" style={{ background: accent }}>
              {money(t.cents, t.currency)}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * The small pair (owner, 2026-10-29: "much smaller … near the top … not
 * intrusive"): one slim box of little eBay and TCGplayer tiles under a card or
 * sealed page's own price and Buy button, and in the quick view. /go tags keep
 * `-mini` in the page name, as before, so earlier reports still line up.
 */
export function CompactCardAds({ ads, page, ebayQuery, tcgplayerUrl, limit = 10 }: { ads: CardAds; page: string; ebayQuery: string; tcgplayerUrl: string; limit?: number }) {
  const { market } = useMarket();
  const own = ads.ebay[market] ?? [];
  const useOwn = own.length >= MIN_TILES;
  const ebayTiles = (useOwn ? own : ads.ebay.US ?? []).slice(0, limit);
  const ebayMarket: Market = useOwn ? market : "US";
  const tcgTiles = ads.tcgplayer.slice(0, limit);
  const showEbay = ebayTiles.length >= MIN_TILES;
  const showTcg = tcgTiles.length >= MIN_TILES;
  if (!showEbay && !showTcg) return null;
  const searchMarket = (EBAY_SEARCH_MARKETS as readonly string[]).includes(market) ? (market as (typeof EBAY_SEARCH_MARKETS)[number]) : "US";
  const tag = `${page}-mini`;
  return (
    <aside data-ad aria-label="Sponsored listings on eBay and TCGplayer" className="ad-box grid gap-2 p-2 lg:grid-cols-2">
      {showEbay && (
        <MiniRow
          brand={<EbayWord className="text-base" />}
          tiles={ebayTiles}
          accent="#0064d2"
          href={goHref({ url: ebaySearchUrl(ebayQuery, searchMarket), source: "ebay", market: searchMarket }, undefined, `${tag}-ebay-strip-all`)}
          tileHref={(t) => goHref({ url: t.url, source: "ebay", market: ebayMarket }, t.id, `${tag}-ebay-strip`)}
          sub="eBay Buy It Now"
        />
      )}
      {showTcg && (
        <MiniRow
          brand={<TcgWord className="text-[11px]" />}
          tiles={tcgTiles}
          accent="#1f6fe5"
          href={goHref({ url: tcgplayerUrl, source: "tcgplayer", market: "US" }, undefined, `${tag}-tcg-strip-all`)}
          tileHref={(t) => goHref({ url: t.url, source: "tcgplayer", market: "US" }, t.id, `${tag}-tcg-strip`)}
          sub="TCGplayer market"
        />
      )}
      <p className="flex items-center gap-2 text-[10px] leading-tight text-muted lg:col-span-2">
        <AdLabel />
        <span>Sponsored: {SITE.name} may earn a commission from eBay and TCGplayer purchases, at no cost to you.{ebayMarket !== market && showEbay ? " eBay tiles from eBay US." : ""}{market !== "US" && showTcg ? " TCGplayer prices in US$." : ""}</span>
      </p>
    </aside>
  );
}

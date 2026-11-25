"use client";
// The gutter ads (owner, 2026-11-25: "Why are the display ads at the very bottom of the site? … there's so much space on the left and
// the right side of the website"). On a wide desktop the page is one 1200px column with empty space either side; each side now holds
// one slim, labelled column of the import's own eBay and TCGplayer tiles (lib/card-ads.ts: no request, no extra eBay call).
// This reverses "no side rails" (2026-11-13) on the owner's word; it is not the old rail: the page column keeps its full width.
//
//   • Only where it fits: from GUTTER_MIN px wide (1440px laptops up), sized to the empty space (globals.css `.gutter-ads`), never over the page
//     column, the header or the footer: each column sits absolutely inside <main> beside the page and its card is sticky under the
//     header, so it ends where the content ends. Below GUTTER_MIN nothing mounts (phones keep the dock).
//   • Browser only: nothing in the server HTML (no SEO change), absolutely placed, so nothing on the page moves when it mounts (CLS 0).
//   • Calm and labelled: the site's card, an "Ad" pill, rel sponsored through /go under `gutter-ebay` / `gutter-tcg` (and `-all`).
//   • Never for ad-free members or in the app ([data-adfree], .capacitor-native), never on the ad-free pages (AdRouteGate).
//   • Static: nothing animates, nothing opens, nothing covers anything; the tiles scroll inside the card when the window is short.
//   • `sides`: "both" (eBay left, TCGplayer right) on a heavy-ad site, "right" (TCGplayer only) on a light one.
import { useEffect, useState } from "react";
import { SITE } from "@/site.config";
import type { AdTile, CardAds } from "@/lib/card-ads";
import { ebaySearchUrl, goHref } from "@/lib/affiliate";
import { money } from "@/lib/format";
import { ebayTilesFor } from "@/lib/inline-ads";
import { useMarket } from "./ClientPrefs";

/** The narrowest window with room for a column beside the page's 1152px content (about 110px each, 14px clear of it): 1440px laptops up. */
export const GUTTER_MIN = 1440;
/** Up to this many tiles a column, popular first. */
export const GUTTER_TILES = 8;
const MIN_TILES = 2;
const SEARCH_MARKETS = ["US", "UK", "AU", "CA"] as const;

export function GutterAds({ ads, search, sides = "both" }: { ads: CardAds; search: { ebayQuery: string; tcgplayerUrl: string }; sides?: "both" | "right" }) {
  const [wide, setWide] = useState(false);
  const { market } = useMarket();
  useEffect(() => {
    if (document.documentElement.matches("[data-adfree], .capacitor-native")) return;
    const mq = window.matchMedia(`(min-width: ${GUTTER_MIN}px)`);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  if (!wide) return null;

  const searchMarket = (SEARCH_MARKETS as readonly string[]).includes(market) ? (market as (typeof SEARCH_MARKETS)[number]) : "US";
  const { tiles, market: ebayMarket } = ebayTilesFor(ads, market);
  const ebay = tiles.filter((t) => t.image).slice(0, GUTTER_TILES);
  const tcg = ads.tcgplayer.filter((t) => t.image).slice(0, GUTTER_TILES);
  const us = market === "US";

  return (
    <>
      {sides === "both" && ebay.length >= MIN_TILES && (
        <Column
          side="left"
          brand="eBay"
          sub={`${SITE.gameShort} sealed`}
          cta="See all"
          ctaHref={goHref({ url: ebaySearchUrl(search.ebayQuery, searchMarket), source: "ebay", market: searchMarket }, undefined, "gutter-ebay-all")}
          tiles={ebay}
          line="Buy It Now"
          price={(t) => money(t.cents, t.currency)}
          href={(t) => goHref({ url: t.url, source: "ebay", market: ebayMarket }, t.id, "gutter-ebay")}
        />
      )}
      {tcg.length >= MIN_TILES && (
        <Column
          side="right"
          brand="TCGplayer"
          sub={`${SITE.gameShort} sealed`}
          cta="See all"
          ctaHref={goHref({ url: search.tcgplayerUrl, source: "tcgplayer", market: "US" }, undefined, "gutter-tcg-all")}
          tiles={tcg}
          line="Market price"
          price={(t) => (us ? money(t.cents, t.currency) : `US${money(t.cents, t.currency)}`)}
          href={(t) => goHref({ url: t.url, source: "tcgplayer", market: "US" }, t.id, "gutter-tcg")}
        />
      )}
    </>
  );
}

function Column({ side, brand, sub, cta, ctaHref, tiles, line, price, href }: {
  side: "left" | "right";
  brand: string;
  sub: string;
  cta: string;
  ctaHref: string;
  tiles: AdTile[];
  line: string;
  price: (t: AdTile) => string;
  href: (t: AdTile) => string;
}) {
  return (
    <div className={`gutter-ads gutter-ads-${side}`}>
      <aside data-ad="gutter" aria-label={`Sponsored: ${brand}`} className="gutter-card card">
        <p className="flex shrink-0 items-center gap-1.5">
          <span className="ad-pill">Ad</span>
          <span className="truncate font-display text-sm font-bold tracking-tight">{brand}</span>
        </p>
        <p className="mt-0.5 shrink-0 truncate text-[11px] leading-4 text-muted">{sub}</p>
        <ul role="list" className="gutter-list">
          {tiles.map((t) => (
            <li key={t.id}>
              <a href={href(t)} rel="sponsored nofollow noopener" target="_blank" className="group block" title={`${t.name} · ${price(t)}`}>
                <span className="plate relative block aspect-[4/3] w-full">
                  <img src={t.image!} alt={t.name} width={160} height={120} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain p-1" />
                </span>
                <span className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 group-hover:text-brand">{t.name}</span>
                <span className="tabular block truncate text-sm font-bold leading-[18px]">{price(t)}</span>
                <span className="block truncate text-[10px] uppercase leading-[14px] tracking-wide text-muted">{line}</span>
              </a>
            </li>
          ))}
        </ul>
        <a href={ctaHref} rel="sponsored nofollow noopener" target="_blank" className="btn-ad mt-2 w-full shrink-0 !px-2 !py-1.5 text-center text-xs">
          {cta} <span aria-hidden="true">→</span><span className="sr-only"> on {brand}</span>
        </a>
      </aside>
    </div>
  );
}

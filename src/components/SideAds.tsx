"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { SITE } from "@/site.config";
import type { AdTile, CardAds } from "@/lib/card-ads";
import { ebaySearchUrl, goHref } from "@/lib/affiliate";
import { money } from "@/lib/format";
import type { Market } from "@/lib/site-types";
import { useMarket } from "./ClientPrefs";
import { EbayWord } from "./EbayCallout";
import { AdDock, DockGate, DockTile, DOCK_LINK, type DockSide } from "./AdDock";

// The two side rails (the Dex / MTG Compare engine's, owner 2026-11-03: "the left side could be eBay and the right side
// TCGplayer … only if you can fit it"): real eBay Buy It Now listings for the newest sets' chase cards stacked down the far left
// of a wide screen, TCGplayer's market prices for them down the far right, both OUTSIDE the page shell (max-w-shell, 1480px),
// fixed beside it under the sticky header.
//
//   • Browser only, from 1280px wide (owner 2026-11-06: every regular 16:9 and 16:10 screen). Nothing is in the server HTML: the
//     rails mount after hydration and only while the viewport is at least MIN_WIDTH wide, so crawlers, tablets and phones never see
//     them (no SEO change, CLS 0: a fixed element takes no space; the room beside the shell is CSS, globals.css). The tiles are the import's own eBay results and
//     TCGplayer prices (lib/card-ads.ts, from summary.json): no request, no extra eBay call, and the visitor's market picks which eBay tiles show.
//   • Each rail runs from under the header to the window's foot and scrolls through up to ten tiles, popular first (owner
//     2026-11-06); a window too short for one whole tile shows no rail.
//   • Labelled "Ad" with the affiliate note, every link rel sponsored through /go under its own page tag (side-ebay, side-tcg).
//     Not a pop-up: nothing moves, covers content or asks for anything.

/**
 * From MIN_WIDTH (1280px: every common 16:9 and 16:10 laptop and monitor, owner 2026-11-06: "it should appear on regular 16:9
 * screens … 16:10 even") a rail RAIL_W wide sits on each side of the shell, flush against the window's edge (2026-11-07), outside the
 * shell. Below 1864px the shell gives up that room (globals.css: max-width min(1480px, 100vw - 320px)); from 1864px it is its full
 * 1480px and the rails sit just outside it.
 */
export const RAIL_W = 136;
export const MIN_WIDTH = 1280; // the RAIL class below and the globals.css shell rule say the same
/** Vertical budget: the sticky header (--hdr, 64px from lg) and a gutter above, a gutter below, the rail's own top line and note. */
const TOP = 64;
const HEAD = 30;
const NOTE = 34;
const PAD = 0;
/** One tile: 8px padding, a (RAIL_W - 16 - 16)px square picture, two title lines (36px) and a price line (20px). */
export const TILE_H = 8 + (RAIL_W - 1 - 16) + 6 + 36 + 20 + 8;
/** Up to ten tiles, popular first; the list scrolls inside the rail (owner, 2026-11-06: "scrollable … up to 10 products"). */
export const MAX_TILES = 10;
const MIN_TILES = 2;

/** Whether a window this tall holds a rail with at least one whole tile in view (the rest scroll). Pure, for the tests. */
export function railFits(innerHeight: number): boolean {
  return innerHeight - TOP - HEAD - NOTE - PAD >= TILE_H;
}

/** The eBay tiles for a market, or eBay US where the market is thin. Pure, for the tests. */
export function ebayTilesFor(ads: CardAds, market: Market): { tiles: AdTile[]; market: Market } {
  const own = ads.ebay[market] ?? [];
  if (own.length >= MIN_TILES) return { tiles: own, market };
  return { tiles: ads.ebay.US ?? [], market: "US" };
}

/** `search`: lib/card-ads.ts adSearch(), computed on the server (this file is client-side and never reads the data files). */
export interface AdSearch {
  ebayQuery: string;
  tcgplayerUrl: string;
}

/**
 * The side rails are OFF (owner, 2026-11-13: "banner ads on the side … doesn't look as good … fill in that space on the side again").
 * The ads are the horizontal strips inside the page (and the phone dock on small screens). The rail code below stays so a rail can
 * be tried again; nothing renders it while this is false, and globals.css gives the page column the whole width.
 */
export const SIDE_RAILS = false;

export function SideAds({ ads, search }: { ads: CardAds; search: AdSearch }) {
  const [fit, setFit] = useState(false);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
    const phone = window.matchMedia(`(min-width: ${DOCK_BELOW}px)`);
    const update = () => {
      setFit(mq.matches && railFits(window.innerHeight));
      setNarrow(!phone.matches);
    };
    update();
    mq.addEventListener("change", update);
    phone.addEventListener("change", update);
    window.addEventListener("resize", update, { passive: true });
    return () => {
      mq.removeEventListener("change", update);
      phone.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  // Too narrow for the rails (phones, tablets, a small window): the same tiles in the phone dock (AdDock.tsx).
  if (narrow) return <PhoneDock ads={ads} />;
  if (!SIDE_RAILS || !fit) return null;
  return (
    <>
      <EbayRail ads={ads} query={search.ebayQuery} />
      <RightRail ads={ads} search={search} />
    </>
  );
}

const RAIL = "fixed z-30 hidden flex-col border-line bg-surface min-[1280px]:flex";
const TILE = "group flex flex-col border-b border-line bg-surface p-2 transition-colors hover:bg-raised";
// Flush (owner, 2026-11-07: "I don't like how it's floating … no gap"): from the header to the window's foot, against the window's
// edge, square, one hairline facing the page; tiles stack edge to edge with hairline dividers.
const railStyle = (side: "left" | "right"): CSSProperties => ({ top: "var(--hdr)", bottom: 0, width: RAIL_W, ...(side === "left" ? { left: 0, borderRightWidth: 1 } : { right: 0, borderLeftWidth: 1 }) });
const SEARCH_MARKETS = ["US", "UK", "AU", "CA"] as const;

function EbayRail({ ads, query }: { ads: CardAds; query: string }) {
  const { market } = useMarket();
  const { tiles, market: ebayMarket } = ebayTilesFor(ads, market);
  if (tiles.length < MIN_TILES) return null;
  const searchMarket = (SEARCH_MARKETS as readonly string[]).includes(market) ? (market as (typeof SEARCH_MARKETS)[number]) : "US";
  return (
    <div role="group" data-ad="side-ebay" aria-label={`Sponsored: ${SITE.gameShort} cards on eBay`} className={RAIL} style={railStyle("left")}>
      <Head brand={<EbayWord className="text-lg" />} />
      <ul role="list" className="rail-scroll grid min-h-0 flex-1 content-start overflow-y-auto overscroll-contain border-t border-line">
        {tiles.slice(0).map((t) => (
          <li key={t.id}>
            <a href={goHref({ url: t.url, source: "ebay", market: ebayMarket }, t.id, "side-ebay")} rel="sponsored nofollow noopener" target="_blank" className={TILE} title={`${t.name} · ${money(t.cents, t.currency)}`}>
              <span className="relative block aspect-square w-full overflow-hidden rounded-md bg-raised">
                {t.image && <img src={t.image} alt={t.name} width={128} height={128} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain p-1" />}
              </span>
              <span className="mt-1.5 line-clamp-2 h-9 text-xs font-semibold leading-[18px] group-hover:text-brand">{t.name}</span>
              <span className="tabular block h-5 truncate text-[15px] font-bold leading-5">{money(t.cents, t.currency)}</span>
              <span className="sr-only">, on eBay</span>
            </a>
          </li>
        ))}
      </ul>
      <Note href={goHref({ url: ebaySearchUrl(query, searchMarket), source: "ebay", market: searchMarket }, undefined, "side-ebay-all")} label="All on eBay →" note={ebayMarket !== market ? "Affiliate links · eBay US" : "Affiliate links · we may earn"} />
    </div>
  );
}

function RightRail({ ads, search }: { ads: CardAds; search: AdSearch }) {
  const { market } = useMarket();
  return ads.tcgplayer.length >= MIN_TILES ? <TcgRail tiles={ads.tcgplayer} all={search.tcgplayerUrl} /> : null;
}

function TcgRail({ tiles, all }: { tiles: AdTile[]; all: string }) {
  const { market } = useMarket();
  const us = market === "US";
  const price = (t: AdTile) => (us ? money(t.cents, t.currency) : `US${money(t.cents, t.currency)}`);
  return (
    <div role="group" data-ad="side-tcg" aria-label={`Sponsored: ${SITE.gameShort} cards on TCGplayer`} className={RAIL} style={railStyle("right")}>
      <Head
        brand={
          <span className="text-[15px] font-black tracking-tight" aria-label="TCGplayer">
            TCG<span className="text-[#1f6fe5]">player</span>
          </span>
        }
      />
      <ul role="list" className="rail-scroll grid min-h-0 flex-1 content-start overflow-y-auto overscroll-contain border-t border-line">
        {tiles.slice(0).map((t) => (
          <li key={t.id}>
            <a href={goHref({ url: t.url, source: "tcgplayer", market: "US" }, t.id, "side-tcg")} rel="sponsored nofollow noopener" target="_blank" className={TILE} title={`${t.name} · ${price(t)}`}>
              <span className="plate relative block aspect-square w-full overflow-hidden rounded-md">
                {t.image && <img src={t.image} alt={t.name} width={128} height={128} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain p-1" />}
              </span>
              <span className="mt-1.5 line-clamp-2 h-9 text-xs font-semibold leading-[18px] group-hover:text-[#1f6fe5]">{t.name}</span>
              <span className="tabular block h-5 truncate text-[15px] font-bold leading-5">{price(t)}</span>
              <span className="sr-only">, on TCGplayer</span>
            </a>
          </li>
        ))}
      </ul>
      <Note href={goHref({ url: all, source: "tcgplayer", market: "US" }, undefined, "side-tcg-all")} label="All on TCGplayer →" note={us ? "Affiliate links · we may earn" : "Affiliate links · in US$"} />
    </div>
  );
}

function Head({ brand }: { brand: ReactNode }) {
  return (
    <div className="flex h-[30px] shrink-0 items-center justify-between px-2">
      {brand}
      <span className="ad-pill">Ad</span>
    </div>
  );
}

function Note({ href, label, note }: { href: string; label: string; note: string }) {
  return (
    <p className="flex h-[34px] shrink-0 flex-col justify-center px-2 text-[10px] leading-[13px] text-muted">
      <a href={href} rel="sponsored nofollow noopener" target="_blank" className="truncate font-bold text-brand">
        {label}
      </a>
      <span className="truncate">{note}</span>
    </p>
  );
}

/** The dock shows below the common laptop width (1280px), where no rail ever does. */
const DOCK_BELOW = Math.min(MIN_WIDTH, 1280);

/**
 * The phone dock (owner, 2026-11-06: the rails "on mobile … in the best way that doesn't interrupt user experience"): the rails'
 * own tiles, eBay and TCGplayer taking turns, in one bar along the foot of a narrow screen. AdDock.tsx has the rules; it yields to
 * every ad unit on the page (.ad-box, [data-ad]) and never shows on a card page (its buy bar, CardBuy's data-buybar).
 */
function PhoneDock({ ads }: { ads: CardAds }) {
  const { market } = useMarket();
  const { tiles, market: ebayMarket } = ebayTilesFor(ads, market);
  const us = market === "US";
  const tcgPrice = (t: AdTile) => (us ? money(t.cents, t.currency) : `US${money(t.cents, t.currency)}`);
  const tcgBrand = (
    <span className="font-black tracking-tight text-ink" aria-label="TCGplayer">
      TCG<span className="text-[#1f6fe5]">player</span>
    </span>
  );
  const sides: DockSide[] = [];
  const ebay = tiles.filter((t) => t.image).slice(0, MAX_TILES);
  if (ebay.length >= MIN_TILES)
    sides.push({
      key: "ebay",
      items: ebay.map((t) => (
        <a key={t.id} href={goHref({ url: t.url, source: "ebay", market: ebayMarket }, t.id, "dock-ebay")} rel="sponsored nofollow noopener" target="_blank" className={DOCK_LINK} title={`${t.name} · ${money(t.cents, t.currency)}`}>
          <DockTile img={t.image!} alt={t.name} brand={<EbayWord className="text-[11px]" />} title={t.name} price={money(t.cents, t.currency)} cta="View" />
          <span className="sr-only">, on eBay</span>
        </a>
      )),
    });
  const tcg = ads.tcgplayer.filter((t) => t.image).slice(0, MAX_TILES);
  if (tcg.length >= MIN_TILES)
    sides.push({
      key: "tcgplayer",
      items: tcg.map((t) => (
        <a key={t.id} href={goHref({ url: t.url, source: "tcgplayer", market: "US" }, t.id, "dock-tcg")} rel="sponsored nofollow noopener" target="_blank" className={DOCK_LINK} title={`${t.name} · ${tcgPrice(t)}`}>
          <DockTile img={t.image!} alt={t.name} brand={tcgBrand} title={t.name} price={tcgPrice(t)} cta="View" plate />
          <span className="sr-only">, on TCGplayer</span>
        </a>
      )),
    });
  if (sides.length === 0) return null;
  return (
    <DockGate minWidth={DOCK_BELOW}>
      <AdDock label={`Sponsored: ${SITE.gameShort} on eBay and TCGplayer`} sides={sides} placement="dock" minWidth={DOCK_BELOW} yieldTo=".ad-box, [data-ad]" />
    </DockGate>
  );
}

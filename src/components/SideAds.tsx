"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { SITE } from "@/site.config";
import type { AdTile, CardAds } from "@/lib/card-ads";
import { ebaySearchUrl, goHref } from "@/lib/affiliate";
import { money } from "@/lib/format";
import type { Market } from "@/lib/site-types";
import { useMarket } from "./ClientPrefs";
import { EbayWord } from "./EbayCallout";

// The two side rails (the Dex / MTG Compare engine's, owner 2026-11-03: "the left side could be eBay and the right side
// TCGplayer … only if you can fit it"): real eBay Buy It Now listings for the newest sets' chase cards stacked down the far left
// of a wide screen, TCGplayer's market prices for them down the far right, both OUTSIDE the page shell (max-w-shell, 1480px),
// fixed beside it under the sticky header.
//
//   • Browser only, wide screens only. Nothing is in the server HTML: the rails mount after hydration and only while the viewport
//     is at least MIN_WIDTH wide, so crawlers, laptops, tablets and phones never see them (no SEO change, no layout change, CLS 0:
//     a fixed element takes no space). The tiles are the import's own eBay results and TCGplayer prices (lib/card-ads.ts, from
//     summary.json): no request, no extra eBay call, and the visitor's market picks which eBay tiles show.
//   • As many tiles as the window's height fits, never a clipped one; a window too short for one tile shows no rail.
//   • Labelled "Ad" with the affiliate note, every link rel sponsored through /go under its own page tag (side-ebay, side-tcg).
//     Not a pop-up: nothing moves, covers content or asks for anything.

/** The shell is 1480px; each rail is RAIL_W wide with GUTTER on both sides of it. */
const SHELL_W = 1480;
export const RAIL_W = 160;
const GUTTER = 16;
export const MIN_WIDTH = SHELL_W + 2 * (RAIL_W + 2 * GUTTER); // 1864: the RAIL class below says the same
/** Vertical budget: the sticky header (--hdr, 64px from lg) and a gutter above, a gutter below, the rail's own top line and note. */
const TOP = 64 + GUTTER;
const HEAD = 30;
const NOTE = 34;
const PAD = 2 * 8;
const GAP = 8;
/** One tile: 8px padding, a (RAIL_W - 16 - 16)px square picture, two title lines (36px) and a price line (20px). */
export const TILE_H = 8 + (RAIL_W - PAD - 16) + 6 + 36 + 20 + 8;
export const MAX_TILES = 6;
const MIN_TILES = 2;

/** How many tiles a window of this height fits (0: no rail). Pure, for the tests. */
export function tilesThatFit(innerHeight: number): number {
  const room = innerHeight - TOP - GUTTER - HEAD - NOTE - PAD;
  return Math.max(0, Math.min(MAX_TILES, Math.floor((room + GAP) / (TILE_H + GAP))));
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

export function SideAds({ ads, search }: { ads: CardAds; search: AdSearch }) {
  const [fit, setFit] = useState(0);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
    const update = () => setFit(mq.matches ? tilesThatFit(window.innerHeight) : 0);
    update();
    mq.addEventListener("change", update);
    window.addEventListener("resize", update, { passive: true });
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  if (fit < 1) return null;
  return (
    <>
      <EbayRail ads={ads} fit={fit} query={search.ebayQuery} />
      {ads.tcgplayer.length >= MIN_TILES && <TcgRail tiles={ads.tcgplayer} fit={fit} all={search.tcgplayerUrl} />}
    </>
  );
}

const RAIL = "fixed z-30 hidden flex-col rounded-xl border border-line bg-surface p-2 shadow-card min-[1864px]:flex";
const TILE = "group flex flex-col rounded-lg border border-line bg-surface p-2 transition-colors hover:border-ink/40";
const EDGE = `calc(50% - ${SHELL_W / 2 + GUTTER + RAIL_W}px)`;
const railStyle = (side: "left" | "right"): CSSProperties => ({ top: `calc(var(--hdr) + ${GUTTER}px)`, width: RAIL_W, ...(side === "left" ? { left: EDGE } : { right: EDGE }) });
const SEARCH_MARKETS = ["US", "UK", "AU", "CA"] as const;

function EbayRail({ ads, fit, query }: { ads: CardAds; fit: number; query: string }) {
  const { market } = useMarket();
  const { tiles, market: ebayMarket } = ebayTilesFor(ads, market);
  if (tiles.length < MIN_TILES) return null;
  const searchMarket = (SEARCH_MARKETS as readonly string[]).includes(market) ? (market as (typeof SEARCH_MARKETS)[number]) : "US";
  return (
    <div role="group" data-ad="side-ebay" aria-label={`Sponsored: ${SITE.gameShort} cards on eBay`} className={RAIL} style={railStyle("left")}>
      <Head brand={<EbayWord className="text-lg" />} />
      <ul role="list" className="grid gap-2">
        {tiles.slice(0, fit).map((t) => (
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

function TcgRail({ tiles, fit, all }: { tiles: AdTile[]; fit: number; all: string }) {
  const { market } = useMarket();
  const us = market === "US";
  const price = (t: AdTile) => (us ? money(t.cents, t.currency) : `US${money(t.cents, t.currency)}`);
  return (
    <div role="group" data-ad="side-tcg" aria-label={`Sponsored: ${SITE.gameShort} cards on TCGplayer`} className={RAIL} style={railStyle("right")}>
      <Head
        brand={
          <span className="text-base font-black tracking-tight" aria-label="TCGplayer">
            TCG<span className="text-[#1f6fe5]">player</span>
          </span>
        }
      />
      <ul role="list" className="grid gap-2">
        {tiles.slice(0, fit).map((t) => (
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
    <div className="mb-2 flex h-[22px] items-center justify-between px-1">
      {brand}
      <span className="ad-pill">Ad</span>
    </div>
  );
}

function Note({ href, label, note }: { href: string; label: string; note: string }) {
  return (
    <p className="mt-2 flex h-[26px] flex-col justify-center px-1 text-[10px] leading-[13px] text-muted">
      <a href={href} rel="sponsored nofollow noopener" target="_blank" className="truncate font-bold text-brand">
        {label}
      </a>
      <span className="truncate">{note}</span>
    </p>
  );
}

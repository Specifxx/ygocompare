"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/site.config";
import type { AdTile, CardAds } from "@/lib/card-ads";
import { goHref } from "@/lib/affiliate";
import { money } from "@/lib/format";
import { ebayTilesFor } from "@/lib/inline-ads";
import { useMarket } from "./ClientPrefs";
import { EbayWord } from "./EbayCallout";
import { AdDock, DockGate, DockTile, DOCK_LINK, type DockSide } from "./AdDock";

// The phone dock's feed (owner, 2026-11-06). The side rails that used to share this file are gone (owner, 2026-11-13: one native
// horizontal block inside the page instead, components/InlineAds.tsx). What stays is the dock on a narrow screen: the same eBay and
// TCGplayer tiles in one bar along the foot of the window, after a scroll, never on a product page (AdDock.tsx has the rules).

export const MIN_WIDTH = 1280;
/** Up to ten tiles per side, popular first. */
export const MAX_TILES = 10;
const MIN_TILES = 2;

export function DockAds({ ads }: { ads: CardAds }) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const phone = window.matchMedia(`(min-width: ${DOCK_BELOW}px)`);
    const update = () => setNarrow(!phone.matches);
    update();
    phone.addEventListener("change", update);
    return () => phone.removeEventListener("change", update);
  }, []);
  return narrow ? <PhoneDock ads={ads} /> : null;
}

/** The dock shows below the common laptop width (1280px). */
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

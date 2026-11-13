// The ONE in-content ad block (owner, 2026-11-13: horizontal, native, in place of the side rails and the strips): which tiles it
// shows. Pure, so tests/inline-ads.test.ts can pin it; the drawing is components/InlineAds.tsx.
//
// eBay and TCGplayer only, never Amazon (owner, 2026-11-12): the tiles take turns, eBay first, up to INLINE_MAX in all. Where one
// side has too few the other fills the row. A kit page (SITE.kits) shows its eBay kit tiles alone.
import type { AdTile, CardAds } from "@/lib/card-ads";
import type { Market } from "@/lib/site-types";

export const INLINE_MAX = 6;
export const INLINE_MIN = 3;
/** The block's height in px, reserved in the server HTML so it never moves the page (CLS 0). */
export const INLINE_H = 368;
/** A market's own eBay tiles need this many, else eBay US stands in. */
const OWN_MIN = 2;

/** The eBay tiles for a market, or eBay US where the market is thin. */
export function ebayTilesFor(ads: CardAds, market: Market): { tiles: AdTile[]; market: Market } {
  const own = ads.ebay[market] ?? [];
  if (own.length >= OWN_MIN) return { tiles: own, market };
  return { tiles: ads.ebay.US ?? [], market: "US" };
}

export interface InlineTile {
  source: "ebay" | "tcgplayer";
  tile: AdTile;
}

/** The tiles of the block for a visitor's market: eBay and TCGplayer taking turns, eBay first, photos only. */
export function pickInline(ads: CardAds, market: Market): { tiles: InlineTile[]; ebayMarket: Market } {
  const mine = pickFor(ads, market);
  // A thin local market never shrinks the block below its reserved room: the baseline market stands in.
  return mine.tiles.length >= INLINE_MIN || market === "US" ? mine : pickFor(ads, "US");
}

function pickFor(ads: CardAds, market: Market): { tiles: InlineTile[]; ebayMarket: Market } {
  const { tiles, market: ebayMarket } = ebayTilesFor(ads, market);
  const e = tiles.filter((t) => t.image);
  const t = ads.tcgplayer.filter((x) => x.image);
  const out: InlineTile[] = [];
  for (let i = 0; out.length < INLINE_MAX && (i < e.length || i < t.length); i++) {
    if (i < e.length && out.length < INLINE_MAX) out.push({ source: "ebay", tile: e[i] });
    if (i < t.length && out.length < INLINE_MAX) out.push({ source: "tcgplayer", tile: t[i] });
  }
  return { tiles: out, ebayMarket };
}

/** Whether the block has enough to show. Judged on the baseline market (eBay US stands in elsewhere), so the server and the browser agree. */
export function inlineReady(ads: CardAds | undefined, kitTiles: readonly unknown[] | undefined): boolean {
  if (kitTiles) return kitTiles.length >= INLINE_MIN;
  return !!ads && pickInline(ads, "US").tiles.length >= INLINE_MIN;
}

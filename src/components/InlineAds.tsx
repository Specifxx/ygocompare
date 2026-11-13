"use client";
// The ONE ad block of a page (owner, 2026-11-13: "one bigger, subtler horizontal ad … inside the page content … native", in place of
// the side rails and the old strips): a full-column-width card of up to six larger tiles, eBay and TCGplayer taking turns (eBay
// first), scrolling sideways where the column is narrow. The tiles are the import's own eBay results and TCGplayer prices
// (lib/card-ads.ts): no request, no extra eBay call. A kit page (SITE.kits) passes its eBay kit tiles instead.
//
//   • Calm: the site's own card, border and surface tokens, a small muted "Ad" pill, no brand colours, nothing floating or fixed.
//   • Browser only, like the rails it replaces: the server sends an empty box of the block's exact height (INLINE_H), so no crawler
//     sees it and the page never moves (CLS 0). It draws after hydration, and only when there are enough tiles (inlineReady,
//     judged on the baseline market so the server and the browser agree).
//   • Placed by the page BELOW its main content (card, kit and set pages under the price table; the home page between sections;
//     lists after the grid). Never beside a buy button, never above a price, never in the quick view, one per page.
//   • Every link is rel sponsored through /go under `<page>-inline-ebay` or `<page>-inline-tcg` (and `-all`)..
import { useEffect, useState } from "react";
import { SITE } from "@/site.config";
import type { CardAds } from "@/lib/card-ads";
import type { KitAdTile } from "@/lib/kits";
import { ebaySearchUrl, goHref } from "@/lib/affiliate";
import { money } from "@/lib/format";
import { INLINE_H, inlineReady, pickInline } from "@/lib/inline-ads";
import { useMarket } from "./ClientPrefs";

const SEARCH_MARKETS = ["US", "UK", "AU", "CA"] as const;

/** `search`: lib/card-ads.ts adSearch(), computed on the server (this file never reads the data files). */
export interface InlineSearch {
  ebayQuery: string;
  tcgplayerUrl: string;
}

const TILE = "group flex h-full flex-col rounded-lg border border-line bg-surface p-2 transition-colors hover:border-ink/40";
const WORD = "block h-4 truncate text-[10px] font-semibold uppercase leading-4 tracking-wide text-muted";

export function InlineAds({ ads, search, kit, page }: { ads?: CardAds; search?: InlineSearch; kit?: KitAdTile[]; page: string }) {
  const { market } = useMarket();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!inlineReady(ads, kit)) return null;
  const box = { minHeight: INLINE_H };
  if (!mounted) return <div aria-hidden="true" style={box} />;
  const searchMarket = (SEARCH_MARKETS as readonly string[]).includes(market) ? (market as (typeof SEARCH_MARKETS)[number]) : "US";
  const us = market === "US";

  if (kit) return <KitBlock tiles={kit} page={page} market={searchMarket} />;
  if (!ads || !search) return null;
  const { tiles, ebayMarket } = pickInline(ads, market);
  const hasTcg = tiles.some((t) => t.source === "tcgplayer");
  const hasEbay = tiles.some((t) => t.source === "ebay");
  const ebayAll = goHref({ url: ebaySearchUrl(search.ebayQuery, searchMarket), source: "ebay", market: searchMarket }, undefined, `${page}-inline-ebay-all`);
  const tcgAll = goHref({ url: search.tcgplayerUrl, source: "tcgplayer", market: "US" }, undefined, `${page}-inline-tcg-all`);
  return (
    <Frame
      page={page}
      label={`Sponsored listings on ${hasEbay && hasTcg ? "eBay and TCGplayer" : hasEbay ? "eBay" : "TCGplayer"}`}
      links={
        <>
          {hasEbay && <AllLink href={ebayAll}>All on eBay →</AllLink>}
          {hasTcg && <AllLink href={tcgAll}>All on TCGplayer →</AllLink>}
        </>
      }
      note={`Sponsored: ${SITE.name} may earn a commission from ${hasEbay && hasTcg ? "eBay and TCGplayer" : hasEbay ? "eBay" : "TCGplayer"} purchases, at no cost to you.${hasEbay && ebayMarket !== market ? " eBay tiles from eBay US." : ""}${hasTcg && !us ? " TCGplayer prices in US$." : ""}`}
    >
      {tiles.map(({ source, tile: t }) => {
        const ebay = source === "ebay";
        const price = ebay || us ? money(t.cents, t.currency) : `US${money(t.cents, t.currency)}`;
        const href = ebay
          ? goHref({ url: t.url, source: "ebay", market: ebayMarket }, t.id, `${page}-inline-ebay`)
          : goHref({ url: t.url, source: "tcgplayer", market: "US" }, t.id, `${page}-inline-tcg`);
        return (
          <li key={`${source}-${t.id}`} className="w-[172px]">
            <a href={href} rel="sponsored nofollow noopener" target="_blank" className={TILE} title={`${t.name} · ${price}`}>
              <span className="plate relative block aspect-square w-full">
                <img src={t.image!} alt={t.name} width={154} height={154} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain p-1.5" />
              </span>
              <span className="mt-1.5 line-clamp-2 h-9 text-xs font-semibold leading-[18px] group-hover:text-brand">{t.name}</span>
              <span className="tabular block h-5 truncate text-[15px] font-bold leading-5">{price}</span>
              <span className={WORD}>{ebay ? "eBay · Buy It Now" : "TCGplayer · market"}</span>
              <span className="sr-only">, on {ebay ? "eBay" : "TCGplayer"}</span>
            </a>
          </li>
        );
      })}
    </Frame>
  );
}

/** The kit page's block: the kits' own box photos, each a tagged eBay search for that kit (no eBay API call, so no price). */
function KitBlock({ tiles, page, market }: { tiles: KitAdTile[]; page: string; market: (typeof SEARCH_MARKETS)[number] }) {
  const prefix = SITE.kits?.searchPrefix ?? "";
  const href = (query: string, jan: string | undefined, from: string) =>
    goHref({ url: ebaySearchUrl(`${prefix} ${query}`.trim(), market), source: "ebay", market }, jan ? Number(jan) : undefined, from);
  return (
    <Frame
      page={page}
      label="Sponsored: these kits on eBay"
      links={<AllLink href={href("", undefined, `${page}-inline-ebay-all`)}>All on eBay →</AllLink>}
      note={`Sponsored: ${SITE.name} may earn a commission from eBay purchases, at no cost to you.`}
    >
      {tiles.slice(0, 6).map((t) => (
        <li key={t.jan} className="w-[172px]">
          <a href={href(t.name, t.jan, `${page}-inline-ebay`)} rel="sponsored nofollow noopener" target="_blank" className={TILE} title={`${t.name} on eBay`}>
            <span className="plate relative block aspect-square w-full">
              <img src={t.image} alt={t.name} width={154} height={154} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain p-1.5" />
            </span>
            <span className="mt-1.5 line-clamp-2 h-9 text-xs font-semibold leading-[18px] group-hover:text-brand">{t.name}</span>
            <span className="block h-5 truncate text-[13px] leading-5 text-muted">Search eBay</span>
            <span className={WORD}>eBay</span>
            <span className="sr-only">, on eBay</span>
          </a>
        </li>
      ))}
    </Frame>
  );
}

function AllLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} rel="sponsored nofollow noopener" target="_blank" className="whitespace-nowrap font-semibold text-muted hover:text-ink hover:underline">
      {children}
    </a>
  );
}

function Frame({ page, label, links, note, children }: { page: string; label: string; links: React.ReactNode; note: string; children: React.ReactNode }) {
  return (
    <aside data-ad="inline" data-ad-page={page} aria-label={label} className="card p-4" style={{ minHeight: INLINE_H }}>
      <div className="flex h-8 items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-xs text-muted">
          <span className="ad-pill">Ad</span>
          <span className="truncate">Sponsored listings</span>
        </p>
        <span className="flex shrink-0 gap-4 text-xs">{links}</span>
      </div>
      <ul role="list" className="scroller mt-3 h-[252px] items-start gap-3">
        {children}
      </ul>
      <p className="mt-2 h-7 text-[11px] leading-[14px] text-muted">{note}</p>
    </aside>
  );
}

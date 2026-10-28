"use client";
// The card ad strips (lib/card-ads.ts): a row of real cards with their photos
// and today's prices, one strip for eBay (live Buy It Now in the visitor's
// market) and one for TCGplayer (market price). Labelled "Ad", disclosed under
// each strip, never a pop-up, and always placed below a page's price
// comparison. Pages are cached for everyone, so the server sends every
// market's tiles and the visitor's market is picked here.
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
      <span className="text-fg">TCG</span>
      <span style={{ color: "#4fa3ff" }}>player</span>
    </span>
  );
}

function AdLabel() {
  return <span className="rounded bg-ink-950/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">Ad</span>;
}

function Tile({ t, href, accent, sub }: { t: AdTile; href: string; accent: string; sub: string | null }) {
  return (
    <a
      href={href}
      rel="sponsored nofollow noopener"
      target="_blank"
      className="group flex w-[136px] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-ink-700 bg-ink-900 transition hover:-translate-y-0.5 hover:border-[var(--ad-accent)]"
      style={{ ["--ad-accent" as string]: accent }}
    >
      <div className="relative aspect-[5/7] bg-ink-850">
        {t.image && <img src={t.image} alt={t.name} loading="lazy" decoding="async" className="h-full w-full object-contain p-1.5 transition group-hover:scale-[1.03]" />}
        <span className="absolute bottom-1.5 right-1.5 rounded-md px-1.5 py-0.5 text-xs font-black text-white shadow" style={{ background: accent }}>
          {money(t.cents, t.currency)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2">
        <p className="line-clamp-2 text-xs font-medium leading-tight text-fg">{t.name}</p>
        {sub && <p className="mt-auto text-[11px] text-muted">{sub}</p>}
      </div>
    </a>
  );
}

function Strip({
  brand,
  title,
  tagline,
  accent,
  seeAll,
  children,
  disclosure,
}: {
  brand: React.ReactNode;
  title: string;
  tagline: string;
  accent: string;
  seeAll: { href: string; label: string };
  children: React.ReactNode;
  disclosure: string;
}) {
  return (
    <section data-ad className="overflow-hidden rounded-xl border bg-ink-900/60" style={{ borderColor: `${accent}55`, backgroundImage: `linear-gradient(135deg, ${accent}14, transparent 55%)` }}>
      <div className="flex items-center gap-3 px-4 pt-3">
        {brand}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-bold leading-tight text-fg">{title}</p>
          <p className="truncate text-[11px] text-muted">{tagline}</p>
        </div>
        <AdLabel />
        <a href={seeAll.href} rel="sponsored nofollow noopener" target="_blank" className="hidden shrink-0 rounded-md px-2.5 py-1 text-xs font-bold text-white sm:inline-block" style={{ background: accent }}>
          {seeAll.label} →
        </a>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 pt-3">
        {children}
        <a href={seeAll.href} rel="sponsored nofollow noopener" target="_blank" className="flex w-[136px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink-600 p-3 text-center text-sm font-bold text-fg hover:border-[var(--ad-accent)]" style={{ ["--ad-accent" as string]: accent }}>
          <span className="rounded-full px-3 py-1 text-xs text-white" style={{ background: accent }}>{seeAll.label} →</span>
          <span className="text-[11px] font-normal text-muted">Every listing, sorted by price</span>
        </a>
      </div>
      <p className="px-4 pb-3 text-[11px] text-muted">{disclosure}</p>
    </section>
  );
}

export function EbayCardStrip({ ads, page, title, query }: { ads: Pick<CardAds, "ebay">; page: string; title?: string; query: string }) {
  const { market } = useMarket();
  const own = ads.ebay[market] ?? [];
  const useOwn = own.length >= MIN_TILES;
  const tiles = useOwn ? own : ads.ebay.US ?? [];
  const tileMarket: Market = useOwn ? market : "US";
  if (tiles.length < MIN_TILES) return null;
  const searchMarket = (EBAY_SEARCH_MARKETS as readonly string[]).includes(market) ? (market as (typeof EBAY_SEARCH_MARKETS)[number]) : "US";
  const accent = "#0064d2";
  return (
    <Strip
      brand={<EbayWord className="text-2xl" />}
      title={title ?? `${SITE.gameShort} cards on eBay right now`}
      tagline={`Cheapest live Buy It Now${tileMarket !== market ? " on eBay US" : ""} · checked today`}
      accent={accent}
      seeAll={{ href: goHref({ url: ebaySearchUrl(query, searchMarket), source: "ebay", market: searchMarket }, undefined, `${page}-ebay-strip-all`), label: "Shop eBay" }}
      disclosure={`Sponsored. As an eBay Partner, ${SITE.name} may earn a commission from qualifying purchases, at no cost to you.`}
    >
      {tiles.map((t) => (
        <Tile
          key={t.id}
          t={t}
          accent={accent}
          href={goHref({ url: t.url, source: "ebay", market: tileMarket }, t.id, `${page}-ebay-strip`)}
          sub={t.ref != null && t.currency === "USD" ? `Market ${money(t.ref)}` : "Buy It Now"}
        />
      ))}
    </Strip>
  );
}

export function TcgplayerCardStrip({ ads, page, title, searchUrl }: { ads: Pick<CardAds, "tcgplayer">; page: string; title?: string; searchUrl: string }) {
  const { market } = useMarket();
  const tiles = ads.tcgplayer;
  if (tiles.length < MIN_TILES) return null;
  const direct = market !== "US" && (SITE.tcgplayerDirectMarkets ?? []).includes(market);
  const tagline =
    market === "US" ? "Market prices from thousands of US sellers" : direct ? "TCGplayer Direct ships these singles to you · prices in US$" : "US marketplace · prices in US$";
  const accent = "#1f6fe5";
  return (
    <Strip
      brand={<TcgWord className="text-xl" />}
      title={title ?? `Shop ${SITE.gameShort} on TCGplayer`}
      tagline={tagline}
      accent={accent}
      seeAll={{ href: goHref({ url: searchUrl, source: "tcgplayer", market: "US" }, undefined, `${page}-tcg-strip-all`), label: "Shop TCGplayer" }}
      disclosure={`Sponsored. ${SITE.name} may earn a commission from TCGplayer purchases made through these links, at no cost to you.`}
    >
      {tiles.map((t) => (
        <Tile key={t.id} t={t} accent={accent} href={goHref({ url: t.url, source: "tcgplayer", market: "US" }, t.id, `${page}-tcg-strip`)} sub="TCGplayer market" />
      ))}
    </Strip>
  );
}

/** Both strips, eBay first (it pays on any purchase within 24 hours). */
export function CardAdPair({ ads, page, ebayQuery, tcgplayerUrl, ebayTitle, tcgTitle }: { ads: CardAds; page: string; ebayQuery: string; tcgplayerUrl: string; ebayTitle?: string; tcgTitle?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <EbayCardStrip ads={ads} page={page} query={ebayQuery} title={ebayTitle} />
      <TcgplayerCardStrip ads={ads} page={page} searchUrl={tcgplayerUrl} title={tcgTitle} />
    </div>
  );
}

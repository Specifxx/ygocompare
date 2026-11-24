import type { Metadata } from "next";
import { DiscordCta } from "@/components/DiscordCta";
import Link from "@/components/Link";
import { Fragment } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { retiredCardTarget } from "@/lib/card-redirects";
import { SITE } from "@/site.config";
import { byValue, historyOf, looseSingleSetId, meta, priceOf, productBySlug, productsInSet, refCents, setById, setBySlug, storeLowsOf, historyThrough } from "@/lib/data";
import { imageAt } from "@/lib/image";
import { money, pct } from "@/lib/format";
import { shortName } from "@/lib/names";
import { PriceTable } from "@/components/PriceTable";
import { VaultOwn } from "@/components/vault/VaultOwn";
import { PriceAlert } from "@/components/PriceAlert";
import { WatchPrice } from "@/components/WatchPrice";
import { SeenPrice } from "@/components/SinceLastVisit";
import { lowestByMarket } from "@/lib/alert-feed";
import { CardStickyBuyBar, CardTopBuy, CheckedAgo } from "@/components/CardBuy";
import { EbayCallout } from "@/components/EbayCallout";
import { PriceHistory } from "@/components/PriceHistory";
import { TileGrid } from "@/components/ProductTile";
import { JsonLd } from "@/components/JsonLd";
import { AdSlot } from "@/components/AdSlot";
import { InlineAds } from "@/components/InlineAds";
import { adSearch, cardAds } from "@/lib/card-ads";
import { amazonSearchUrls, goHref } from "@/lib/affiliate";
import { TcgplayerCyberBanner } from "@/components/TcgplayerCyberBanner";
import { tcgplayerSlugOf } from "@/lib/lines";
import { amazonCarries, amazonCells } from "@/lib/amazon-live";
import { abs } from "@/lib/site";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShareButton } from "@/components/ShareButton";
import { DropShare } from "@/components/DropShare";
import { attrHref, rarityHref, sealedHref } from "@/lib/hubs";

import { cardTitleCandidates, fitTitle } from "@/lib/seo-title";
import { priceValidUntil } from "@/lib/indexing";
import { productAsksIndex } from "@/lib/index-asks";
import { gtinLabel, gtinLd } from "@/lib/gtin";
import { buyerRead } from "@/lib/buyer-read";
import { sourceNameServer } from "@/lib/sources";
import { MARKETS, marketInSentence, type Market, type Offer } from "@/lib/site-types";

export const dynamic = "force-dynamic"; // one CDN copy per URL (next.config.js CDN_PAGES), never ISR

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = productBySlug(params.slug);
  if (!p) return {};
  const set = setById(p.setId);
  const ref = refCents(p.id);
  const name = shortName(p.name);
  // "<card> <number> Price — <game> <set>", stepped down to fit 60 characters (lib/seo-title.ts).
  const title = fitTitle(cardTitleCandidates(name, p.number, set?.name ?? null, p.kind === "sealed")).absolute;
  const stores = new Set(priceOf(p.id).offers.map((o) => o.source)).size;
  const description = `${name} (${set?.name ?? SITE.gameShort}${p.rarity ? `, ${p.rarity}` : ""}) ${ref ? `is worth about ${money(ref)} today` : "has no TCGplayer market price yet"}. Compare ${stores} live prices from TCGplayer, eBay and ${SITE.gameShort} stores, with price history.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/card/${p.slug}` },
    // Only a real comparison (3+ stores, one in stock), an upcoming set's product or a page people find in search asks to
    // be indexed (lib/indexing.ts sealedAsksIndex, 2026-11-19); the rest stay live, noindex, follow.
    ...(productAsksIndex(p) ? {} : { robots: { index: false, follow: true } }),
    // The image is ./opengraph-image.tsx: the card and its real price gap (lib/share.ts).
    openGraph: { type: "website", siteName: SITE.name, url: `/card/${p.slug}`, title, description },
    twitter: { card: "summary_large_image" },
  };
}

export default function CardPage({ params }: { params: { slug: string } }) {
  const p = productBySlug(params.slug);
  if (!p) {
    // A single card from before the site went sealed-only: a permanent redirect to its set (lib/card-redirects.ts).
    const to = retiredCardTarget(params.slug, (s) => (setBySlug(s)?.productCount ?? 0) > 0);
    if (to) permanentRedirect(to);
    // A single that TCGplayer filed as sealed (lib/data.ts isLooseSingle): its set, or the sealed hub.
    const loose = looseSingleSetId(params.slug);
    if (loose != null) {
      const set = setById(loose);
      permanentRedirect(set && set.productCount > 0 ? `/sets/${set.slug}` : "/sealed");
    }
    notFound();
  }
  const set = setById(p.setId);
  const e = priceOf(p.id);
  const ref = refCents(p.id);
  const m = meta();
  const series = historyOf(p);
  const name = shortName(p.name);
  const related = byValue(productsInSet(p.setId).filter((x) => x.id !== p.id && x.kind === p.kind)).slice(0, 6);
  const inStock = e.offers.filter((o) => o.inStock);
  const usOffers = inStock.filter((o) => o.currency === "USD");
  const read = buyerRead({
    name,
    sealedType: p.kind === "sealed" ? p.sealedType : null,
    refCents: ref,
    tcgLowCents: Object.values(e.tcg).map((t) => t.low).filter((c): c is number => c != null).sort((a, b) => a - b)[0] ?? null,
    history: series,
    today: historyThrough(),
    offers: e.offers,
    storeName: (o) => sourceNameServer(o as Offer),
    set: set ? { name: set.name, releasedOn: set.releasedOn, upcoming: set.upcoming } : null,
    siblings: p.kind === "sealed" ? productsInSet(p.setId).filter((x) => x.id !== p.id && x.kind === "sealed").map((x) => ({ name: shortName(x.name), sealedType: x.sealedType, refCents: refCents(x.id) })) : [],
    money,
    marketOrder: MARKETS,
    marketName: (mk) => marketInSentence(mk as Market),
  });
  // Sealed only: the markets' tagged searches, upgraded to the item's own page and this build's price where the API found them.
  const amazon = p.kind === "sealed" && amazonCarries(p) ? amazonCells(p.id, amazonSearchUrls(`${SITE.game} ${name}`)) : null;
  return (
    <article className="flex flex-col gap-8">
      {/* Product markup only when a real in-stock US offer backs it (2026-11-04,
          DECISIONS.md): Google treats a Product with none of offers, review or
          aggregateRating as an error, so a card with only a reference price
          emits no Product rather than an invalid one. */}
      {usOffers.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            image: p.image ? imageAt(p.image, "in_1000x1000") : undefined,
            sku: String(p.id),
            productID: `tcgplayer:${p.id}`,
            ...gtinLd(p.upc),
            brand: { "@type": "Brand", name: SITE.game },
            category: p.kind === "card" ? "Trading card" : "Sealed trading card product",
            url: abs(`/card/${p.slug}`),
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "USD",
              lowPrice: (Math.min(...usOffers.map((o) => o.cents)) / 100).toFixed(2),
              highPrice: (Math.max(...usOffers.map((o) => o.cents)) / 100).toFixed(2),
              offerCount: usOffers.length,
              availability: "https://schema.org/InStock",
              priceValidUntil: priceValidUntil(),
            },
          }}
        />
      )}
      <Breadcrumbs items={[{ name: "Sealed", href: "/sealed" }, ...(set ? [{ name: set.name, href: `/sets/${set.slug}` }] : []), { name }]} />
      {/* Jump links (owner's UX review, 2026-11-23, P1 13: "Add sticky anchors (Prices, History, Facts, FAQ)"). Plain anchors in
          the server HTML, no headings (the h2 outline is unchanged). */}
      <nav aria-label="On this page" className="sticky top-[var(--hdr)] z-20 -mx-4 -my-4 border-b border-line bg-bg/90 px-4 backdrop-blur sm:mx-0 sm:rounded-full sm:border">
        <ul className="scroller gap-1 py-1.5 text-sm font-semibold">
          {[["prices", "Prices"], ["history", "History"], ["facts", "Facts"], ["worth", "Is it worth it?"]].map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full px-3 text-muted hover:bg-raised hover:text-ink focus-visible:bg-raised focus-visible:text-ink">{label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="grid gap-8 md:grid-cols-[minmax(0,320px)_1fr]">
        {/* Phones: the name, price and Buy come first; the big image and the
            details follow the prices (RiftCompare's card page, 2026-09-26). */}
        <div className="order-2 flex flex-col gap-4 md:order-1">
          {/* The photo on the site's plate, like every product card: a square that is reserved before the photo arrives (the bare
              image was laid out as a 400×560 card and jumped to the photo's own shape), white behind a white-backed photo in the dark theme. */}
          {p.image && (
            <div className="plate hidden aspect-square rounded-2xl md:block">
              <img src={imageAt(p.image, "400w")!} alt={`${name} ${SITE.gameShort} card`} className="h-full w-full object-contain p-5 mix-blend-multiply" width={400} height={400} />
            </div>
          )}
          <dl id="facts" className="scroll-mt-16 card-surface grid grid-cols-2 gap-x-3 gap-y-1.5 p-4 text-sm">
            {set && (<><dt className="text-muted">Set</dt><dd><Link className="link" href={`/sets/${set.slug}`}>{set.name}</Link></dd></>)}
            {p.number && (<><dt className="text-muted">Number</dt><dd>{p.number}</dd></>)}
            {p.rarity && (<><dt className="text-muted">Rarity</dt><dd>{rarityHref(p.rarity) ? <Link className="link" href={rarityHref(p.rarity)!}>{p.rarity}</Link> : p.rarity}</dd></>)}
            {p.upc && (<><dt className="text-muted">{gtinLabel(p.upc)} barcode</dt><dd className="tabular-nums">{p.upc}</dd></>)}
            <dt className="text-muted">TCGplayer ID</dt><dd className="tabular-nums">{p.id}</dd>
            {p.sealedType && (<><dt className="text-muted">Type</dt><dd>{sealedHref(p.sealedType) ? <Link className="link" href={sealedHref(p.sealedType)!}>{p.sealedType}</Link> : p.sealedType}</dd></>)}
            {Object.entries(p.attrs).slice(0, 8).map(([k, v]) => { const hubs = attrHref(k, v); return (<Fragment key={k}><dt className="text-muted">{k.replace(/([a-z])([A-Z])/g, "$1 $2")}</dt><dd>{hubs ? hubs.map((l, i) => <Fragment key={l.label}>{i > 0 ? ", " : ""}{l.href ? <Link className="link" href={l.href}>{l.label}</Link> : l.label}</Fragment>) : v}</dd></Fragment>); })}
          </dl>
        </div>
        <div className="order-1 flex min-w-0 flex-col gap-6 md:order-2">
          <header>
            <div className="flex items-start gap-3">
              {p.image && (
                <span className="plate block h-20 w-20 shrink-0 md:hidden">
                  <img src={imageAt(p.image, "200w")!} alt={name} className="h-full w-full object-contain p-1.5 mix-blend-multiply" width={80} height={80} />
                </span>
              )}
              <h1 className="min-w-0 flex-1 font-display text-2xl font-bold tracking-tight md:text-3xl">{name} {p.number && <span className="text-muted">{p.number}</span>} price</h1>
              <ShareButton path={`/card/${p.slug}`} name={`${name}${p.number ? ` ${p.number}` : ""}`} medium={p.kind === "sealed" ? "sealed" : "card"} offers={e.offers} compact className="mt-1" />
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              {ref ? (
                <p><span className="tabular font-display text-3xl font-bold text-ink">{money(ref)}</span> <span className="text-sm text-muted">TCGplayer market</span></p>
              ) : (
                <p className="text-sm text-muted">No TCGplayer market price yet</p>
              )}
              {(e.change7d != null || e.change30d != null) && (
                <p className="text-sm tabular-nums">7d <span className={e.change7d == null ? "text-muted" : e.change7d >= 0 ? "text-up" : "text-down"}>{pct(e.change7d)}</span> · 30d <span className={e.change30d == null ? "text-muted" : e.change30d >= 0 ? "text-up" : "text-down"}>{pct(e.change30d)}</span></p>
              )}
              <p className="text-sm text-muted">{inStock.length ? `${inStock.length} in-stock listing${inStock.length === 1 ? "" : "s"} worldwide` : "No in-stock listings right now"}</p>
            </div>
            <CardTopBuy offers={e.offers} productId={p.id} ebayQuery={`${SITE.ebay.query} ${name} ${p.number ?? ""}`.trim()} />
            <VaultOwn id={p.id} name={`${name}${p.number ? ` ${p.number}` : ""}`} href={`/card/${p.slug}`} image={p.image ? imageAt(p.image, "200w") : null} prices={lowestByMarket(e.offers)} className="mt-3" />
            <DropShare path={`/card/${p.slug}`} name={`${name}${p.number ? ` ${p.number}` : ""}`} offers={e.offers} className="mt-2" />
            {Object.keys(e.tcg).length > 1 && (
              <p className="mt-2 flex flex-wrap gap-2 text-xs">
                {Object.entries(e.tcg).map(([k, v]) => (
                  <span key={k} className="tag">{k}: {money(v.market ?? v.mid ?? v.low)}</span>
                ))}
              </p>
            )}
            {SITE.priceAlerts && <WatchPrice site={SITE.key} productId={p.id} prices={lowestByMarket(e.offers)} />}
            {SITE.priceAlerts && <SeenPrice productId={p.id} prices={lowestByMarket(e.offers)} />}
          </header>
          <section id="prices" className="scroll-mt-16">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4">
              <h2 className="font-display text-lg font-bold tracking-tight">Compare prices</h2>
              <CheckedAgo at={m?.updatedAt} />
            </div>
            <div className="mb-3"><EbayCallout offers={e.offers} productId={p.id} query={`${SITE.ebay.query} ${name} ${p.number ?? ""}`.trim()} /></div>
            <PriceTable offers={e.offers} fx={m?.fx ?? { USD: 1 }} productId={p.id} page="card" amazon={amazon} image={p.image ? imageAt(p.image, "200w") : null} product={`${name}${p.number ? ` ${p.number}` : ""}`} />
            {SITE.priceAlerts && <PriceAlert site={SITE.key} productId={p.id} prices={lowestByMarket(e.offers)} />}
            {/* TCGplayer's Cyber Weekend banner (lib/tcgplayer-cyber.ts): under the price table, 22 Nov to 1 Dec, labelled Ad. */}
            <TcgplayerCyberBanner
              href={goHref(
                { url: `https://www.tcgplayer.com/search/${tcgplayerSlugOf(set)}/product?productLineName=${tcgplayerSlugOf(set)}&q=${encodeURIComponent(name)}&ProductTypeName=Sealed+Products`, source: "tcgplayer", market: "US" },
                p.id,
                "cyber_banner",
              )}
              at={Date.now()}
              className="mt-4"
            />
            <DiscordCta href={SITE.discordInvite} className="mt-4" />
          </section>
          <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CARD} />
          <section id="history" className="card scroll-mt-16 p-4 sm:p-5">
            <h2 className="mb-3 font-display text-lg font-bold tracking-tight">Price history</h2>
            <PriceHistory tcg={series} lows={storeLowsOf(p)} fx={m?.fx} through={historyThrough()} days={365} />
          </section>
          <section id="worth" className="prose-site max-w-none scroll-mt-16 text-sm">
            <h2>Is {name} worth it?</h2>
            {/* Written from this product's own prices, stock and history (lib/buyer-read.ts, 2026-11-23 SEO quality pass). */}
            {read.map((t, k) => <p key={k}>{t}</p>)}
            <p className="text-muted">Prices from {SITE.stores.length} stores, TCGplayer and eBay are checked every day.</p>
          </section>
        </div>
      </div>
      {related.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg font-bold tracking-tight sm:text-xl">More from {set?.name}</h2>
          <TileGrid items={related} />
        </section>
      )}
      {/* The page's one ad block (owner, 2026-11-13): native and horizontal, below the price table and everything else; never beside a buy button. */}
      <CardStickyBuyBar offers={e.offers} productId={p.id} />
      {/* Ads sit below the page's own content, never above it (2026-11-19, core-update quality pass). */}
      <InlineAds ads={cardAds({ setId: p.setId, kind: p.kind, exclude: p.id, fill: true, limit: 10 })} search={adSearch(set?.name, set)} page="card" />
    </article>
  );
}

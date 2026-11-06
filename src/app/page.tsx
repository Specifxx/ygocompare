import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { SearchBox } from "@/components/SearchBox";
import { MarketChooser } from "@/components/ClientPrefs";
import { CreatorsBubble } from "@/components/creators/CreatorsBubble";
import { HeroSparks } from "@/components/HeroSparks";
import { ChristmasDecor } from "@/components/ChristmasDecor";
import { ChristmasGifts } from "@/components/ChristmasGifts";
import { TileGrid } from "@/components/ProductTile";
import { byValue, deals, latestReleasedSet, meta, products } from "@/lib/data";
import { ago, money } from "@/lib/format";
import { posts } from "@/lib/posts";
import { shortName } from "@/lib/names";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import { fitTitle } from "@/lib/seo-title";
import { featuredSealed, preorderSetList, sealedHubs, sealedInSet } from "@/lib/hubs";
import { isPreorder, preorderPath } from "@/lib/preorders";
import { inSeason as bfSeason } from "@/lib/black-friday";
import { CORE_SALES, salesInSeason } from "@/lib/sale-seasons";
import { kits, kitsOn, popular } from "@/lib/kits";
import { KitGrid } from "@/components/KitTile";
import { SealedHero } from "@/components/SealedHero";
import { SiteReviews } from "@/components/site-reviews/SiteReviews";
import { sealedHero } from "@/lib/sealed-hero";
import { GameTiles } from "@/components/GameTiles";
import { LandingAds } from "@/components/LandingAds";
import { Section } from "@/components/Section";
import { cardAds } from "@/lib/card-ads";

// The homepage leads with "<game> Booster Box Prices" (sealed only since 2026-11-06) and the number of stores compared.
export function generateMetadata(): Metadata {
  const n = SITE.stores.length;
  // Keyword first, brand last (SEO audit, 2026-11-03: a long game name pushed the brand off Cyberpunk's title). Every
  // candidate is tried with the brand before any is tried bare.
  const g = SITE.gameShort;
  const brand = ` | ${SITE.name}`;
  const title = fitTitle([`${g} Booster Box Prices — Compare ${n} Stores${brand}`, `${g} Booster Box Prices — ${n} Stores${brand}`, `${g} Booster Box Prices${brand}`, `${g} Booster Box Prices — Compare ${n} Stores`, `${g} Booster Box Prices`]);
  return {
    title,
    description: `Compare ${SITE.game} booster box, tin, structure deck and pre-order prices across TCGplayer, eBay, Amazon and ${n} online stores. Cheapest in-stock first, in your currency, updated daily.`,
    alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
    openGraph: { type: "website", siteName: SITE.name, url: "/", title: title.absolute },
  };
}

export const revalidate = 21600;

// The page, in RiftCompare's order (owner, 2026-11-03: "the way they structure
// it, today's top deals, chase cards, what people say, and then the blog
// posts"): a centred hero with the search, the region pills and trending
// chips; today's top deals; sealed; the newest set's chase cards; what people
// say; guides; the FAQ. Nothing else: the tools, movers, pre-order and set
// grids, the hub chip rows and the ad strips that used to follow the hero are
// gone from here (the rail links them): "less is more" (owner, same day).
export default function Home() {
  const m = meta();
  const latest = latestReleasedSet();
  const releases = preorderSetList();
  const upcoming = releases.find((s) => isPreorder(s)) ?? null;
  // Sealed only (2026-11-06): the newest set's sealed products, and the most valuable booster boxes as trending chips.
  const chase = latest ? sealedInSet(latest.id).slice(0, 12) : [];
  const trending = byValue(products().filter((p) => p.sealedType === "Booster Box")).slice(0, 6);
  const topDeals = deals(6);
  const shelf = featuredSealed(6);
  const sealedLinks = sealedHubs();
  // The sealed shelf: one tabbed, swipeable row (components/SealedHero.tsx) on every site.
  const hero = sealedHero();
  const storeCount = SITE.stores.length;
  const today = (m?.updatedAt ?? new Date().toISOString()).slice(0, 10);
  const faqs = [
    { q: `What is ${SITE.name}?`, a: `${SITE.name} is a free ${SITE.game} sealed price comparison site. It compares prices for every ${SITE.gameShort} booster box, pack, tin, structure deck and collection across TCGplayer, eBay, Amazon and ${storeCount} online game stores in the US, UK, Canada and Australia, and updates them every day.` },
    { q: `Where is the cheapest place to buy a ${SITE.gameShort} booster box?`, a: `It changes box by box. Search a set on ${SITE.name} to see every store's price for its booster box, cheapest in-stock first, in your own currency, with a direct link to buy.` },
    { q: `How often are ${SITE.gameShort} prices updated?`, a: `Every day. TCGplayer prices and store listings refresh daily, and eBay listings for every sealed product are re-checked every one to two days.` },
    { q: `Does ${SITE.name} list single cards?`, a: `No. ${SITE.name} compares sealed product only: booster boxes, packs, tins, decks and collections, where store prices differ the most.` },
    { q: `Is ${SITE.name} free?`, a: `Yes, completely, and you don't need an account. ${SITE.name} is paid for by affiliate commissions: when you buy through some links, the store may pay us a small fee at no cost to you.` },
  ];
  return (
    <div className="flex flex-col gap-14">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE.name, url: SITE_URL, logo: `${SITE_URL}/icon.svg` }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE_URL, publisher: { "@id": `${SITE_URL}/#org` } }} />
      {/* The products on this page, by their own URLs: the shelf and the newest set's sealed (SEO audit, 2026-11-03). */}
      {shelf.length + chase.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${SITE.gameShort} booster box and sealed prices`, itemListElement: [...shelf, ...chase].map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/card/${p.slug}`, name: p.name })) }} />
      )}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />

      {/* The hero: the engine's band (a surface with a hairline under it, full width of the column), the search as its one
          action, the living background behind it (HeroSparks) and the creators bubble in its corner. The words, the h1 and the
          links are the ones the old hero carried. */}
      <section className="hero-band relative -mx-4 -mt-6 flex flex-col items-center justify-center overflow-x-clip border-b border-line px-4 pb-10 pt-10 text-center sm:-mx-6 sm:px-8 sm:pb-14 sm:pt-14">
        <HeroSparks />
        {/* Christmas (1 November to Boxing Day): snow, lights, trees. */}
        <ChristmasDecor />
        <CreatorsBubble />
        <ChristmasGifts />
        <p className="eyebrow">{SITE.gameShort} price comparison</p>
        <h1 className="hero-glow mx-auto mt-3 max-w-4xl font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          <span className="text-brand">{SITE.gameShort}</span> Booster Box Prices
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-muted sm:text-lg">
          <strong className="block text-ink">Buy {SITE.gameShort} sealed at the best price</strong>
          Price check any booster box, tin, structure deck or pre-order and find the cheapest place to buy: live prices from TCGplayer, eBay, Amazon and {storeCount} stores in the US, UK, Canada and Australia, in your own currency, updated daily.
        </p>
        <div className="hero-search relative z-30 mx-auto mt-6 hidden w-full max-w-3xl sm:block"><SearchBox big /></div>
        <p className="eyebrow mt-6">Shopping from</p>
        <MarketChooser className="mt-2 justify-center" bare />
        {trending.length > 0 && (
          <div className="mx-auto mt-5 w-full max-w-3xl">
            <p className="eyebrow">Trending</p>
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {trending.map((p) => (
                <li key={p.id}>
                  <Link href={`/card/${p.slug}`} className="chip w-full justify-center truncate">
                    <span className="truncate">{shortName(p.name)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-5 text-xs text-muted">
          {m ? `${products().length.toLocaleString()} sealed products · ${storeCount} stores · prices updated ${ago(m.updatedAt)}` : "Prices update daily"}
          {upcoming && <> · <Link className="link" href={preorderPath(upcoming)}>{upcoming.name} pre-orders →</Link></>}
        </p>
        <p className="mt-3 text-sm"><Link href="/sealed" className="link font-semibold">Every {SITE.gameShort} sealed product →</Link></p>
      </section>

      {/* The engine's ad banner (DexCompare / MTG Compare, owner 2026-11-03): eBay beside TCGplayer, real cards and today's prices. */}
      <LandingAds ads={cardAds({ limit: 10 })} />

      {/* Multi-game sites (SITE.lines): one tile per game, straight under the hero. */}
      <GameTiles />

      {topDeals.length > 0 && (
        <Section className="sd" title="Today's top deals" href="/tools/deal-finder" sub="In-stock listings below TCGplayer market, refreshed daily." linkLabel="Browse all deals">
          {bfSeason(today) && <p className="mb-3 text-sm"><Link className="link" href="/black-friday">Black Friday and Cyber Monday deals, updated daily →</Link></p>}
          {salesInSeason(CORE_SALES, today).map((s) => (
            <p key={s.slug} className="mb-3 text-sm"><Link className="link" href={`/${s.slug}`}>{s.linkLabel}, updated daily →</Link></p>
          ))}
          <div className="sd-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topDeals.map((d) => (
              <Link key={`${d.p.id}${d.offer.source}`} href={`/card/${d.p.slug}`} className="card group flex min-w-0 items-center gap-3 p-3 transition-colors hover:border-ink/40">
                <span className="plate h-20 w-14 shrink-0">{d.p.image && <img src={d.p.image} alt={d.p.name} className="h-full w-full object-contain p-0.5" loading="lazy" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold group-hover:text-brand">{shortName(d.p.name)}</p>
                  <p className="text-xs text-muted">Market {money(d.market)}</p>
                  <p className="tabular text-sm"><b className="text-open">{money(d.offer.cents, d.offer.currency)}</b> <span className="text-xs text-muted">({d.saving}% under)</span></p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* The sealed shelf: tabs for the boxes and each pre-order. */}
      {hero.featured.length + hero.preorders.length > 0 && (
        <div className="sd">
          <SealedHero data={hero} game={SITE.gameShort} sealedHref={sealedLinks.some((h) => h.slug === "booster-box") ? "/sealed/booster-box" : "/sealed"} />
        </div>
      )}

      {/* Model kits (SITE.kits): the kits most shops have in stock. */}
      {SITE.kits && kitsOn() && (
        <Section className="sd" title={`${SITE.kits.label} prices`} href="/kits" sub={`${kits().length.toLocaleString()} ${SITE.kits.noun} across ${SITE.kits.stores.length} hobby shops, matched by barcode.`}>
          <KitGrid items={popular(kits()).slice(0, 6)} />
        </Section>
      )}

      {latest && chase.length > 0 && (
        <Section className="sd" title={`${latest.name} booster boxes and sealed`} href={`/sets/${latest.slug}`} sub="The newest set's sealed product, with every store's price." linkLabel="Every product in the set">
          <TileGrid items={chase} />
        </Section>
      )}

      {/* The site's own star score and approved reviews (owner, 2026-11-03), loaded in the browser; nothing until there is a rating. */}
      <SiteReviews />

      {posts().length > 0 && (
        <Section className="sd" title="Guides" href="/blog" sub={`Buying guides and price explainers for ${SITE.gameShort}.`}>
          <div className="sd-stagger grid gap-3 md:grid-cols-3">
            {posts().slice(0, 3).map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="card group p-5 transition-colors hover:border-ink/40">
                <p className="font-semibold group-hover:text-brand">{p.title}</p>
                <p className="mt-1 line-clamp-3 text-sm text-muted">{p.description}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <section className="sd max-w-3xl">
        <h2 className="mb-3 font-display text-2xl font-bold tracking-tight">Frequently asked questions</h2>
        {faqs.map((f) => (
          <details key={f.q} className="border-b border-line py-3">
            <summary className="cursor-pointer font-medium">{f.q}</summary>
            <p className="mt-2 text-sm leading-6 text-muted">{f.a}</p>
          </details>
        ))}
      </section>
      <p className="sr-only">{products().length} products tracked</p>
    </div>
  );
}

import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { SearchBox } from "@/components/SearchBox";
import { MarketChooser } from "@/components/ClientPrefs";
import { CreatorsBubble } from "@/components/creators/CreatorsBubble";
import { HeroSparks } from "@/components/HeroSparks";
import { ChristmasDecor } from "@/components/ChristmasDecor";
import { ChristmasGifts } from "@/components/ChristmasGifts";
import { TileGrid } from "@/components/ProductTile";
import { byValue, deals, latestReleasedSet, meta, products, productsInSet } from "@/lib/data";
import { ago, money } from "@/lib/format";
import { posts } from "@/lib/posts";
import { shortName } from "@/lib/names";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import { fitTitle } from "@/lib/seo-title";
import { featuredSealed, preorderSetList, sealedHubs } from "@/lib/hubs";
import { isPreorder, preorderPath } from "@/lib/preorders";
import { inSeason as bfSeason } from "@/lib/black-friday";
import { CORE_SALES, salesInSeason } from "@/lib/sale-seasons";
import { kits, kitsOn, popular } from "@/lib/kits";
import { KitGrid } from "@/components/KitTile";
import { SealedHero } from "@/components/SealedHero";
import { SiteReviews } from "@/components/site-reviews/SiteReviews";
import { sealedHero } from "@/lib/sealed-hero";
import { GameTiles } from "@/components/GameTiles";

// The homepage leads with "<game> Card Prices" and the number of stores compared, as Rift Compare's does.
export function generateMetadata(): Metadata {
  const n = SITE.stores.length;
  // Keyword first, brand last (SEO audit, 2026-11-03: a long game name pushed the brand off Cyberpunk's title). Every
  // candidate is tried with the brand before any is tried bare.
  const g = SITE.gameShort;
  const brand = ` | ${SITE.name}`;
  const title = fitTitle([`${g} Card Prices — Compare ${n} Stores${brand}`, `${g} Card Prices — ${n} Stores${brand}`, `${g} Card Prices${brand}`, `${g} Card Prices — Compare ${n} Stores`, `${g} Card Prices`]);
  return {
    title,
    description: `Compare ${SITE.game} card and booster box prices across TCGplayer, eBay and ${n} online stores. Cheapest in-stock first, in your currency, updated daily.`,
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
  const chase = latest ? byValue(productsInSet(latest.id).filter((p) => p.kind === "card")).slice(0, 12) : [];
  // Trending chips: the most valuable chase-rarity cards (SITE.chaseRarities), so a
  // tokens-and-markers catalogue never fills the row with "Energy Marker" (BandaiCompare).
  const cards = products().filter((p) => p.kind === "card");
  const chaseOnly = cards.filter((p) => p.rarity && SITE.chaseRarities.includes(p.rarity));
  const trending = byValue(chaseOnly.length >= 6 ? chaseOnly : cards.filter((p) => p.rarity)).slice(0, 6);
  const topDeals = deals(6);
  const shelf = featuredSealed(6);
  const sealedLinks = sealedHubs();
  // Sealed-led sites (SITE.homeSealedHero) open with the big sealed hero; it replaces the plain shelf below.
  const hero = SITE.homeSealedHero ? sealedHero() : null;
  const storeCount = SITE.stores.length;
  const today = (m?.updatedAt ?? new Date().toISOString()).slice(0, 10);
  const faqs = [
    { q: `What is ${SITE.name}?`, a: `${SITE.name} is a free ${SITE.game} price comparison site. It compares prices for every ${SITE.gameShort} card and sealed product across TCGplayer, eBay and ${storeCount} online game stores in the US, UK, Canada, Australia and Europe, and updates them every day.` },
    { q: `Where is the cheapest place to buy ${SITE.gameShort} cards?`, a: `It changes card by card. Search a card on ${SITE.name} to see every store's price for it, cheapest in-stock first, in your own currency, with a direct link to buy.` },
    { q: `How often are ${SITE.gameShort} prices updated?`, a: `Every day. TCGplayer prices and store listings refresh daily; eBay listings for cards worth $20 or more are re-checked every one to four days depending on value and demand.` },
    { q: `Is ${SITE.name} free?`, a: `Yes, completely, and you don't need an account. ${SITE.name} is paid for by affiliate commissions: when you buy through some links, the store may pay us a small fee at no cost to you.` },
  ];
  return (
    <div className="flex flex-col gap-12">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE.name, url: SITE_URL, logo: `${SITE_URL}/icon.svg` }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE_URL, publisher: { "@id": `${SITE_URL}/#org` }, potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/cards?q={q}`, "query-input": "required name=q" } }} />
      {/* The products on this page, by their own URLs: the shelf and the newest set's chase cards (SEO audit, 2026-11-03). */}
      {shelf.length + chase.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${SITE.gameShort} sealed and chase card prices`, itemListElement: [...shelf, ...chase].map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/card/${p.slug}`, name: p.name })) }} />
      )}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />

      {/* The hero: centred, the search as its one action, the living background
          behind it (HeroSparks) and the creators bubble in its corner. The
          `hero-search` class keeps the suggestions above what follows. */}
      <section className="hero-band relative -mx-4 -mt-6 overflow-x-clip px-4 pb-10 pt-8 text-center sm:pb-14 sm:pt-12 lg:-mx-4 lg:rounded-b-3xl">
        <HeroSparks />
        {/* Christmas (1 November to Boxing Day): snow, lights, trees. */}
        <ChristmasDecor />
        <CreatorsBubble />
        <ChristmasGifts />
        <p className="mx-auto hidden items-center justify-center gap-2 font-display text-base font-black sm:flex">
          <img src="/icon.svg" alt={`${SITE.name} logo`} width={28} height={28} className="h-7 w-7 rounded-lg" />
          <span className="wordmark">{SITE.wordmark[0]}</span>
          <span className="text-fg">{SITE.wordmark[1]}</span>
        </p>
        <h1 className="hero-glow mx-auto mt-3 max-w-4xl font-display text-3xl font-black leading-[1.1] sm:text-5xl">
          <span className="wordmark">{SITE.gameShort}</span> Card Prices
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg">
          <strong className="block text-fg">Buy {SITE.gameShort} cards at the best price</strong>
          Price check any card or sealed product and find the cheapest place to buy: live prices from TCGplayer, eBay and {storeCount} stores in the US, UK, Canada, Australia and Europe, in your own currency, updated daily.
        </p>
        <div className="hero-search relative z-30 mx-auto mt-6 hidden max-w-2xl sm:block"><SearchBox big /></div>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-muted">Shopping from</p>
        <MarketChooser className="mt-2 justify-center" bare />
        {trending.length > 0 && (
          <div className="mx-auto mt-5 max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Trending</p>
            <ul className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {trending.map((p) => (
                <li key={p.id}>
                  <Link href={`/card/${p.slug}`} className="block truncate rounded-full border border-ink-700 bg-ink-900/70 px-3 py-2 text-sm text-fg/85 transition-colors hover:border-brand hover:text-fg">
                    {shortName(p.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-5 text-xs text-muted">
          {m ? `${m.counts.cards.toLocaleString()} cards · ${m.counts.sealed} sealed products · ${storeCount} stores · prices updated ${ago(m.updatedAt)}` : "Prices update daily"}
          {upcoming && <> · <Link className="link" href={preorderPath(upcoming)}>{upcoming.name} pre-orders →</Link></>}
        </p>
        <p className="mt-3 text-sm"><Link href="/cards" className="link font-semibold">All {m?.counts.cards.toLocaleString() ?? ""} cards in the database →</Link></p>
      </section>

      {/* Multi-game sites (SITE.lines): one tile per game, straight under the hero. */}
      <GameTiles />

      {topDeals.length > 0 && (
        <section className="sd">
          <Header title="Today's top deals" href="/tools/deal-finder" sub="In-stock listings below TCGplayer market, refreshed daily." all="Browse all deals" />
          {bfSeason(today) && <p className="mb-3 text-sm"><Link className="link" href="/black-friday">Black Friday and Cyber Monday deals, updated daily →</Link></p>}
          {salesInSeason(CORE_SALES, today).map((s) => (
            <p key={s.slug} className="mb-3 text-sm"><Link className="link" href={`/${s.slug}`}>{s.linkLabel}, updated daily →</Link></p>
          ))}
          <div className="sd-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topDeals.map((d) => (
              <Link key={`${d.p.id}${d.offer.source}`} href={`/card/${d.p.slug}`} className="card-surface flex min-w-0 items-center gap-3 p-3 transition hover:border-brand/60">
                {d.p.image && <img src={d.p.image} alt={d.p.name} className="h-20 w-14 object-contain" loading="lazy" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{shortName(d.p.name)}</p>
                  <p className="text-xs text-muted">Market {money(d.market)}</p>
                  <p className="text-sm"><b className="text-buy-400">{money(d.offer.cents, d.offer.currency)}</b> <span className="text-xs text-muted">({d.saving}% under)</span></p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {hero && hero.featured.length > 0 && (
        <div className="sd">
          <SealedHero data={hero} game={SITE.gameShort} sealedHref={sealedLinks.some((h) => h.slug === "booster-box") ? "/sealed/booster-box" : "/sealed"} />
        </div>
      )}
      {/* Sealed is as big a market as singles: it gets a shelf of its own. */}
      {shelf.length > 0 && !(hero && hero.featured.length > 0) && (
        <section className="sd">
          <Header title={`${SITE.gameShort} booster boxes and sealed`} href="/sealed" sub="Newest sets first. Open one to compare every store." />
          <TileGrid items={shelf} />
        </section>
      )}

      {/* Model kits (SITE.kits): the kits most shops have in stock. */}
      {SITE.kits && kitsOn() && (
        <section className="sd">
          <Header title={`${SITE.kits.label} prices`} href="/kits" sub={`${kits().length.toLocaleString()} ${SITE.kits.noun} across ${SITE.kits.stores.length} hobby shops, matched by barcode.`} />
          <KitGrid items={popular(kits()).slice(0, 6)} />
        </section>
      )}

      {latest && chase.length > 0 && (
        <section className="sd">
          <Header title={`${latest.name} chase cards`} href={`/sets/${latest.slug}`} sub="The most valuable cards in the newest set, with every store's price." all="Full set price guide" />
          <TileGrid items={chase} />
        </section>
      )}

      {/* The site's own star score and approved reviews (owner, 2026-11-03), loaded in the browser; nothing until there is a rating. */}
      <SiteReviews />

      {posts().length > 0 && (
        <section className="sd">
          <Header title="Guides" href="/blog" sub={`Buying guides and price explainers for ${SITE.gameShort}.`} />
          <div className="sd-stagger grid gap-3 md:grid-cols-3">
            {posts().slice(0, 3).map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="card-surface p-5 transition hover:border-brand/60">
                <p className="font-semibold">{p.title}</p>
                <p className="mt-1 line-clamp-3 text-sm text-muted">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="sd max-w-3xl">
        <h2 className="mb-3 text-xl font-bold">Frequently asked questions</h2>
        {faqs.map((f) => (
          <details key={f.q} className="border-b border-ink-800 py-3">
            <summary className="cursor-pointer font-medium">{f.q}</summary>
            <p className="mt-2 text-sm text-muted">{f.a}</p>
          </details>
        ))}
      </section>
      <p className="sr-only">{products().length} products tracked</p>
    </div>
  );
}

function Header({ title, href, sub, all = "See all" }: { title: string; href?: string; sub?: string; all?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-black sm:text-2xl">{title}</h2>
        {sub && <p className="text-sm text-muted">{sub}</p>}
      </div>
      {href && <Link href={href} className="btn-ghost shrink-0 px-3.5 py-1.5 text-xs sm:text-sm">{all} →</Link>}
    </div>
  );
}

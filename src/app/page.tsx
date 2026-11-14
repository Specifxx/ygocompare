import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { SearchBox } from "@/components/SearchBox";
import { MarketChooser } from "@/components/ClientPrefs";
import { ChristmasGifts } from "@/components/ChristmasGifts";
import { DealGrid, TileGrid } from "@/components/ProductTile";
import { deals, latestReleasedSet, meta, products, refCents, worthFeaturing } from "@/lib/data";
import { ago, money } from "@/lib/format";
import { posts } from "@/lib/posts";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { SetInfo } from "@/lib/site-types";
import { fitTitle } from "@/lib/seo-title";
import { featuredSealed, sealedHubs, sealedInSet, sealedSets } from "@/lib/hubs";
import { isPreorder, longDate, preorderPath } from "@/lib/preorders";
import { openPreorder } from "@/lib/preorder-nav";
import { seasonMarkupLive } from "@/lib/season";
import { imageAt } from "@/lib/image";
import { sealedHero } from "@/lib/sealed-hero";
import { SealedShelf } from "@/components/home/SealedShelf";
import { Hero, HeroPill, riseAt, WaysIn, type Way, type WayShape } from "@/components/home/Hero";
import { Tabs, type Tab } from "@/components/Tabs";
import { Fold, Folds } from "@/components/Fold";
import { InlineAds } from "@/components/InlineAds";
import { inlineReady } from "@/lib/inline-ads";
import { Section } from "@/components/Section";
import { adSearch, cardAds } from "@/lib/card-ads";

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

// The hero's ways in to the product types, most wanted first: the first three that exist on this site are shown.
const TYPE_WAYS: [slug: string, icon: WayShape][] = [
  ["booster-box", "box"],
  ["tin", "tin"],
  ["structure-deck", "deck"],
  ["collection", "gift"],
  ["special-edition", "gift"],
  ["starter-deck", "deck"],
  ["booster-pack", "pack"],
];

/** "4 Dec" from an ISO date, for a line that names more than one release. */
const shortDate = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "date to be announced");

/**
 * The home page, the minimal look (owner, 2026-11-13: "we're making things too complicated … get rid of the products on the hero
 * … cull the features that we show"; DECISIONS.md). Six blocks and no more: the hero (words, the search, the markets, six ways in,
 * never a product), ONE shelf with its lists behind tabs (the newest booster boxes, the pre-orders, today's deals), the latest
 * sets, the page's one ad block, then the guides folded to a line and the questions. What left the page is one click away in the
 * header's menus and the footer: the creators bubble, the trending chips, the featured boxes in the hero, the sale links (the
 * strip under the header has them) and the reviews row (the footer's "Rate us").
 */
export default function Home() {
  const m = meta();
  const latest = latestReleasedSet();
  // Sealed only (2026-11-06): the newest set's sealed products worth featuring.
  const chase = latest ? sealedInSet(latest.id).filter((p) => worthFeaturing(p.id)).slice(0, 12) : [];
  const shelf = featuredSealed(6);
  const hubs = sealedHubs();
  // The shelf's market-priced lists (lib/sealed-hero.ts): the newest boxes, then each set on pre-order.
  const hero = sealedHero();
  // Today's deals, one card a product (a product two stores discount keeps its bigger saving).
  const dealt = new Set<number>();
  const topDeals = deals(24)
    .filter((d) => !dealt.has(d.p.id) && dealt.add(d.p.id))
    .slice(0, 8);
  const storeCount = SITE.stores.length;
  // The hero's one pill: the Christmas gift guide in its season (owner, 2026-11-12), else the release on pre-order.
  const xmas = seasonMarkupLive("christmas");
  const preorder = openPreorder();
  const ads = cardAds({ limit: 10 });
  const faqs = [
    { q: `What is ${SITE.name}?`, a: `${SITE.name} is a free ${SITE.game} sealed price comparison site. It compares prices for every ${SITE.gameShort} booster box, pack, tin, structure deck and collection across TCGplayer, eBay, Amazon and ${storeCount} online game stores in the US, UK, Canada and Australia, and updates them every day.` },
    { q: `Where is the cheapest place to buy a ${SITE.gameShort} booster box?`, a: `It changes box by box. Search a set on ${SITE.name} to see every store's price for its booster box, cheapest in-stock first, in your own currency, with a direct link to buy.` },
    { q: `How often are ${SITE.gameShort} prices updated?`, a: `Every day. TCGplayer prices and store listings refresh daily, and eBay listings for every sealed product are re-checked every one to two days.` },
    { q: `Does ${SITE.name} list single cards?`, a: `No. ${SITE.name} compares sealed product only: booster boxes, packs, tins, decks and collections, where store prices differ the most.` },
    { q: `Is ${SITE.name} free?`, a: `Yes, completely, and you don't need an account. ${SITE.name} is paid for by affiliate commissions: when you buy through some links, the store may pay us a small fee at no cost to you.` },
  ];

  // The hero's ways in: the six pages most visitors want next. Never products.
  const ways: Way[] = [
    ...TYPE_WAYS.flatMap(([slug, icon]): Way[] => {
      const h = hubs.find((x) => x.slug === slug);
      return h ? [{ href: `/sealed/${h.slug}`, label: h.label, icon }] : [];
    }).slice(0, 3),
    { href: "/preorders", label: "Pre-orders", icon: "calendar" },
    { href: "/tools/deal-finder", label: "Deals", icon: "tag" },
    { href: "/sets", label: "All sets", icon: "sets" },
  ];

  // The latest sets: the newest released one first, then the ones on pre-order (soonest first), then the rest. Never a pre-order first.
  const newestSets = sealedSets().slice(0, 4);
  const upcomingSets = newestSets.filter((s) => isPreorder(s)).sort((a, b) => (a.releasedOn ?? "9999").localeCompare(b.releasedOn ?? "9999"));
  const releasedSets = newestSets.filter((s) => !isPreorder(s));
  const latestSets = [...releasedSets.slice(0, 1), ...upcomingSets, ...releasedSets.slice(1)];

  // The one shelf (components/Tabs.tsx): every list is server-rendered and stays in the HTML; a tab only chooses which is shown.
  const boxes = hubs.some((h) => h.slug === "booster-box");
  const onShelf = new Set(hero.featured.map((i) => i.id));
  const shelfTabs: Tab[] = [
    ...(hero.featured.length
      ? [
          {
            label: boxes ? "Booster boxes" : "Sealed",
            panel: (
              <Shelf heading={`The newest ${SITE.gameShort} ${boxes ? "booster boxes" : "sealed products"}, each at its cheapest store today`} links={[{ href: boxes ? "/sealed/booster-box" : "/sealed", label: boxes ? "All booster boxes" : "All sealed products" }]}>
                <SealedShelf items={hero.featured} />
              </Shelf>
            ),
          },
        ]
      : []),
    ...(hero.preorders.length
      ? [
          {
            label: "Pre-orders",
            panel: (
              <Shelf heading={`${SITE.gameShort} sets open for pre-order`} links={hero.preorders.map((s) => ({ href: s.href, label: `${s.name} pre-orders` }))}>
                <SealedShelf items={hero.preorders.flatMap((s) => s.items)} sub={hero.preorders.map((s) => `${s.name} is out ${shortDate(s.releasesOn)}`).join(", ")} />
              </Shelf>
            ),
          },
        ]
      : []),
    ...(topDeals.length
      ? [
          {
            label: "Deals",
            panel: (
              <Shelf heading="Today's top deals" note="In-stock listings below TCGplayer market, refreshed daily." links={[{ href: "/tools/deal-finder", label: "Browse all deals" }]}>
                <DealGrid items={topDeals} />
              </Shelf>
            ),
          },
        ]
      : []),
    // The newest set has its own list only when it adds a product the first list does not already show.
    ...(latest && chase.some((p) => !onShelf.has(p.id))
      ? [
          {
            label: latest.name,
            panel: (
              <Shelf heading={`${latest.name} booster boxes and sealed`} note="The newest set's sealed product, with every store's price." links={[{ href: `/sets/${latest.slug}`, label: "Every product in the set" }]}>
                <TileGrid items={chase} roomy />
              </Shelf>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE.name, url: SITE_URL, logo: `${SITE_URL}/icon.svg` }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE_URL, publisher: { "@id": `${SITE_URL}/#org` } }} />
      {/* The products on this page, by their own URLs: the shelf and the newest set's sealed (SEO audit, 2026-11-03). */}
      {shelf.length + chase.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${SITE.gameShort} booster box and sealed prices`, itemListElement: [...shelf, ...chase].map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/card/${p.slug}`, name: p.name })) }} />
      )}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />

      {/* The hero: words, the search and six ways in, never a product (components/home/Hero.tsx). The h1 is the one the old hero carried. */}
      <Hero>
        {/* The one small line above the headline. */}
        {xmas ? (
          <div className="rise">
            <ChristmasGifts />
          </div>
        ) : (
          preorder && (
            <HeroPill href={preorderPath(preorder)}>
              <span>
                <b>{preorder.name}</b> pre-orders · out {longDate(preorder.releasedOn)}
              </span>
            </HeroPill>
          )
        )}
        <h1 className="hero-h1 rise-solid">
          <span className="text-brand">{SITE.gameShort}</span> Booster Box Prices
        </h1>
        <p className="hero-sub rise" style={riseAt(1)}>
          Buy {SITE.gameShort} sealed at the best price: today&rsquo;s prices from TCGplayer, eBay, Amazon and {storeCount} stores, in your own currency.
        </p>
        <div className="hero-search rise" style={riseAt(2)}>
          <SearchBox big />
        </div>
        <div className="rise mt-6" style={riseAt(3)}>
          <MarketChooser className="justify-center" />
        </div>
        <WaysIn links={ways} label={`Popular ${SITE.gameShort} pages`} />
        {/* One quiet line of facts (it was three chips). */}
        <p className="hero-meta rise" style={riseAt(5)}>
          {m ? (
            <>
              <span>
                <span className="live" aria-hidden="true" /> <b>{products().length.toLocaleString("en")}</b> sealed products
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <b>{storeCount.toLocaleString("en")}</b> stores
              </span>
              {/* On a phone the freshness is the line's second row, by design: a wrapped line would end on a stray dot. */}
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
              <span className="basis-full sm:basis-auto">prices updated {ago(m.updatedAt)}</span>
            </>
          ) : (
            <span>Prices update daily</span>
          )}
        </p>
      </Hero>

      {shelfTabs.length > 0 && (
        <Section title={`${SITE.gameShort} booster boxes and sealed`} className="reveal mt-8 sm:mt-12">
          <Tabs tabs={shelfTabs} label={`${SITE.gameShort} sealed products`} />
        </Section>
      )}

      {latestSets.length > 0 && (
        <Section title="Latest sets" href="/sets" linkLabel="All sets" className="reveal mt-16 sm:mt-24">
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {latestSets.map((s) => (
              <li key={s.id} className="flex">
                <SetTile s={s} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* The page's one ad block (owner, 2026-11-13): native, horizontal, under everything the visitor came for; never in the hero. */}
      {inlineReady(ads, undefined) && (
        <div className="reveal mt-16 sm:mt-24">
          <InlineAds ads={ads} search={adSearch()} page="home" />
        </div>
      )}

      {/* The reading matter: in the HTML for a crawler and for find-in-page, one line until opened (components/Fold.tsx). */}
      {posts().length > 0 && (
        <Folds label={`More about ${SITE.gameShort} prices`}>
          <Fold id="guides-h" title="Guides">
            <p className="mb-4 text-sm text-muted">Buying guides and price explainers for {SITE.gameShort}.</p>
            <div className="grid gap-3 md:grid-cols-3">
              {posts()
                .slice(0, 3)
                .map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="card group p-5 transition-colors hover:border-ink/40">
                    <p className="font-semibold group-hover:text-brand">{p.title}</p>
                    <p className="mt-1 line-clamp-3 text-sm text-muted">{p.description}</p>
                  </Link>
                ))}
            </div>
            <p className="mt-4 text-sm">
              <Link href="/blog" className="font-semibold text-muted transition-colors hover:text-ink">
                See all guides →
              </Link>
            </p>
          </Fold>
        </Folds>
      )}

      <section className="mx-auto mt-16 max-w-3xl sm:mt-24" aria-labelledby="faq-h">
        <h2 id="faq-h" className="mb-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Frequently asked questions
        </h2>
        {faqs.map((f) => (
          <details key={f.q} className="faq">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
      <p className="sr-only">{products().length} products tracked</p>
    </div>
  );
}

/** One list of the shelf: its products, then the way to all of them. The heading is for a screen reader's outline (the tab says it). */
function Shelf({ heading, note, links, children }: { heading: string; note?: string; links: { href: string; label: string }[]; children: ReactNode }) {
  return (
    <>
      <h3 className="sr-only">{heading}</h3>
      {note && <p className="-mt-1 mb-5 text-sm text-muted">{note}</p>}
      {children}
      <p className="mt-8 flex flex-wrap justify-center gap-3 sm:mt-10">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="btn-ghost min-h-11 px-5">
            {l.label} <span aria-hidden="true">→</span>
          </Link>
        ))}
      </p>
    </>
  );
}

/**
 * A latest set, as one tile: its booster box (or its first sealed product with a photo) on a plate, its name and release date, and
 * what its headline product costs today (TCGplayer market). The whole tile is the link to the set's page, which lists every product.
 */
function SetTile({ s }: { s: SetInfo }) {
  const sealed = sealedInSet(s.id);
  const lead = sealed.find((p) => refCents(p.id) != null) ?? null;
  const art = imageAt(sealed.find((p) => p.image)?.image, "200w");
  return (
    <Link href={`/sets/${s.slug}`} className="set-tile group">
      {art ? (
        <span className="set-tile-art plate">
          <img src={art} alt={`${s.name} sealed product`} width={48} height={48} className="h-full w-full object-contain p-1" loading="lazy" decoding="async" />
        </span>
      ) : (
        <span className="set-tile-art bg-brand-soft font-display text-lg font-bold text-brand-strong">{s.name.slice(0, 1)}</span>
      )}
      <span className="min-w-0">
        <span className="block truncate font-display text-base font-bold leading-tight transition-colors group-hover:text-brand">{s.name}</span>
        <span className="mt-0.5 block truncate text-xs text-faint">
          {isPreorder(s) ? "Releases" : "Released"} {longDate(s.releasedOn)}
        </span>
        {/* The price and what it is never give way: on a narrow tile the product type shortens, not the figure. */}
        <span className="mt-1 flex items-baseline gap-1.5 text-[13px] text-muted">
          {lead ? (
            <>
              <span className="min-w-0 truncate">{lead.sealedType ?? "Sealed"}</span>
              <b className="tabular shrink-0 font-semibold text-ink">{money(refCents(lead.id))}</b>
              <span className="shrink-0">market</span>
            </>
          ) : (
            <span className="min-w-0 truncate">{`${sealed.length} sealed product${sealed.length === 1 ? "" : "s"}`}</span>
          )}
        </span>
      </span>
    </Link>
  );
}

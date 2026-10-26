import Link from "next/link";
import { SITE } from "@/site.config";
import { SearchBox } from "@/components/SearchBox";
import { EbayPicks } from "@/components/EbayPicks";
import { AdSlot } from "@/components/AdSlot";
import { HalloweenBanner } from "@/components/HalloweenDecor";
import { TileGrid } from "@/components/ProductTile";
import { byValue, deals, latestReleasedSet, meta, movers, nextUpcomingSet, products, productsInSet, sets } from "@/lib/data";
import { ago, money, pct } from "@/lib/format";
import { posts } from "@/lib/posts";
import { shortName } from "@/lib/names";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import { TOOLS } from "@/lib/tool-list";

export const revalidate = 21600;

export default function Home() {
  const m = meta();
  const latest = latestReleasedSet();
  const upcoming = nextUpcomingSet();
  const chase = latest ? byValue(productsInSet(latest.id).filter((p) => p.kind === "card")).slice(0, 12) : [];
  const mv = movers(7, 300);
  const topDeals = deals(6);
  const storeCount = SITE.stores.length;
  const faqs = [
    { q: `What is ${SITE.name}?`, a: `${SITE.name} is a free ${SITE.game} price comparison site. It compares prices for every ${SITE.gameShort} card and sealed product across TCGplayer, eBay and ${storeCount} online game stores in the US, UK, Canada, Australia and Europe, and updates them every day.` },
    { q: `Where is the cheapest place to buy ${SITE.gameShort} cards?`, a: `It changes card by card. Search a card on ${SITE.name} to see every store's price for it, cheapest in-stock first, in your own currency, with a direct link to buy.` },
    { q: `How often are ${SITE.gameShort} prices updated?`, a: `Every day. TCGplayer prices and store listings refresh daily; eBay listings for cards worth $20 or more are re-checked every one to four days depending on value and demand.` },
    { q: `Is ${SITE.name} free?`, a: `Yes, completely, and you don't need an account. ${SITE.name} is paid for by affiliate commissions: when you buy through some links, the store may pay us a small fee at no cost to you.` },
  ];
  return (
    <div className="flex flex-col gap-10">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE_URL, potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/cards?q={q}`, "query-input": "required name=q" } }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />

      <section className="hero-band -mx-4 rounded-none px-4 py-10 md:rounded-2xl md:py-14">
        <h1 className="font-display text-3xl font-black md:text-5xl">
          <span className="wordmark">{SITE.gameShort}</span> card prices, every store, one search
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Compare {m?.counts.cards.toLocaleString() ?? "every"} {SITE.gameShort} cards and {m?.counts.sealed ?? ""} sealed products across TCGplayer, eBay and {storeCount} stores — in your currency, updated daily.
        </p>
        <div className="mt-6 max-w-2xl"><SearchBox big /></div>
        <p className="mt-3 text-xs text-muted">
          {m ? `Prices updated ${ago(m.updatedAt)} · ${m.counts.offers.toLocaleString()} live prices` : "Prices update daily"}
          {upcoming && <> · <Link className="link" href="/preorders">{upcoming.name} pre-orders →</Link></>}
        </p>
      </section>

      <HalloweenBanner />
      {/* Ad banners near the top of the homepage, as on Rift Compare: the eBay
          Picks unit under the hero, then one display slot. */}
      <EbayPicks />
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME} />

      {topDeals.length > 0 && (
        <section>
          <Header title="Today's top deals" href="/tools/deal-finder" sub="In-stock listings below TCGplayer market" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topDeals.map((d) => (
              <Link key={`${d.p.id}${d.offer.source}`} href={`/card/${d.p.slug}`} className="card-surface flex items-center gap-3 p-3 hover:border-brand/60">
                {d.p.image && <img src={d.p.image} alt="" className="h-20 w-14 object-contain" loading="lazy" />}
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

      <section>
        <Header title="Free price tools" href="/tools" sub="Everything that's Premium on other sites, free here. No account needed." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="card-surface p-4 hover:border-brand/60">
              <p className="font-semibold">{t.name}</p>
              <p className="mt-1 text-sm text-muted">{t.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {upcoming && (
        <section className="card-surface flex flex-col items-start gap-3 p-6 md:flex-row md:items-center">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-brand-400">Next set · {upcoming.releasedOn}</p>
            <h2 className="text-2xl font-bold">{upcoming.name} pre-orders</h2>
            <p className="text-sm text-muted">Every store taking pre-orders for {upcoming.name} booster boxes and products, cheapest first.</p>
          </div>
          <Link href="/preorders" className="btn-primary">Compare pre-order prices</Link>
        </section>
      )}

      {latest && chase.length > 0 && (
        <section>
          <Header title={`Most valuable ${latest.name} cards`} href={`/sets/${latest.slug}`} sub="Chase cards from the newest set" />
          <TileGrid items={chase} />
        </section>
      )}

      {/* Hidden until there is a week of daily history to compare against. */}
      {(mv.up.length > 0 || mv.down.length > 0) && (
        <section className="grid gap-6 md:grid-cols-2">
          <MoverList title="Biggest risers (7 days)" rows={mv.up.slice(0, 8)} />
          <MoverList title="Biggest fallers (7 days)" rows={mv.down.slice(0, 8)} />
        </section>
      )}

      <section>
        <Header title="Set price guides" href="/sets" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {sets().filter((s) => s.productCount > 20).slice(0, 12).map((s) => (
            <Link key={s.id} href={`/sets/${s.slug}`} className="card-surface px-4 py-3 hover:border-brand/60">
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-muted">{s.upcoming ? "Upcoming · " : ""}{s.releasedOn} · {s.productCount} products</p>
            </Link>
          ))}
        </div>
      </section>

      {posts().length > 0 && (
        <section>
          <Header title="Guides" href="/blog" />
          <div className="grid gap-3 md:grid-cols-3">
            {posts().slice(0, 3).map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="card-surface p-4 hover:border-brand/60">
                <p className="font-semibold">{p.title}</p>
                <p className="mt-1 line-clamp-3 text-sm text-muted">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-3xl">
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

function Header({ title, href, sub }: { title: string; href?: string; sub?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {sub && <p className="text-sm text-muted">{sub}</p>}
      </div>
      {href && <Link href={href} className="link text-sm">See all →</Link>}
    </div>
  );
}

function MoverList({ title, rows }: { title: string; rows: ReturnType<typeof movers>["up"] }) {
  return (
    <div className="card-surface p-4">
      <h2 className="mb-2 font-bold">{title}</h2>
      {rows.length === 0 && <p className="text-sm text-muted">Movers appear after a week of daily prices.</p>}
      <ul>
        {rows.map((r) => (
          <li key={r.p.id} className="flex items-center justify-between border-t border-ink-800 py-1.5 text-sm">
            <Link href={`/card/${r.p.slug}`} className="truncate hover:underline">{shortName(r.p.name)}</Link>
            <span className="ml-2 shrink-0 tabular-nums">{money(r.cents)} <span className={r.change >= 0 ? "text-up" : "text-down"}>{pct(r.change)}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}


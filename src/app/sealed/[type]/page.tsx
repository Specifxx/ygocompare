import { abs } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { InlineAds } from "@/components/InlineAds";
import { adSearch, cardAds } from "@/lib/card-ads";
import { sealedHubs } from "@/lib/hubs";
import { rankProducts } from "@/lib/home-demand";
import { FilterGrid } from "@/components/FilterGrid";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const dynamic = "force-dynamic"; // one CDN copy per URL (next.config.js CDN_PAGES), never ISR

const hub = (slug: string) => sealedHubs().find((h) => h.slug === slug) ?? null;

export function generateMetadata({ params }: { params: { type: string } }): Metadata {
  const h = hub(params.type);
  if (!h) return {};
  return {
    title: `${SITE.gameShort} ${h.label.toLowerCase()} — prices for every set`,
    description: `Compare prices for all ${h.items.length} ${SITE.game} ${h.label.toLowerCase()} across TCGplayer, eBay and ${SITE.stores.length} stores, most popular first.`,
    ...canon(`/sealed/${h.slug}`),
  };
}

// The minimal look (2026-11-13): the headline, one line, the other product types as a row of chips (the page's filters; they were
// a section under the grid), then every product of the type.
export default function SealedHub({ params }: { params: { type: string } }) {
  const h = hub(params.type);
  if (!h) notFound();
  const items = h.items;
  const others = sealedHubs().filter((x) => x.slug !== h.slug);
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <header>
        <Breadcrumbs items={[{ name: "Sealed", href: "/sealed" }, { name: h.label }]} />
        <h1 className="list-h1 font-display text-3xl font-bold tracking-tight sm:text-5xl">{SITE.gameShort} {h.label.toLowerCase()}</h1>
        {/* One line plus "How it works" (owner's UX review, 2026-11-23, P1 14). */}
        <p className="mt-3 text-sm text-muted">{h.items.length.toLocaleString()} products, most popular first. <Link href="/methodology" className="link">How it works</Link></p>
        {others.length > 0 && (
          <nav aria-label="Other product types" className="mt-5">
            {/* One row that scrolls sideways at every width: a wrapping row changes its line count when the web font arrives. */}
            <ul className="scroller -mx-4 scroll-px-4 gap-2 px-4 sm:mx-0 sm:px-0">
              <li>
                <Link href="/sealed" className="chip min-h-10 whitespace-nowrap">All sealed</Link>
              </li>
              {others.map((x) => (
                <li key={x.slug}>
                  <Link href={`/sealed/${x.slug}`} className="chip min-h-10 whitespace-nowrap">{x.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      {items.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${SITE.gameShort} ${h.label.toLowerCase()}`, numberOfItems: items.length, itemListElement: rankProducts(items).slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: abs(`/card/${p.slug}`) })) }} />
      )}
      <FilterGrid items={items} games noun={h.label.toLowerCase()} />
      {/* Ads sit below the page's own content, never above it (2026-11-19, core-update quality pass). */}
      <InlineAds ads={cardAds({ kind: "sealed", limit: 10 })} search={adSearch()} page="sealed-type" />
    </div>
  );
}

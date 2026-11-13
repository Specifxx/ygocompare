import { abs } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { setById } from "@/lib/data";
import { InlineAds } from "@/components/InlineAds";
import { adSearch, cardAds } from "@/lib/card-ads";
import { sealedHubs } from "@/lib/hubs";
import { TileGrid } from "@/components/ProductTile";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const dynamic = "force-dynamic"; // one CDN copy per URL (next.config.js CDN_PAGES), never ISR

const hub = (slug: string) => sealedHubs().find((h) => h.slug === slug) ?? null;

export function generateMetadata({ params }: { params: { type: string } }): Metadata {
  const h = hub(params.type);
  if (!h) return {};
  return {
    title: `${SITE.gameShort} ${h.label.toLowerCase()} — prices for every set`,
    description: `Compare prices for all ${h.items.length} ${SITE.game} ${h.label.toLowerCase()} across TCGplayer, eBay and ${SITE.stores.length} stores, newest set first.`,
    ...canon(`/sealed/${h.slug}`),
  };
}

// The minimal look (2026-11-13): the headline, one line, the other product types as a row of chips (the page's filters; they were
// a section under the grid), then every product of the type.
export default function SealedHub({ params }: { params: { type: string } }) {
  const h = hub(params.type);
  if (!h) notFound();
  const items = h.items.slice().sort((a, b) => (setById(b.setId)?.releasedOn ?? "").localeCompare(setById(a.setId)?.releasedOn ?? ""));
  const others = sealedHubs().filter((x) => x.slug !== h.slug);
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <header>
        <Breadcrumbs items={[{ name: "Sealed", href: "/sealed" }, { name: h.label }]} />
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{SITE.gameShort} {h.label.toLowerCase()}</h1>
        <p className="mt-3 text-sm text-muted">{h.items.length} products, newest set first. Open any one to compare every store and eBay.</p>
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
        <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${SITE.gameShort} ${h.label.toLowerCase()}`, numberOfItems: items.length, itemListElement: items.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: abs(`/card/${p.slug}`) })) }} />
      )}
      <TileGrid items={items} />
      <InlineAds ads={cardAds({ kind: "sealed", limit: 10 })} search={adSearch()} page="sealed-type" />
    </div>
  );
}

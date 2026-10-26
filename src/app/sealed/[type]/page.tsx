import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { setById } from "@/lib/data";
import { sealedHubs } from "@/lib/hubs";
import { TileGrid } from "@/components/ProductTile";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const revalidate = 21600;
export const generateStaticParams = () => [];

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

export default function SealedHub({ params }: { params: { type: string } }) {
  const h = hub(params.type);
  if (!h) notFound();
  const items = h.items.slice().sort((a, b) => (setById(b.setId)?.releasedOn ?? "").localeCompare(setById(a.setId)?.releasedOn ?? ""));
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ name: "Sealed", href: "/sealed" }, { name: h.label }]} />
      <header>
        <h1 className="font-display text-3xl font-black">{SITE.gameShort} {h.label.toLowerCase()}</h1>
        <p className="mt-2 text-muted">{h.items.length} products, newest set first. Open any one to compare every store and eBay.</p>
      </header>
      <TileGrid items={items} />
      <section>
        <h2 className="mb-3 text-lg font-bold">Other sealed products</h2>
        <div className="flex flex-wrap gap-2">
          {sealedHubs().filter((x) => x.slug !== h.slug).map((x) => <Link key={x.slug} href={`/sealed/${x.slug}`} className="chip hover:border-brand">{x.label}</Link>)}
        </div>
      </section>
    </div>
  );
}

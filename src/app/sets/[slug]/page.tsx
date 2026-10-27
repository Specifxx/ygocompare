import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { byValue, priceOf, productsInSet, refCents, setBySlug, sets } from "@/lib/data";
import { rarityHref } from "@/lib/hubs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { money, pct } from "@/lib/format";
import { shortName } from "@/lib/names";
import { TileGrid } from "@/components/ProductTile";

export const revalidate = 86400; // data only changes with a release (DECISIONS.md, "Vercel cost")
// Empty list = nothing prerendered at build, but each page is cached (ISR)
// after its first visit instead of rendering on every request.
export const generateStaticParams = () => [];

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const s = setBySlug(params.slug);
  if (!s) return {};
  return {
    title: `${s.name} price guide — every ${SITE.gameShort} card's value`,
    description: `${s.name} card prices: the most valuable cards, every card's TCGplayer market price, and the cheapest store and eBay listings. Updated daily.`,
    ...canon(`/sets/${s.slug}`),
  };
}

export default function SetPage({ params }: { params: { slug: string } }) {
  const s = setBySlug(params.slug);
  if (!s) notFound();
  const all = byValue(productsInSet(s.id));
  const cards = all.filter((p) => p.kind === "card");
  const sealed = all.filter((p) => p.kind === "sealed");
  const value = cards.reduce((a, p) => a + (refCents(p.id) ?? 0), 0);
  const rarityOrder = (r: string | null) => { const i = SITE.rarityOrder.indexOf(r ?? ""); return i < 0 ? 99 : i; };
  const byNumber = cards.slice();
  const listed = sets().filter((x) => x.productCount > 0);
  const i = listed.findIndex((x) => x.id === s.id);
  const newer = i > 0 ? listed[i - 1] : null;
  const older = i >= 0 && i < listed.length - 1 ? listed[i + 1] : null;
  const others = listed.filter((x) => x.id !== s.id && x.productCount > 20).slice(0, 12);
  return (
    <div className="flex flex-col gap-8">
      <div>
      <Breadcrumbs items={[{ name: "Sets", href: "/sets" }, { name: s.name }]} />
      <header>
        <p className="text-xs uppercase tracking-wide text-brand-400">{s.upcoming ? "Upcoming" : "Released"} {s.releasedOn}</p>
        <h1 className="font-display text-3xl font-black">{s.name} price guide</h1>
        <p className="mt-2 text-muted">{cards.length} cards · one of each is worth {money(value)} at TCGplayer market · {sealed.length} sealed products.</p>
      </header>
      </div>
      {cards.length > 0 && (<section><h2 className="mb-3 text-xl font-bold">Most valuable {s.name} cards</h2><TileGrid items={cards.slice(0, 18)} /></section>)}
      {sealed.length > 0 && (<section><h2 className="mb-3 text-xl font-bold">{s.name} booster boxes and sealed</h2><TileGrid items={sealed.slice(0, 12)} /></section>)}
      {cards.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Full {s.name} card list with prices</h2>
          <div className="overflow-x-auto rounded-xl border border-ink-700/60">
            <table className="w-full text-sm">
              <thead className="bg-ink-850 text-left text-xs uppercase text-muted"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Card</th><th className="px-3 py-2">Rarity</th><th className="px-3 py-2 text-right">Market</th><th className="px-3 py-2 text-right">7d</th><th className="px-3 py-2 text-right">Stores</th></tr></thead>
              <tbody>
                {byNumber.sort((a, b) => rarityOrder(a.rarity) - rarityOrder(b.rarity) || (parseInt(a.number ?? "") || 0) - (parseInt(b.number ?? "") || 0)).map((p) => {
                  const e = priceOf(p.id);
                  return (
                    <tr key={p.id} className="border-t border-ink-800">
                      <td className="px-3 py-1.5 text-muted">{p.number}</td>
                      <td className="px-3 py-1.5"><Link className="hover:underline" href={`/card/${p.slug}`}>{shortName(p.name)}</Link></td>
                      <td className="px-3 py-1.5 text-muted">{rarityHref(p.rarity) ? <Link className="hover:underline" href={rarityHref(p.rarity)!}>{p.rarity}</Link> : p.rarity}</td>
                      <td className="px-3 py-1.5 text-right font-semibold tabular-nums">{money(refCents(p.id))}</td>
                      <td className={`px-3 py-1.5 text-right ${(e.change7d ?? 0) >= 0 ? "text-up" : "text-down"}`}>{pct(e.change7d)}</td>
                      <td className="px-3 py-1.5 text-right text-muted">{new Set(e.offers.filter((o) => o.inStock).map((o) => o.source)).size}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <nav className="flex flex-wrap justify-between gap-3 text-sm" aria-label="Neighbouring sets">
        {older ? <Link className="link" href={`/sets/${older.slug}`}>← {older.name}</Link> : <span />}
        {newer && <Link className="link" href={`/sets/${newer.slug}`}>{newer.name} →</Link>}
      </nav>
      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Other {SITE.gameShort} set price guides</h2>
          <div className="flex flex-wrap gap-2">{others.map((x) => <Link key={x.id} href={`/sets/${x.slug}`} className="chip hover:border-brand">{x.name}</Link>)}</div>
        </section>
      )}
    </div>
  );
}

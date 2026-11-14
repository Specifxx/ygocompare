import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound, permanentRedirect } from "next/navigation";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { setBySlug, summaryOf } from "@/lib/data";
import { preorderSetList, sealedInSet } from "@/lib/hubs";
import { isPreorder, longDate, preorderPath } from "@/lib/preorders";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { shortName } from "@/lib/names";
import { TileGrid } from "@/components/ProductTile";
import { JsonLd } from "@/components/JsonLd";
import { abs } from "@/lib/site";
import { fitTitle, setTitleCandidates } from "@/lib/seo-title";
import { postsAbout } from "@/lib/posts";
import { imageAt } from "@/lib/image";
import { SealedQuickBuy } from "@/components/SealedQuickBuy";
import { InlineAds } from "@/components/InlineAds";
import { adSearch, cardAds } from "@/lib/card-ads";
import { sealedSets } from "@/lib/hubs";
import { Fold, Folds } from "@/components/Fold";

export const dynamic = "force-dynamic"; // one CDN copy per URL (next.config.js CDN_PAGES), never ISR

// Sealed only (owner, 2026-11-06): a set page is the set's booster boxes, packs, tins and decks at every store. A set
// with no sealed product (promo and tournament card groups) has no page any more: it 301s to /sealed.

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const s = setBySlug(params.slug);
  if (!s) return {};
  const count = sealedInSet(s.id).length;
  if (!count) return {};
  const title = fitTitle(setTitleCandidates(s.name, count, !!s.upcoming));
  return {
    title,
    description: `${s.name} booster box, pack and sealed prices at every store we track: ${count} sealed product${count === 1 ? "" : "s"}, the cheapest in-stock price in the US, UK, Canada and Australia, beside TCGplayer, eBay and Amazon. Updated daily.`,
    ...canon(`/sets/${s.slug}`),
    openGraph: { ...canon(`/sets/${s.slug}`).openGraph, title: title.absolute },
  };
}

export default function SetPage({ params }: { params: { slug: string } }) {
  const s = setBySlug(params.slug);
  if (!s) notFound();
  const sealed = sealedInSet(s.id);
  if (!sealed.length) permanentRedirect("/sealed");
  const listed = sealedSets();
  const i = listed.findIndex((x) => x.id === s.id);
  const newer = i > 0 ? listed[i - 1] : null;
  const older = i >= 0 && i < listed.length - 1 ? listed[i + 1] : null;
  const others = listed.filter((x) => x.id !== s.id).slice(0, 12);
  const guides = postsAbout([s.name, s.code]).slice(0, 4);
  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${s.name} sealed products`,
          numberOfItems: sealed.length,
          itemListElement: sealed.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, name: shortName(p.name), url: abs(`/card/${p.slug}`) })),
        }}
      />
      {/* The minimal look (2026-11-13): the headline, one line and the way to the set's pre-order page, then the products: the buy
          block first (the page's earner), the grid under it. The set's guides are folded under the grid. */}
      <div>
        <Breadcrumbs items={[{ name: "Sets", href: "/sets" }, { name: s.name }]} />
        <header>
          <p className="eyebrow">{s.upcoming ? "Upcoming" : "Released"}{s.releasedOn ? ` ${longDate(s.releasedOn)}` : ""}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">{s.name} booster box &amp; sealed prices</h1>
          <p className="mt-3 text-sm text-muted">
            {sealed.length} sealed product{sealed.length === 1 ? "" : "s"}, compared across every store we track, TCGplayer, eBay and Amazon.
          </p>
          {preorderSetList().some((x) => x.id === s.id) && (
            <p className="mt-3 text-sm"><Link className="link font-semibold" href={preorderPath(s)}>{isPreorder(s) ? `${s.name} pre-order prices at every store →` : `${s.name} booster box prices at every store →`}</Link></p>
          )}
        </header>
      </div>
      <SealedQuickBuy
        title={`Buy ${s.name} booster boxes and sealed`}
        items={sealed.slice(0, 6).map((p) => ({ id: p.id, slug: p.slug, name: shortName(p.name), image: imageAt(p.image, "200w"), best: summaryOf(p.id).best, stores: summaryOf(p.id).listedSources }))}
      />
      <section>
        <h2 className="mb-6 font-display text-2xl font-bold tracking-tight sm:text-3xl">Every {s.name} sealed product</h2>
        <TileGrid items={sealed} />
      </section>
      <InlineAds ads={cardAds({ setId: s.id, fill: true, limit: 10 })} search={adSearch(s.name, s)} page="set" />
      {guides.length > 0 && (
        <Folds label={`More about ${s.name}`} className="">
          <Fold id="guides-h" title={`${s.name} guides`}>
            <ul className="list-disc pl-5 text-sm">{guides.map((g) => <li key={g.slug}><Link className="link" href={`/blog/${g.slug}`}>{g.title}</Link></li>)}</ul>
          </Fold>
        </Folds>
      )}
      <nav className="flex flex-wrap justify-between gap-3 text-sm" aria-label="Neighbouring sets">
        {older ? <Link className="link inline-flex min-h-10 items-center" href={`/sets/${older.slug}`}>← {older.name}</Link> : <span />}
        {newer && <Link className="link inline-flex min-h-10 items-center" href={`/sets/${newer.slug}`}>{newer.name} →</Link>}
      </nav>
      {others.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold tracking-tight">Other {SITE.gameShort} sets</h2>
          <div className="flex flex-wrap gap-2">{others.map((x) => <Link key={x.id} href={`/sets/${x.slug}`} className="chip">{x.name}</Link>)}</div>
        </section>
      )}
    </div>
  );
}

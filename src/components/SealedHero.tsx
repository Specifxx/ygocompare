"use client";
// The homepage's sealed shelf (lib/sealed-hero.ts): one section the size of
// the chase-cards one (owner, 2026-11-03: "the sealed product section … is
// wayyyy too big … just one area as big as the chase cards section and
// horizontal scrollable, with tabs for preorder etc."). A tab per group: the
// newest booster boxes, then each set on pre-order; one swipeable row of
// tiles under them, today's cheapest store price and the real saving in the
// visitor's market. Every tab's row is in the server HTML (the hidden ones
// carry `hidden`), so crawlers read every product; the market is switched on
// hydration like every price island. Buy buttons go through /go.
import { useState } from "react";
import Link from "@/components/Link";
import { money } from "@/lib/format";
import { MARKET_LABEL, type Market } from "@/lib/site-types";
import type { HeroItem, SealedHeroData } from "@/lib/sealed-hero";
import { useMarket } from "./ClientPrefs";

const date = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "date to be announced";

function Tile({ i, market }: { i: HeroItem; market: Market }) {
  const pr = i.prices[market] ?? null;
  return (
    <Link href={`/card/${i.slug}`} className="card-surface group flex w-[150px] shrink-0 snap-start flex-col overflow-hidden hover:border-brand/60 sm:w-[168px]">
      <span className="relative block aspect-square bg-white">
        {i.image && <img src={i.image} alt={i.name} width={200} height={200} loading="lazy" decoding="async" className="h-full w-full object-contain p-2 transition group-hover:scale-[1.03]" />}
        {pr?.saving && <span className="absolute left-1.5 top-1.5 rounded-md bg-buy px-1.5 py-0.5 text-[11px] font-black text-white shadow">−{pr.saving.pct}%</span>}
        {i.releasesOn && <span className="absolute right-1.5 top-1.5 rounded-md bg-brand px-1.5 py-0.5 text-[11px] font-black text-ink-950 shadow">Pre-order</span>}
      </span>
      <span className="flex flex-1 flex-col gap-0.5 p-2.5">
        <span className="line-clamp-2 text-sm font-semibold leading-tight">{i.name}</span>
        <span className="mt-auto pt-1 text-lg font-black tabular-nums text-brand-400">{pr ? money(pr.cents, pr.currency) : "—"}</span>
        <span className="truncate text-[11px] text-muted">{pr ? `at ${pr.store} · ${pr.stores} store${pr.stores === 1 ? "" : "s"}` : `Not listed in ${market} yet`}</span>
      </span>
    </Link>
  );
}

function Row({ items, market }: { items: HeroItem[]; market: Market }) {
  // One swipeable row at every width: the products this market's stores sell first, the rest in their order.
  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {[...items].sort((a, b) => Number(!a.prices[market]) - Number(!b.prices[market])).map((i) => <Tile key={i.id} i={i} market={market} />)}
    </div>
  );
}

export function SealedHero({ data, game, sealedHref }: { data: SealedHeroData; game: string; sealedHref: string }) {
  const { market } = useMarket();
  const [tab, setTab] = useState(0);
  const tabs = [
    { key: "boxes", label: "Booster boxes", items: data.featured, href: sealedHref, more: "All sealed prices", sub: null as string | null },
    ...data.preorders.map((s) => ({ key: s.href, label: `Pre-order · ${s.name}`, items: s.items, href: s.href, more: "Every store's pre-order price", sub: `Out ${date(s.releasesOn)}` })),
  ].filter((t) => t.items.length > 0);
  if (!tabs.length) return null;
  const cur = tabs[Math.min(tab, tabs.length - 1)];
  return (
    <section aria-labelledby="sealed-hero" className="sealed-hero flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="sealed-hero" className="font-display text-xl font-black sm:text-2xl">{game} booster boxes and sealed</h2>
          <p className="text-sm text-muted">Each box&rsquo;s cheapest store in {MARKET_LABEL[market]} today. {cur.sub ? `${cur.sub}. ` : ""}</p>
        </div>
        <Link href={cur.href} className="link text-sm font-semibold">{cur.more} →</Link>
      </div>
      {tabs.length > 1 && (
        <div role="tablist" aria-label="Sealed products" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {tabs.map((t, n) => (
            <button key={t.key} role="tab" type="button" aria-selected={n === tab} onClick={() => setTab(n)} className={`min-h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${n === tab ? "border-brand bg-brand/15 text-fg" : "border-ink-700 text-muted hover:border-brand/60 hover:text-fg"}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}
      {tabs.map((t, n) => (
        <div key={t.key} role="tabpanel" hidden={n !== tab}>
          <Row items={t.items} market={market} />
        </div>
      ))}
    </section>
  );
}

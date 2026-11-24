import type { Metadata } from "next";
import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { sealedInSet, sealedSets } from "@/lib/hubs";
import { fitTitle } from "@/lib/seo-title";
import { JsonLd } from "@/components/JsonLd";
import { abs } from "@/lib/site";
import { LINES, isMultiGame } from "@/lib/lines";
import type { GameLine } from "@/lib/site-types";
import { FoldFinder } from "@/components/FoldFinder";
import { shortDate } from "@/lib/format";

export const revalidate = 86400;
export const metadata: Metadata = {
  // "sets in order" is how people ask for this list (Rift Compare's /blog/riftbound-sets-in-order ranks for it).
  title: fitTitle([`${SITE.gameShort} Sets in Order — Booster Box & Sealed Prices`, `${SITE.gameShort} Sets in Order`]),
  description: `Every ${SITE.game} set with sealed product, in release order, newest first: each set's booster boxes, packs, tins and decks compared across stores.`,
  ...canon("/sets"),
};

/** Sets of a game shown before "Show all": the releases people are buying now (a one-game site shows more). */
const FIRST_MANY = 6;
const FIRST_ONE = 30;

// Since 2026-11-23: a set finder, a jump row of the games, and each game folded to its newest sets. It was one table per game,
// every set open (84,000 px on a phone, the last columns cut off). Every set link is still in the HTML, in release order.
export default function Sets() {
  const listed = sealedSets();
  const groups = (isMultiGame ? LINES.map((l) => ({ line: l as GameLine | null, list: listed.filter((s) => s.line === l.id) })).filter(({ list }) => list.length > 0) : [{ line: null as GameLine | null, list: listed }]);
  const FIRST = groups.length > 1 ? FIRST_MANY : FIRST_ONE;
  return (
    <div data-ff-root>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${SITE.gameShort} sets`, numberOfItems: listed.length, itemListElement: listed.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: abs(`/sets/${s.slug}`) })) }} />
      <noscript><style>{`.ff-x{display:flex!important}.ff-box,[data-ff-more]{display:none!important}`}</style></noscript>
      <h1 className="page-h1">{SITE.gameShort} sets in order</h1>
      <p className="page-sub">{listed.length.toLocaleString()} sets{groups.length > 1 ? ` across ${groups.length} games` : ""}, newest first. <Link href="/methodology" className="link">How it works</Link></p>
      <div className="mt-5 max-w-xl"><FoldFinder placeholder={`Find a set, e.g. ${listed.find((s) => !s.upcoming)?.name ?? "a set name"}`} noun="sets" /></div>
      {groups.length > 1 && (
        <nav aria-label="Jump to a game" className="mt-2">
          <ul className="scroller -mx-4 scroll-px-4 gap-2 px-4 sm:mx-0 sm:px-0">
            {groups.map(({ line, list }) => (
              <li key={line!.id}><a href={`#${line!.slug}`} className="chip min-h-10 whitespace-nowrap">{line!.short} <span className="tabular text-xs text-faint">{list.length}</span></a></li>
            ))}
          </ul>
        </nav>
      )}
      <div className="mt-8 flex flex-col gap-10">
        {groups.map(({ line, list }) => (
          <section key={line?.id ?? "all"} id={line?.slug} data-ff-group className="ff-group scroll-mt-24">
            {line && (
              <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl"><Link className="hover:underline" href={`/games/${line.slug}`}>{line.name} sets</Link></h2>
                <span className="text-sm text-muted">{list.length} set{list.length === 1 ? "" : "s"}</span>
              </div>
            )}
            <ul className="set-list">
              {list.map((s, i) => {
                const sealed = sealedInSet(s.id);
                const boxes = sealed.filter((p) => p.sealedType === "Booster Box").length;
                return (
                  <li key={s.id} data-ff={s.name.toLowerCase()} className={i >= FIRST ? "set-row ff-x" : "set-row"}>
                    <Link href={`/sets/${s.slug}`} className="set-row-link">
                      <span className="set-row-name">{s.name}</span>
                      <span className="set-row-meta">
                        {s.upcoming ? <span className="set-row-soon">Pre-order</span> : null}
                        {s.releasedOn ? shortDate(s.releasedOn) : "Date to be announced"} · {sealed.length} sealed{boxes ? ` · ${boxes} booster box${boxes === 1 ? "" : "es"}` : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {list.length > FIRST && <button type="button" data-ff-more className="btn-soft mt-4 min-h-11 px-5">Show all {list.length} {line ? `${line.short} ` : ""}sets</button>}
          </section>
        ))}
      </div>
    </div>
  );
}

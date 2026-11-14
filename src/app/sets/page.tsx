import type { Metadata } from "next";
import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { sealedInSet, sealedSets } from "@/lib/hubs";
import { fitTitle } from "@/lib/seo-title";
import { shortDate } from "@/lib/format";
import { JsonLd } from "@/components/JsonLd";
import { abs } from "@/lib/site";
import { LINES, isMultiGame } from "@/lib/lines";
import type { GameLine } from "@/lib/site-types";

export const revalidate = 86400;
export const metadata: Metadata = {
  // "sets in order" is how people ask for this list (Rift Compare's /blog/riftbound-sets-in-order ranks for it).
  title: fitTitle([`${SITE.gameShort} Sets in Order — Booster Box & Sealed Prices`, `${SITE.gameShort} Sets in Order`]),
  description: `Every ${SITE.game} set with sealed product, in release order, newest first: each set's booster boxes, packs, tins and decks compared across stores.`,
  ...canon("/sets"),
};

export default function Sets() {
  const listed = sealedSets();
  return (
    <div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${SITE.gameShort} sets`, numberOfItems: listed.length, itemListElement: listed.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: abs(`/sets/${s.slug}`) })) }} />
      <h1 className="mb-6 font-display text-3xl font-black">{SITE.gameShort} sets in order</h1>
      <p className="-mt-3 mb-6 text-sm text-muted">Newest first. Open a set for its booster boxes and sealed at every store.</p>
      {(isMultiGame ? LINES.map((l) => ({ line: l as GameLine | null, list: listed.filter((s) => s.line === l.id) })) : [{ line: null as GameLine | null, list: listed }]).map(({ line, list }) => (
      <section key={line?.id ?? "all"} className="mb-8">
      {line && <h2 className="mb-3 text-xl font-bold"><Link className="hover:underline" href={`/games/${line.slug}`}>{line.name} sets</Link></h2>}
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-ink-850 text-left text-xs uppercase text-muted">
            <tr><th className="px-3 py-2">Set</th><th className="px-3 py-2">Released</th><th className="px-3 py-2 text-right"><span className="sm:hidden">Sealed</span><span className="hidden sm:inline">Sealed products</span></th><th className="hidden px-3 py-2 text-right sm:table-cell">Booster boxes</th></tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const sealed = sealedInSet(s.id);
              const boxes = sealed.filter((p) => p.sealedType === "Booster Box").length;
              return (
                <tr key={s.id} className="border-t border-ink-800">
                  <td className="px-3 py-1"><Link className="link inline-flex min-h-10 items-center" href={`/sets/${s.slug}`}>{s.name}</Link>{s.upcoming && <span className="tag ml-2">Upcoming</span>}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted">{shortDate(s.releasedOn)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{sealed.length}</td>
                  <td className="hidden px-3 py-2 text-right tabular-nums sm:table-cell">{boxes || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </section>
      ))}
    </div>
  );
}

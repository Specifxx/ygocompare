import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { productsInSet, refCents, sets } from "@/lib/data";
import { money } from "@/lib/format";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: `${SITE.gameShort} set price guides`,
  description: `Price guides for every ${SITE.game} set: each card's value, the most valuable cards and the set's total value.`,
  ...canon("/sets"),
};

export default function Sets() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-black">{SITE.gameShort} set price guides</h1>
      <div className="overflow-hidden rounded-xl border border-ink-700/60">
        <table className="w-full text-sm">
          <thead className="bg-ink-850 text-left text-xs uppercase text-muted">
            <tr><th className="px-3 py-2">Set</th><th className="px-3 py-2">Released</th><th className="px-3 py-2 text-right">Cards</th><th className="px-3 py-2 text-right">Set value (1 of each)</th></tr>
          </thead>
          <tbody>
            {sets().filter((s) => s.productCount > 0).map((s) => {
              const cards = productsInSet(s.id).filter((p) => p.kind === "card");
              const value = cards.reduce((a, p) => a + (refCents(p.id) ?? 0), 0);
              return (
                <tr key={s.id} className="border-t border-ink-800">
                  <td className="px-3 py-2"><Link className="link" href={`/sets/${s.slug}`}>{s.name}</Link>{s.upcoming && <span className="chip ml-2">Upcoming</span>}</td>
                  <td className="px-3 py-2 text-muted">{s.releasedOn}</td>
                  <td className="px-3 py-2 text-right">{cards.length}</td>
                  <td className="px-3 py-2 text-right font-semibold">{value ? money(value) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

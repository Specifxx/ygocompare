import type { Metadata } from "next";
import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { byValue, meta, priceOf, productsInSet, refCents, sets } from "@/lib/data";
import { PREORDER_COPY } from "@/content/preorders";
import { PriceTable } from "@/components/PriceTable";
import { JsonLd } from "@/components/JsonLd";
import { money } from "@/lib/format";
import { shortName } from "@/lib/names";
import { imageAt } from "@/lib/image";

export const revalidate = 21600;

function targetSets() {
  const now = Date.now();
  return sets()
    .filter((s) => s.upcoming || (s.releasedOn && now - new Date(s.releasedOn).getTime() < 21 * 86_400_000))
    .filter((s) => productsInSet(s.id).some((p) => p.kind === "sealed"))
    .sort((a, b) => (a.releasedOn ?? "").localeCompare(b.releasedOn ?? ""));
}

export function generateMetadata(): Metadata {
  const t = targetSets()[0];
  const name = t?.name ?? `${SITE.gameShort} new set`;
  return {
    title: `${name} pre-orders — cheapest booster box prices compared`,
    description: `Where to pre-order ${name}: every store's booster box, pack and sealed price compared, cheapest first, with release date and what's in the box. Updated daily.`,
    ...canon("/preorders"),
  };
}

export default function Preorders() {
  const fx = meta()?.fx ?? { USD: 1 };
  const targets = targetSets();
  return (
    <div className="flex flex-col gap-10">
      {PREORDER_COPY.faq.length > 0 && <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: PREORDER_COPY.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />}
      <header>
        <p className="text-xs uppercase tracking-wide text-brand-400">Pre-order tracker · updated daily</p>
        <h1 className="font-display text-3xl font-black md:text-4xl">{targets[0] ? `${targets[0].name} pre-orders` : `${SITE.gameShort} pre-orders`}</h1>
        {PREORDER_COPY.intro && <p className="mt-3 max-w-3xl text-muted" dangerouslySetInnerHTML={{ __html: PREORDER_COPY.intro }} />}
        {PREORDER_COPY.facts.length > 0 && (
          <dl className="mt-5 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
            {PREORDER_COPY.facts.map((f) => (
              <div key={f.label} className="card-surface p-3"><dt className="text-xs text-muted">{f.label}</dt><dd className="font-semibold">{f.value}</dd></div>
            ))}
          </dl>
        )}
      </header>
      {targets.map((s) => {
        const sealed = byValue(productsInSet(s.id).filter((p) => p.kind === "sealed"));
        const chase = byValue(productsInSet(s.id).filter((p) => p.kind === "card")).slice(0, 8);
        return (
          <section key={s.id} className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold">{s.name} <span className="text-base font-normal text-muted">· {s.upcoming ? "releases" : "released"} {s.releasedOn}</span></h2>
            {sealed.map((p) => {
              const e = priceOf(p.id);
              return (
                <div key={p.id} className="card-surface grid gap-4 p-4 md:grid-cols-[120px_1fr]">
                  {p.image ? <img src={imageAt(p.image, "200w")!} alt={shortName(p.name)} className="mx-auto h-32 object-contain" loading="lazy" /> : <div />}
                  <div className="min-w-0">
                    <h3 className="font-semibold"><Link className="hover:underline" href={`/card/${p.slug}`}>{shortName(p.name)}</Link> <span className="text-sm font-normal text-muted">TCGplayer {money(refCents(p.id))}</span></h3>
                    <div className="mt-2"><PriceTable offers={e.offers} fx={fx} productId={p.id} page="preorders" compact /></div>
                  </div>
                </div>
              );
            })}
            {chase.length > 0 && chase.some((p) => refCents(p.id)) && (
              <div>
                <h3 className="mb-2 text-lg font-bold">{s.name} chase cards (pre-release prices)</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {chase.map((p) => (
                    <li key={p.id} className="flex justify-between border-b border-ink-800 py-1 text-sm"><Link className="hover:underline" href={`/card/${p.slug}`}>{shortName(p.name)}</Link><span>{money(refCents(p.id))}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}
      {!targets.length && <p className="text-muted">No set is in pre-order right now. <Link className="link" href="/sealed">Compare sealed prices →</Link></p>}
      {PREORDER_COPY.faq.length > 0 && (
        <section className="max-w-3xl">
          <h2 className="mb-3 text-xl font-bold">Pre-order FAQ</h2>
          {PREORDER_COPY.faq.map((f) => (
            <div key={f.q} className="border-b border-ink-800 py-3"><h3 className="font-medium">{f.q}</h3><p className="mt-1 text-sm text-muted">{f.a}</p></div>
          ))}
        </section>
      )}
    </div>
  );
}

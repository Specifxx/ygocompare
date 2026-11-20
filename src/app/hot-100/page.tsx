import type { Metadata } from "next";
import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { hotInputs, setById, summaryOf } from "@/lib/data";
import { imageAt } from "@/lib/image";
import { money, pct } from "@/lib/format";
import { shortName } from "@/lib/names";
import { dayLabel, hotChart, hotDrops, hotName, latestDay, moveLabel } from "@/lib/hot100";
import { ShareButton } from "@/components/ShareButton";
import { SealedQuickBuy } from "@/components/SealedQuickBuy";
import { HotBuy } from "@/components/HotBuy";
import type { Product } from "@/lib/site-types";

// The weekly Hot 100 (owner, 2026-11-18): RiftCompare's chart idea for this site, one stable URL that is
// posted to Reddit once a week as a plain link and title. Every number comes from the committed daily price
// history (lib/hot100.ts); nothing is fetched. Data changes only with a release, so a day's cache is exact.
export const revalidate = 86400;

function chart() {
  const inputs = hotInputs();
  const day = latestDay(inputs);
  return day == null ? null : hotChart(inputs, day);
}

/** The week's biggest falls (owner, 2026-11-20): the same seven days and floor as the chart, the other way. */
function drops() {
  const inputs = hotInputs();
  const day = latestDay(inputs);
  return day == null ? [] : hotDrops(inputs, day);
}

/** A row's buy data: the summary's cheapest in-stock offer per market (no shard read, no fetch). */
function buyItem(p: Product) {
  return {
    slug: p.slug,
    name: shortName(p.name),
    sub: [setById(p.setId)?.name, p.number].filter(Boolean).join(" · ") || undefined,
    img: p.image ? imageAt(p.image, "400w") : null,
    best: summaryOf(p.id).best,
  };
}

export function generateMetadata(): Metadata {
  const c = chart();
  const n = c?.rows.length ?? 0;
  const name = `${SITE.gameShort} ${n ? hotName(n) : "Hot 100"}`;
  const top = c?.rows[0];
  return {
    title: c && top ? `${name}: ${shortName(top.item.name)} leads, up ${top.change.toFixed(1)}% (week to ${dayLabel(c.day)})` : `${SITE.gameShort} Hot 100: this week's biggest price risers`,
    description: `The ${SITE.game} products whose TCGplayer market price rose most in the last seven days, ranked, with each one's place on last week's chart, and the biggest drops. From ${SITE.name}'s daily price history.`,
    // No `images` key: the sibling opengraph-image.tsx is the preview.
    alternates: { canonical: "/hot-100" },
    openGraph: { type: "website", siteName: SITE.name, url: "/hot-100" },
    twitter: { card: "summary_large_image" },
  };
}

export default function Hot100() {
  const c = chart();
  const rows = c?.rows ?? [];
  const n = rows.length;
  const name = `${SITE.gameShort} ${n ? hotName(n) : "Hot 100"}`;
  const top = rows[0];
  const falls = drops();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="page-h1">{name}</h1>
        <p className="page-sub">
          {c ? `Week to ${dayLabel(c.day)}. ` : ""}
          The {SITE.game} products whose TCGplayer market price rose most in the last seven days, biggest rise first. Products worth $3 or more; a chart is only as long as the week&apos;s real risers.
        </p>
        <ShareButton path="/hot-100" name={name} medium="movers" text={top ? `${name}: ${shortName(top.item.name)} is #1, up ${top.change.toFixed(1)}% this week` : `This week's ${SITE.gameShort} ${hotName(100)}`} className="mt-2" />
      </header>
      {n > 0 && (
        // "Shop the top risers" (boardroom, 2026-11-20): the week's top three with the cheapest price in the visitor's
        // market and a buy button each, in the first screen, before the chart.
        <SealedQuickBuy
          title="Shop the top risers"
          from="hot_quickbuy"
          items={rows.slice(0, 3).map((r) => ({
            id: r.item.id,
            slug: r.item.slug,
            name: shortName(r.item.name),
            image: r.item.image ? imageAt(r.item.image, "200w") : null,
            best: summaryOf(r.item.id).best,
            stores: summaryOf(r.item.id).listedSources,
          }))}
        />
      )}
      {!n ? (
        <p className="card p-5 text-sm text-muted">Not enough price history yet: the chart appears after a week of daily prices.</p>
      ) : (
        <section className="card p-2 sm:p-4">
          <p className="hidden justify-end gap-3 pb-1 text-[11px] uppercase tracking-wide text-muted sm:flex" aria-hidden="true">
            <span className="hidden md:inline">TCGplayer</span>
            <span className="w-16 text-right">7 days</span>
            <span className="w-16 text-right">In stock</span>
            <span className="w-[52px]" />
          </p>
          <ol>
            {rows.map((r) => {
              const move = moveLabel(r, c!.lastWeekSize);
              return (
                <li key={r.item.id} className="flex items-center gap-2 border-t border-line text-sm first:border-t-0 sm:gap-3">
                  <span className="w-8 shrink-0 text-right font-display text-base font-bold tabular-nums">{r.rank}</span>
                  <span className={`hidden w-12 shrink-0 text-center sm:block text-xs font-semibold tabular-nums ${move === "NEW" ? "text-up" : move?.startsWith("▲") ? "text-up" : move?.startsWith("▼") ? "text-down" : "text-muted"}`} title={r.lastRank ? `#${r.lastRank} last week` : undefined}>
                    {move ?? ""}
                  </span>
                  <Link className="min-w-0 flex-1 my-2 leading-snug line-clamp-2 sm:line-clamp-1 hover:underline" href={`/card/${r.item.slug}`}>{shortName(r.item.name)}</Link>
                  <span className="hidden tabular-nums text-muted md:inline" title="TCGplayer market price">{money(r.cents)}</span>
                  <span className="w-14 shrink-0 text-right font-semibold tabular-nums text-up sm:w-16">{pct(r.change)}</span>
                  <HotBuy item={buyItem(r.item)} />
                </li>
              );
            })}
          </ol>
        </section>
      )}
      {falls.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="drops">
          <h2 id="drops" className="text-lg font-bold">Biggest drops this week</h2>
          <p className="text-sm text-muted">The same seven days the other way: products worth $3 or more whose TCGplayer market price fell most, biggest fall first.</p>
          <div className="card p-2 sm:p-4">
            <ol>
              {falls.map((r) => (
                <li key={r.item.id} className="flex items-center gap-2 border-t border-ink-800 text-sm first:border-t-0 sm:gap-3">
                  <span className="w-8 shrink-0 text-right font-display text-base font-bold tabular-nums">{r.rank}</span>
                  <Link className="min-w-0 flex-1 truncate py-2.5 hover:underline" href={`/card/${r.item.slug}`}>{shortName(r.item.name)}</Link>
                  <span className="tabular-nums">{money(r.cents)}</span>
                  <span className="w-16 shrink-0 text-right font-semibold tabular-nums text-down">{pct(r.change)}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
      <p className="text-sm text-muted">
        How it works: each product&apos;s TCGplayer market price today against the same price seven days ago, from the price history we record every day. ▲ and ▼ compare with last week&apos;s chart, worked out the same way; NEW was not on it.{" "}
        <Link className="link" href="/movers">Every riser and faller →</Link>
      </p>
    </div>
  );
}

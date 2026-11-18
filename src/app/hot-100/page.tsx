import type { Metadata } from "next";
import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { hotInputs } from "@/lib/data";
import { money, pct } from "@/lib/format";
import { shortName } from "@/lib/names";
import { dayLabel, hotChart, hotName, latestDay, moveLabel } from "@/lib/hot100";
import { ShareButton } from "@/components/ShareButton";

// The weekly Hot 100 (owner, 2026-11-18): RiftCompare's chart idea for this site, one stable URL that is
// posted to Reddit once a week as a plain link and title. Every number comes from the committed daily price
// history (lib/hot100.ts); nothing is fetched. Data changes only with a release, so a day's cache is exact.
export const revalidate = 86400;

function chart() {
  const inputs = hotInputs();
  const day = latestDay(inputs);
  return day == null ? null : hotChart(inputs, day);
}

export function generateMetadata(): Metadata {
  const c = chart();
  const n = c?.rows.length ?? 0;
  const name = `${SITE.gameShort} ${n ? hotName(n) : "Hot 100"}`;
  const top = c?.rows[0];
  return {
    title: c && top ? `${name}: ${shortName(top.item.name)} leads, up ${top.change.toFixed(1)}% (week to ${dayLabel(c.day)})` : `${SITE.gameShort} Hot 100: this week's biggest price risers`,
    description: `The ${SITE.game} products whose TCGplayer market price rose most in the last seven days, ranked, with each one's place on last week's chart. From ${SITE.name}'s daily price history.`,
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
      {!n ? (
        <p className="card p-5 text-sm text-muted">Not enough price history yet: the chart appears after a week of daily prices.</p>
      ) : (
        <section className="card p-2 sm:p-4">
          <ol>
            {rows.map((r) => {
              const move = moveLabel(r, c!.lastWeekSize);
              return (
                <li key={r.item.id} className="flex items-center gap-2 border-t border-line text-sm first:border-t-0 sm:gap-3">
                  <span className="w-8 shrink-0 text-right font-display text-base font-bold tabular-nums">{r.rank}</span>
                  <span className={`w-12 shrink-0 text-center text-xs font-semibold tabular-nums ${move === "NEW" ? "text-up" : move?.startsWith("▲") ? "text-up" : move?.startsWith("▼") ? "text-down" : "text-muted"}`} title={r.lastRank ? `#${r.lastRank} last week` : undefined}>
                    {move ?? ""}
                  </span>
                  <Link className="min-w-0 flex-1 truncate py-2.5 hover:underline" href={`/card/${r.item.slug}`}>{shortName(r.item.name)}</Link>
                  <span className="tabular-nums">{money(r.cents)}</span>
                  <span className="w-16 shrink-0 text-right font-semibold tabular-nums text-up">{pct(r.change)}</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
      <p className="text-sm text-muted">
        How it works: each product&apos;s TCGplayer market price today against the same price seven days ago, from the price history we record every day. ▲ and ▼ compare with last week&apos;s chart, worked out the same way; NEW was not on it.{" "}
        <Link className="link" href="/movers">Every riser and faller →</Link>
      </p>
    </div>
  );
}

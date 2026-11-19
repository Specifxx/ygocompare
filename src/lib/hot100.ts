// The weekly Hot 100 (owner, 2026-11-18: "Rift Compare has the Hot 100 … we should have it for all the other sites",
// one link and one title a week on Reddit). A chart, Billboard style, built ONLY from this site's own committed
// price history: every product whose TCGplayer market price rose over the last seven days, biggest rise first,
// up to 100. Each row also says where it stood on last week's chart, computed the same way seven days earlier
// from the same history, so "NEW", "up 4" and "down 2" are measured facts, never estimates.
//
// Honest count (RiftCompare's Hot 40 rule, DECISIONS.md 2026-09-22): a week with 37 risers is the Hot 37, never
// a Hot 100 padded with flat or falling products. Pure: no file reads, so the page, the share image and the tests
// all call the same function.
import type { Series } from "./series";

export const HOT_MAX = 100;
/** The same floor as /movers: a $1 pack moving 5 cents is noise, not a chart. */
export const HOT_MIN_CENTS = 300;

export interface HotInput<T> {
  item: T;
  /** The product's daily reference-price series: [day number, US cents], one point per change. */
  series: Series | undefined;
}

export interface HotRow<T> {
  item: T;
  rank: number;
  /** Price on the chart day, US cents. */
  cents: number;
  /** Seven-day change in percent, one decimal (the same rounding as the import's change7d). */
  change: number;
  /** Rank on the chart seven days earlier, or null when it was not on it. */
  lastRank: number | null;
}

export interface HotChart<T> {
  rows: HotRow<T>[];
  /** The chart's day (days since 1970-01-01). */
  day: number;
  /** How many products were ranked last week (0 when there is not a fortnight of history yet). */
  lastWeekSize: number;
}

/** The value in effect on a day: the last point at or before it. */
export function valueOn(series: Series | undefined, day: number): number | null {
  if (!series?.length) return null;
  let v: number | null = null;
  for (const [d, c] of series) {
    if (d > day) break;
    v = c;
  }
  return v;
}

function weekChange(series: Series | undefined, day: number): { cents: number; change: number } | null {
  const now = valueOn(series, day);
  const then = valueOn(series, day - 7);
  if (now == null || then == null || then <= 0) return null;
  return { cents: now, change: Math.round(((now - then) / then) * 1000) / 10 };
}

function rank<T>(inputs: HotInput<T>[], day: number, max: number, minCents: number, dir: 1 | -1 = 1) {
  const rows: { input: HotInput<T>; cents: number; change: number }[] = [];
  for (const input of inputs) {
    const w = weekChange(input.series, day);
    if (!w || dir * w.change <= 0 || w.cents < minCents) continue;
    rows.push({ input, ...w });
  }
  // Biggest move first; a tie goes to the dearer product (more money moved), then a stable order.
  rows.sort((a, b) => dir * (b.change - a.change) || b.cents - a.cents);
  return rows.slice(0, max);
}

// THE BIGGEST DROPS (owner, 2026-11-20, from a Reddit reply to a Hot 100 post: "show me the biggest drops. I just want to rip
// and play"). The same seven days and the same $3 floor, the other way: every product whose market price fell, biggest fall
// first. The share image draws half rises, half drops; the page lists them under the chart. `change` is negative.
export const DROPS_MAX = 20;

export function hotDrops<T>(inputs: HotInput<T>[], day: number, opts: { max?: number; minCents?: number } = {}): Omit<HotRow<T>, "lastRank">[] {
  return rank(inputs, day, opts.max ?? DROPS_MAX, opts.minCents ?? HOT_MIN_CENTS, -1).map((r, i) => ({ item: r.input.item, rank: i + 1, cents: r.cents, change: r.change }));
}

export function hotChart<T>(inputs: HotInput<T>[], day: number, opts: { max?: number; minCents?: number } = {}): HotChart<T> {
  const max = opts.max ?? HOT_MAX;
  const minCents = opts.minCents ?? HOT_MIN_CENTS;
  const now = rank(inputs, day, max, minCents);
  const last = rank(inputs, day - 7, max, minCents);
  const lastRank = new Map<HotInput<T>, number>();
  last.forEach((r, i) => lastRank.set(r.input, i + 1));
  return {
    day,
    lastWeekSize: last.length,
    rows: now.map((r, i) => ({ item: r.input.item, rank: i + 1, cents: r.cents, change: r.change, lastRank: lastRank.get(r.input) ?? null })),
  };
}

/** The newest day any series has a point on: the day of the last import. */
export function latestDay(inputs: HotInput<unknown>[]): number | null {
  let max: number | null = null;
  for (const { series } of inputs) {
    const last = series?.[series.length - 1];
    if (last && (max == null || last[0] > max)) max = last[0];
  }
  return max;
}

/** "Hot 100", or "Hot 37" on a thin week. */
export function hotName(n: number): string {
  return `Hot ${n}`;
}

/** A row's movement word: "NEW", "▲ 4", "▼ 2" or "=". Only "NEW" when last week's chart existed. */
export function moveLabel(row: { rank: number; lastRank: number | null }, lastWeekSize: number): string | null {
  if (row.lastRank == null) return lastWeekSize > 0 ? "NEW" : null;
  const d = row.lastRank - row.rank;
  return d > 0 ? `▲ ${d}` : d < 0 ? `▼ ${-d}` : "=";
}

/** "17 November 2026" for a day number. */
export function dayLabel(day: number): string {
  return new Date(day * 86_400_000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

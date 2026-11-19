// Pure helpers for the two-line price history chart (components/PriceHistory.tsx), ported from OP Compare's chart
// (owner, 2026-11-19: "I really really like opcompare's price history where you have the tcgplayer market price as well as
// the cheapest price locally"). No React and no fs, so the client chart and tests/history-chart.test.ts share them.
//
// Inputs are change-only step series ([day, cents], day = days since 1970-01-01): TCGplayer's market price in US cents
// (data/history) and the cheapest in-stock store price per market in that market's own cents (data/store-lows, 0 = no
// store had it in stock). The chart draws one value a day from the first point to `through`; a store-low of 0 is a gap,
// never a price, and the TCGplayer line is converted to the visitor's currency at the day's rate and labelled so.
import type { Series } from "./series";

/** The value in effect on each day `from..to` (inclusive), null before the series starts. `zeroIsGap`: 0 means "none". */
export function dailyValues(series: Series | undefined, from: number, to: number, zeroIsGap = false): (number | null)[] {
  const out: (number | null)[] = [];
  if (to < from) return out;
  let i = 0;
  let cur: number | null = null;
  const s = series ?? [];
  for (let d = from; d <= to; d++) {
    while (i < s.length && s[i][0] <= d) cur = s[i++][1];
    out.push(cur == null || (zeroIsGap && cur <= 0) ? null : cur);
  }
  return out;
}

export interface ChartRange {
  key: string;
  label: string;
  /** Index into the day axis where this range starts. */
  start: number;
  lo: number;
  hi: number;
}

const RANGE_DAYS = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
];

/** y-axis bounds with 8% headroom, never below zero; a flat line gets ±10%. */
export function yBounds(values: number[]): { lo: number; hi: number } | null {
  if (!values.length) return null;
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (lo === hi) {
    lo = lo * 0.9;
    hi = hi * 1.1 || 1;
  }
  const span = hi - lo;
  return { lo: Math.max(0, lo - span * 0.08), hi: hi + span * 0.08 };
}

/** The range tabs worth offering (each only when the history is longer than it and still has two days); "All" last. */
export function chartRanges(days: number[], ys: (number | null)[][]): ChartRange[] {
  const out: ChartRange[] = [];
  if (days.length < 2) return out;
  const last = days[days.length - 1];
  const span = last - days[0];
  const boundsFrom = (start: number) => yBounds(ys.flatMap((s) => s.slice(start)).filter((v): v is number => v != null));
  for (const r of RANGE_DAYS) {
    if (span <= r.days) continue;
    const start = days.findIndex((d) => d >= last - r.days);
    if (start < 0 || days.length - start < 2) continue;
    const b = boundsFrom(start);
    if (b) out.push({ key: r.key, label: r.label, start, ...b });
  }
  const all = boundsFrom(0);
  if (all) out.push({ key: "all", label: "All", start: 0, ...all });
  return out;
}

/** Five evenly spaced tick values from lo to hi. */
export function ticks(lo: number, hi: number, n = 5): number[] {
  return Array.from({ length: n }, (_, i) => lo + ((hi - lo) * i) / (n - 1));
}

/** The point index under a pointer at `ratio` (0–1 across the plot) of `n` points. */
export function nearestIndex(ratio: number, n: number): number {
  if (n <= 1) return 0;
  return Math.round(Math.min(1, Math.max(0, ratio)) * (n - 1));
}

/** First and last non-null values of a series, and the % change between them. */
export function seriesChange(ys: (number | null)[]): { first: number; last: number; pct: number | null } | null {
  const vals = ys.filter((v): v is number => v != null);
  if (vals.length < 2) return null;
  const first = vals[0];
  const last = vals[vals.length - 1];
  return { first, last, pct: first > 0 ? ((last - first) / first) * 100 : null };
}

/** An SVG path "d" for a series, breaking the line at nulls. */
export function linePath(ys: (number | null)[], X: (i: number) => number, Y: (v: number) => number): string {
  let d = "";
  let pen = false;
  ys.forEach((v, i) => {
    if (v == null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`;
    pen = true;
  });
  return d;
}

export interface HistoryLines {
  /** Day numbers of the axis, oldest first. */
  days: number[];
  /** The cheapest in-stock store price in the market's own cents, null on a day nothing was in stock. */
  local: (number | null)[];
  /** TCGplayer's market price converted to the market's currency (cents), null before it has one. */
  market: (number | null)[];
}

/**
 * The two lines for one market, from `through - days` (or the first point, if later) to `through`. `fxRate` is how many
 * of the market's currency one US dollar buys (1 in the US). Null when neither line has two days to draw.
 */
export function historyLines(tcgUsd: Series | undefined, lows: Series | undefined, fxRate: number | null, through: number, days = 365): HistoryLines | null {
  const firsts = [tcgUsd?.[0]?.[0], lows?.[0]?.[0]].filter((d): d is number => d != null);
  if (!firsts.length) return null;
  const from = Math.max(through - days, Math.min(...firsts));
  if (through - from < 1) return null;
  const axis = Array.from({ length: through - from + 1 }, (_, i) => from + i);
  const local = dailyValues(lows, from, through, true);
  const market = fxRate && fxRate > 0 ? dailyValues(tcgUsd, from, through).map((v) => (v == null ? null : Math.round(v * fxRate))) : axis.map(() => null);
  const count = (ys: (number | null)[]) => ys.filter((v) => v != null).length;
  if (count(local) < 2 && count(market) < 2) return null;
  return { days: axis, local, market };
}

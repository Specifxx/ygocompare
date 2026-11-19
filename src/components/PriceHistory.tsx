"use client";
// The price history chart, OP Compare's two-line look (owner, 2026-11-19: "copy it across all our tcg websites"): the
// cheapest in-stock store price in the visitor's market (solid red) against TCGplayer's market price converted to that
// market's currency (dashed gold), with Now / Low / High and the change, 7D / 30D / 90D / All tabs where the history is
// longer than them, and a hover, touch or arrow-key crosshair whose tooltip reads both lines for the day. Either line
// draws alone where the other has no data yet (store lows are recorded from 2026-11-16). Pure maths in lib/history-chart.ts.
// The first paint is server SVG at a fixed height, so nothing shifts; it switches to the visitor's market after mount.
import { useEffect, useMemo, useRef, useState } from "react";
import { useMarket } from "./ClientPrefs";
import { CURRENCY, type Market } from "@/lib/site-types";
import { money } from "@/lib/format";
import type { Series } from "@/lib/series";
import { chartRanges, historyLines, linePath, nearestIndex, seriesChange, ticks } from "@/lib/history-chart";

const LOCAL = "#ff6b6b";
const MARKET = "#e9b73a";
const ADJ: Record<Market, string> = { US: "US", UK: "UK", CA: "Canadian", AU: "Australian", EU: "European", SG: "Singapore" };
const PAD = { r: 12, t: 12, b: 24 };
const FALLBACK_W = 640;
const TIP_W = 220;
const dayIso = (d: number) => new Date(d * 86_400_000).toISOString().slice(0, 10);
const shortDay = (d: number) => new Date(d * 86_400_000).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const longDay = (d: number) => new Date(d * 86_400_000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function tipStyle(hx: number, w: number): React.CSSProperties {
  if (hx + 10 + TIP_W <= w) return { left: hx + 10 };
  if (hx - 10 - TIP_W >= 0) return { right: w - hx + 10 };
  return { left: Math.max(4, Math.min(w - TIP_W - 4, hx - TIP_W / 2)) };
}

export function PriceHistory({
  tcg,
  lows,
  fx,
  through,
  days = 365,
  compact = false,
}: {
  /** TCGplayer's market price, US cents (data/history). */
  tcg?: Series;
  /** The cheapest in-stock store price per market, in its own cents (data/store-lows). */
  lows?: Partial<Record<string, Series>>;
  /** 1 USD = x of each currency (meta.fx). */
  fx?: Record<string, number>;
  /** The last day the data covers (days since 1970): the day of the import, so the server and browser draw the same axis. */
  through: number;
  days?: number;
  compact?: boolean;
}) {
  const { market } = useMarket();
  const cur = CURRENCY[market];
  const lines = useMemo(() => historyLines(tcg, lows?.[market], market === "US" ? 1 : (fx?.[cur] ?? null), through, days), [tcg, lows, market, cur, fx, through, days]);
  const series = useMemo(
    () =>
      lines
        ? [
            { label: `Cheapest ${ADJ[market]} listing`, color: LOCAL, dashed: false, ys: lines.local },
            { label: market === "US" ? "TCGplayer market" : "TCGplayer market (converted)", color: MARKET, dashed: true, ys: lines.market },
          ].filter((s) => s.ys.some((v) => v != null))
        : [],
    [lines, market],
  );
  const ranges = useMemo(() => (lines ? chartRanges(lines.days, series.map((s) => s.ys)) : []), [lines, series]);
  const [rangeKey, setRangeKey] = useState("all");
  const [hover, setHover] = useState<number | null>(null);
  const [measured, setMeasured] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const drawn = lines != null;

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w > 0) setMeasured(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [drawn]);

  if (!lines || !ranges.length) {
    return <p className="text-sm text-muted">Price history starts building from the first daily import — check back in a few days.</p>;
  }
  const range = ranges.find((r) => r.key === rangeKey) ?? ranges[ranges.length - 1];
  const xs = lines.days.slice(range.start);
  const view = series.map((s) => ({ ...s, ys: s.ys.slice(range.start) }));
  const n = xs.length;
  const H = compact ? 180 : 240;
  const fmt = (v: number) => money(Math.round(v), cur);
  const tickVals = ticks(range.lo, range.hi);
  const W = measured ?? FALLBACK_W;
  const padL = Math.max(44, Math.ceil(Math.max(...tickVals.map((t) => fmt(t).length)) * 6.6) + 10);
  const plotW = Math.max(1, W - padL - PAD.r);
  const X = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const Y = (v: number) => PAD.t + (1 - (v - range.lo) / (range.hi - range.lo || 1)) * (H - PAD.t - PAD.b);
  const xLabels = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : [0, n - 1];

  // The headline line (the first with data in this range): now, low, high and change.
  const head = view.find((s) => s.ys.some((v) => v != null));
  let lo = -1;
  let hi = -1;
  let last = -1;
  head?.ys.forEach((v, i) => {
    if (v == null) return;
    if (lo < 0 || v < head.ys[lo]!) lo = i;
    if (hi < 0 || v > head.ys[hi]!) hi = i;
    last = i;
  });
  const change = head ? seriesChange(head.ys) : null;
  const pct = change?.pct;
  // "Now" only when the headline line has today's value; else the last recorded one, with its day.
  const isNow = last === n - 1;

  const moveTo = (clientX: number) => {
    const el = wrap.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    setHover(nearestIndex((((clientX - rect.left) / rect.width) * W - padL) / plotW, n));
  };
  const hx = hover != null ? X(hover) : 0;

  return (
    <figure className="m-0" data-price-history="">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{compact ? `Price history (${cur} · lowest price)` : `In ${cur} · lowest price`}</p>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        {head && last >= 0 ? (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm tabular-nums">
            {isNow ? (
              <span>
                Now <b className="font-bold">{fmt(head.ys[last]!)}</b>
              </span>
            ) : (
              <span className="text-muted">
                Last recorded <b className="font-semibold">{fmt(head.ys[last]!)}</b> · {shortDay(xs[last])}
              </span>
            )}
            <span className="text-muted">Low {fmt(head.ys[lo]!)}</span>
            <span className="text-muted">High {fmt(head.ys[hi]!)}</span>
            {pct != null && Math.abs(pct) >= 0.05 && (
              <span className={`font-semibold ${pct > 0 ? "text-up" : "text-down"}`}>
                {pct > 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
              </span>
            )}
          </p>
        ) : (
          <span />
        )}
        {ranges.length > 1 && (
          <span className="flex gap-1" role="group" aria-label="Chart range">
            {ranges.map((r) => (
              <button
                key={r.key}
                type="button"
                aria-pressed={r.key === range.key}
                onClick={() => {
                  setRangeKey(r.key);
                  setHover(null);
                }}
                className={`inline-flex min-h-8 items-center rounded-md px-2.5 text-xs font-semibold ${r.key === range.key ? "bg-brand/15 text-brand" : "text-muted hover:opacity-80"}`}
              >
                {r.label}
              </button>
            ))}
          </span>
        )}
      </div>
      <div
        ref={wrap}
        className="relative select-none rounded-md outline-none"
        style={{ height: H, touchAction: "pan-y" }}
        tabIndex={0}
        aria-label={`${view.map((s) => s.label).join(" and ")}, ${dayIso(xs[0])} to ${dayIso(xs[n - 1])}. Use the left and right arrow keys to read each day.`}
        onPointerMove={(e) => moveTo(e.clientX)}
        onPointerDown={(e) => moveTo(e.clientX)}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setHover(null);
        }}
        onBlur={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            setHover((h) => Math.min(n - 1, Math.max(0, (h ?? (e.key === "ArrowLeft" ? n : -1)) + (e.key === "ArrowRight" ? 1 : -1))));
          } else if (e.key === "Escape") setHover(null);
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" style={{ height: H }} preserveAspectRatio={measured == null ? "none" : undefined} aria-hidden="true">
          {tickVals.map((t) => (
            <g key={t}>
              <line x1={padL} x2={W - PAD.r} y1={Y(t)} y2={Y(t)} stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
              <text x={padL - 6} y={Y(t) + 4} textAnchor="end" fill="currentColor" fillOpacity="0.55" fontSize="11" className="tabular-nums">
                {fmt(t)}
              </text>
            </g>
          ))}
          {xLabels.map((i) => (
            <text key={i} x={X(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fill="currentColor" fillOpacity="0.55" fontSize="11">
              {shortDay(xs[i])}
            </text>
          ))}
          {view.map((s) => (
            <path key={s.label} d={linePath(s.ys, X, Y)} fill="none" stroke={s.color} strokeWidth="2.2" strokeDasharray={s.dashed ? "5 4" : undefined} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {measured != null &&
            n <= 45 &&
            view.map((s) => s.ys.map((v, i) => (v == null ? null : <circle key={`${s.label}-${i}`} cx={X(i)} cy={Y(v)} r="2.5" fill={s.color} />)))}
          {hover != null && (
            <g>
              <line x1={hx} x2={hx} y1={PAD.t} y2={H - PAD.b} stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="3 3" />
              {view.map((s) => {
                const v = s.ys[hover];
                return v == null ? null : <circle key={s.label} cx={hx} cy={Y(v)} r="4.5" fill={s.color} className="stroke-ink-900" strokeWidth="1.5" />;
              })}
            </g>
          )}
        </svg>
        {hover != null && (
          <div className="pointer-events-none absolute top-1 z-10 max-w-[calc(100%-8px)] rounded-lg border border-ink-700 bg-ink-950 px-2.5 py-1.5 shadow-xl" style={tipStyle(hx, W)} role="status">
            <p className="whitespace-nowrap text-[11px] font-semibold text-muted">{longDay(xs[hover])}</p>
            {view.map((s) => (
              <p key={s.label} className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="text-muted">{s.label}</span>
                <span className="ml-auto pl-2 font-bold tabular-nums">{s.ys[hover] == null ? "—" : fmt(s.ys[hover]!)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        {view.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="inline-block w-4" style={{ borderTop: `2px ${s.dashed ? "dashed" : "solid"} ${s.color}` }} />
            {s.label}
          </span>
        ))}
        {market !== "US" && view.some((s) => s.dashed) && <span>TCGplayer&apos;s US price at the day&apos;s exchange rate</span>}
      </figcaption>
    </figure>
  );
}

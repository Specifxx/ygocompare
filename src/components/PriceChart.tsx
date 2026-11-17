"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { dayToDate, type Series } from "@/lib/series";
import { money } from "@/lib/format";

// A product's price over time (the daily reference price series, lib/series.ts): a step line with a dot on every day the price changed,
// 30D / 90D / All pills when they differ, and a hover or touch crosshair with the exact price and day (owner, 2026-11-17: "data points,
// hover to see the exact price", in the quick view too). The first paint is server-rendered SVG at a fixed height, so nothing shifts and
// the figures are in the HTML; the pointer layer only adds the tooltip. No chart library.
const PAD = { l: 8, r: 8, t: 14, b: 14 };
const FALLBACK_W = 640;
const RANGES = [
  { key: "30D", days: 30 },
  { key: "90D", days: 90 },
  { key: "All", days: Infinity },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

const fmtDay = (d: number) => new Date(d * 86_400_000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function PriceChart({ series, days, compact = false }: { series: Series; days: number; compact?: boolean }) {
  const [range, setRange] = useState<RangeKey>("All");
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [measuredW, setMeasuredW] = useState<number | null>(null);
  const W = measuredW ?? FALLBACK_W;
  const H = compact ? 104 : 168;
  const ok = series.length >= 2;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w > 0) setMeasuredW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ok]);

  // One value per day from the window's start to today (a step series carries the value in effect).
  const all = useMemo(() => {
    if (series.length < 2) return [] as [number, number][];
    const lastDay = series[series.length - 1][0];
    const today = Math.max(lastDay, Math.floor(Date.now() / 86_400_000));
    const from = today - days;
    let start = series[0];
    for (const p of series) if (p[0] <= from) start = p;
    const out: [number, number][] = [];
    let i = 0;
    let cur = start[1];
    for (let d = Math.max(from, start[0]); d <= today; d++) {
      while (i < series.length && series[i][0] <= d) cur = series[i++][1];
      out.push([d, cur]);
    }
    return out;
  }, [series, days]);

  const span0 = all.length;
  const ranges = RANGES.filter((r) => (r.days === Infinity ? span0 > 30 : span0 > r.days));
  const data = useMemo(() => {
    const r = RANGES.find((x) => x.key === range)!.days;
    return r === Infinity ? all : all.slice(-r);
  }, [all, range]);

  if (!ok || data.length < 2) {
    return <p className="text-sm text-muted">Price history starts building from the first daily import — check back in a few days.</p>;
  }
  const vs = data.map((p) => p[1]);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const span = Math.max(1, hi - lo);
  const first = data[0][0];
  const last = data[data.length - 1][0];
  const x = (d: number) => PAD.l + ((d - first) / Math.max(1, last - first)) * (W - PAD.l - PAD.r);
  const y = (c: number) => PAD.t + (1 - (c - lo) / span) * (H - PAD.t - PAD.b);
  let d = `M${x(first).toFixed(1)},${y(data[0][1]).toFixed(1)}`;
  for (let i = 1; i < data.length; i++) d += ` H${x(data[i][0]).toFixed(1)} V${y(data[i][1]).toFixed(1)}`;
  const changes = data.filter((p, i) => i === 0 || data[i - 1][1] !== p[1]);
  const up = data[data.length - 1][1] >= data[0][1];
  const hp = hover != null ? data[hover] : null;
  const tone = up ? "text-up" : "text-down";

  function at(clientX: number) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const u = ((clientX - rect.left) / rect.width) * W;
    const ratio = Math.min(1, Math.max(0, (u - PAD.l) / (W - PAD.l - PAD.r)));
    setHover(Math.round(ratio * (data.length - 1)));
  }

  return (
    <figure className="m-0" data-price-history="">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs tabular-nums text-muted">
        <span>
          Low <b className="font-semibold">{money(lo)}</b> · High <b className="font-semibold">{money(hi)}</b> · Now <b className="font-semibold">{money(data[data.length - 1][1])}</b>
        </span>
        {ranges.length > 1 && (
          <span className="flex gap-1" role="group" aria-label="Date range">
            {ranges.map((r) => (
              <button
                key={r.key}
                type="button"
                aria-pressed={range === r.key}
                onClick={() => {
                  setRange(r.key);
                  setHover(null);
                }}
                className={`inline-flex min-h-8 items-center rounded-md px-2.5 text-xs font-semibold ${range === r.key ? "bg-brand/15 text-brand" : "text-muted hover:opacity-80"}`}
              >
                {r.key}
              </button>
            ))}
          </span>
        )}
      </div>
      <div
        ref={wrapRef}
        className="relative mt-2 select-none"
        style={{ height: H, touchAction: "pan-y" }}
        tabIndex={0}
        aria-label={`Price history: ${money(data[data.length - 1][1])} on ${dayToDate(last)}. Use the arrow keys to read each day.`}
        onMouseMove={(e) => at(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => at(e.touches[0].clientX)}
        onTouchMove={(e) => at(e.touches[0].clientX)}
        onFocus={() => setHover((h) => h ?? data.length - 1)}
        onBlur={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? data.length - 1) - 1));
          else if (e.key === "ArrowRight") setHover((h) => Math.min(data.length - 1, (h ?? data.length - 1) + 1));
          else return;
          e.preventDefault();
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className={`block w-full ${tone}`} style={{ height: H }} preserveAspectRatio={measuredW == null ? "none" : undefined} role="img" aria-label={`Price from ${money(data[0][1])} to ${money(data[data.length - 1][1])}`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(hi)} y2={y(hi)} stroke="currentColor" strokeOpacity="0.15" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          <line x1={PAD.l} x2={W - PAD.r} y1={y(lo)} y2={y(lo)} stroke="currentColor" strokeOpacity="0.15" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          <path d={d} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {measuredW != null && changes.length <= 60 && changes.map((p) => <circle key={p[0]} cx={x(p[0])} cy={y(p[1])} r={3} fill="currentColor" className="stroke-ink-900" strokeWidth={1.5} />)}
          {hp && (
            <g>
              <line x1={x(hp[0])} x2={x(hp[0])} y1={PAD.t} y2={H - PAD.b} stroke="currentColor" strokeOpacity="0.5" strokeDasharray="3 3" />
              <circle cx={x(hp[0])} cy={y(hp[1])} r={4.5} fill="currentColor" className="stroke-ink-900" strokeWidth={2} />
            </g>
          )}
        </svg>
        {hp && (
          <div className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-lg border border-ink-700 bg-ink-950 px-2.5 py-1.5 text-center shadow-xl" style={{ left: `clamp(4rem, ${(x(hp[0]) / W) * 100}%, calc(100% - 4rem))` }} role="status">
            <div className="text-sm font-bold tabular-nums">{money(hp[1])}</div>
            <div className="text-[11px] text-muted">{fmtDay(hp[0])}</div>
          </div>
        )}
      </div>
      <figcaption className="mt-2 flex justify-between gap-3 text-xs tabular-nums text-muted">
        <span>{fmtDay(first)}</span>
        <span>{fmtDay(last)}</span>
      </figcaption>
    </figure>
  );
}

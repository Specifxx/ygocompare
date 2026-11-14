// A dependency-free SVG line chart of a product's reference price.
import { dayToDate, type Series } from "@/lib/series";
import { money, shortDate } from "@/lib/format";

export function PriceChart({ series, days }: { series: Series; days: number }) {
  if (series.length < 2)
    return <p className="text-sm text-muted">Price history starts building from the first daily import — check back in a few days.</p>;
  const lastDay = series[series.length - 1][0];
  const today = Math.max(lastDay, Math.floor(Date.now() / 86_400_000));
  const from = today - days;
  // Step series: carry the value in effect at the window's start.
  let start = series[0];
  for (const p of series) if (p[0] <= from) start = p;
  const pts: [number, number][] = [[Math.max(from, start[0]), start[1]], ...series.filter((p) => p[0] > from)];
  pts.push([today, pts[pts.length - 1][1]]);
  const W = 640, H = 200, P = 8;
  const minX = pts[0][0], maxX = today;
  const ys = pts.map((p) => p[1]);
  const lo = Math.min(...ys), hi = Math.max(...ys);
  // The highest price sits near the top of the box and the lowest near the bottom, level with the two figures beside them.
  const pad = (hi - lo || hi * 0.1 || 1) * 0.08;
  const minY = lo - pad, maxY = hi + pad;
  const x = (d: number) => ((d - minX) / Math.max(1, maxX - minX)) * W;
  const y = (c: number) => H - P - ((c - minY) / Math.max(1, maxY - minY)) * (H - 2 * P);
  let d = `M${x(pts[0][0])},${y(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) d += ` H${x(pts[i][0])} V${y(pts[i][1])}`;
  const up = pts[pts.length - 1][1] >= pts[0][1];
  // The drawing stretches to its box (its line keeps its width: non-scaling-stroke); the figures are text beside it, at the page's
  // own size. Until 2026-11-14 they were drawn inside the SVG and shrank with it: about 5px tall on a phone.
  const label = "text-xs tabular-nums text-muted";
  return (
    <figure className="m-0">
      <div className="flex items-stretch gap-3">
        {hi > lo && (
          <div className={`flex shrink-0 flex-col justify-between py-1 text-right ${label}`} aria-hidden="true">
            <span>{money(hi)}</span>
            <span>{money(lo)}</span>
          </div>
        )}
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={`h-36 min-w-0 flex-1 sm:h-48 ${up ? "text-up" : "text-down"}`} role="img" aria-label={`Price from ${money(pts[0][1])} to ${money(pts[pts.length - 1][1])}`}>
          <line x1={0} x2={W} y1={y(hi)} y2={y(hi)} stroke="rgb(var(--line))" vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={W} y1={y(lo)} y2={y(lo)} stroke="rgb(var(--line))" vectorEffect="non-scaling-stroke" />
          <path d={d} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <figcaption className={`mt-2 flex justify-between gap-3 ${label}`}>
        <span>{shortDate(dayToDate(minX))}</span>
        <span>{shortDate(dayToDate(maxX))}</span>
      </figcaption>
    </figure>
  );
}

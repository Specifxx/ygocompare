"use client";

import { useMemo, useState } from "react";
import Link from "@/components/Link";
import { money } from "@/lib/format";

// One searchable list of the movers, sortable by % gain or loss (visitor feedback on
// RiftCompare, 2026-11-18: "sort by % of gain or loss, better than just toggling the
// gainers or losers button"). The rows are the ones the /movers page already ranks
// (`movers()` for 7 and 30 days, up and down), merged per product on the server: no
// new data, nothing fetched. Every % is the product's own TCGplayer market change.
export type MoverTableRow = { id: string; slug: string; name: string; cents: number; d7: number | null; d30: number | null };

type Sort = "move" | "gain" | "loss" | "price-desc" | "price-asc" | "name";
const SORTS: [Sort, string][] = [
  ["move", "Biggest % move, up or down"],
  ["gain", "Biggest % gain"],
  ["loss", "Biggest % loss"],
  ["price-desc", "Price: high to low"],
  ["price-asc", "Price: low to high"],
  ["name", "Name A–Z"],
];
const FIELD =
  "min-h-11 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 text-base focus:border-brand-500 focus:outline-none sm:min-h-0 sm:py-2 sm:text-sm";

function fmt(v: number | null): string {
  return v == null ? "—" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`;
}
function tone(v: number | null): string {
  return v == null || v === 0 ? "text-muted" : v > 0 ? "text-up" : "text-down";
}

export function MoversTable({ rows: all, noun = "cards" }: { rows: MoverTableRow[]; noun?: string }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("move");
  const [period, setPeriod] = useState<"d7" | "d30">("d7");
  const [side, setSide] = useState<"all" | "up" | "down">("all");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = all.filter((r) => {
      const v = r[period];
      if (v == null) return false;
      if (side === "up" && v <= 0) return false;
      if (side === "down" && v >= 0) return false;
      return !needle || r.name.toLowerCase().includes(needle);
    });
    const p = (r: MoverTableRow) => r[period] ?? 0;
    const by: Record<Sort, (a: MoverTableRow, b: MoverTableRow) => number> = {
      move: (a, b) => Math.abs(p(b)) - Math.abs(p(a)),
      gain: (a, b) => p(b) - p(a),
      loss: (a, b) => p(a) - p(b),
      "price-desc": (a, b) => b.cents - a.cents,
      "price-asc": (a, b) => a.cents - b.cents,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return list.sort(by[sort]);
  }, [all, q, sort, period, side]);

  if (all.length < 2) return null;
  const inPeriod = all.filter((r) => r[period] != null).length;

  // A Risers/Fallers tap on the default order puts that side's biggest move first.
  function pickSide(k: "all" | "up" | "down") {
    setSide(k);
    if (sort === "move" && k !== "all") setSort(k === "up" ? "gain" : "loss");
  }

  const seg = (on: boolean) =>
    `inline-flex min-h-11 items-center whitespace-nowrap rounded-md px-3 text-xs font-semibold transition-colors sm:min-h-0 sm:py-1.5 ${on ? "bg-ink-800" : "text-muted hover:opacity-80"}`;

  return (
    <section id="all-movers" className="card-surface p-4 sm:p-5">
      <h2 className="font-display text-lg font-bold">Search and sort every mover</h2>
      <p className="mb-3 mt-1 text-sm text-muted">
        All {all.length} {noun} in the lists below, sortable by their % change over 7 or 30 days.
      </p>
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name…"
          aria-label="Search the movers"
          className={`${FIELD} lg:flex-1`}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-xs text-muted">
            <span className="shrink-0 font-semibold">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort the movers" className={`${FIELD} sm:w-auto`}>
              {SORTS.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-ink-700 p-1" role="group" aria-label="Period">
              {([["d7", "7 days"], ["d30", "30 days"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setPeriod(k)} aria-pressed={period === k} className={seg(period === k)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-ink-700 p-1" role="group" aria-label="Risers or fallers">
              {([["all", "All"], ["up", "▲ Risers"], ["down", "▼ Fallers"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => pickSide(k)}
                  aria-pressed={side === k}
                  className={`${seg(side === k)} ${side === k && k === "up" ? "text-up" : ""} ${side === k && k === "down" ? "text-down" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="max-h-[34rem] overflow-auto overscroll-contain">
        {rows.length ? (
          <ol>
            {rows.map((r, i) => (
              <li key={r.id} className="flex items-center justify-between gap-2 border-t border-ink-800 text-sm">
                <span className="w-7 shrink-0 tabular-nums text-muted">{i + 1}</span>
                <Link className="min-w-0 flex-1 truncate py-2.5 hover:underline" href={`/card/${r.slug}`}>
                  {r.name}
                </Link>
                <span className="shrink-0 tabular-nums">{money(r.cents)}</span>
                <span className={`w-16 shrink-0 text-right font-semibold tabular-nums ${tone(r[period])}`}>{fmt(r[period])}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-8 text-center text-sm text-muted">No {noun} match that search.</p>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        Showing {rows.length} of {inPeriod} with a {period === "d7" ? "7-day" : "30-day"} move.
      </p>
    </section>
  );
}

"use client";
// The filter and sort bar over a product grid (2026-11-23: the list pages were one undifferentiated wall, 774 booster boxes on
// one page). The grid itself is server HTML (FilterGrid.tsx): every product link is in the page for crawlers and for a browser
// without scripts. This bar only hides tiles (.lc-x) and sets their CSS `order`; it never fetches, never navigates and never
// changes the URL's path or query (one CDN copy per URL). The choice lives in the hash, so a filtered list can be shared.
import { useCallback, useEffect, useRef, useState } from "react";

// Owner's UX review (2026-11-23, P0 3): sort by price, % under market and newest, filter by set, era, edition and price band. Price
// per pack is left out on purpose: TCGplayer files no pack count for YGO sealed, and a pack count is never guessed (CLAUDE.md).
// Language is left out too: the site matches English product only, so the edition (1st / Unlimited) is the split a buyer reads.
export interface LcGame { id: string; name: string; n: number }
export interface LcSet { id: string; name: string; date: string; n: number }
type Sort = "pop" | "new" | "lo" | "hi" | "under" | "stores";
const SORTS: [Sort, string][] = [["pop", "Most popular"], ["new", "Newest set"], ["lo", "Price: low to high"], ["hi", "Price: high to low"], ["under", "% under market"], ["stores", "Most stores"]];
/** Price bands on TCGplayer's market price, in US$ (the price every tile shows). */
const BANDS: [string, string, number, number][] = [["u25", "Under $25", 0, 2500], ["25-100", "$25–100", 2500, 10000], ["100-250", "$100–250", 10000, 25000], ["250", "$250+", 25000, Infinity]];
const ERAS: [string, string, (y: number) => boolean][] = [["2024", "2024 on", (y) => y >= 2024], ["2020", "2020–2023", (y) => y >= 2020 && y < 2024], ["2010", "2010–2019", (y) => y >= 2010 && y < 2020], ["old", "Before 2010", (y) => y > 0 && y < 2010]];
const EDITIONS: [string, string][] = [["1st", "1st Edition"], ["unl", "Unlimited"]];
interface Row { el: HTMLElement; i: number; date: string; cents: number; stores: number; pre: boolean; game: string; set: string; ed: string; under: number; name: string }

export function ListControls({ target, total, games, sets = [], first, noun = "products" }: { target: string; total: number; games: LcGame[]; sets?: LcSet[]; first: number; noun?: string }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("pop");
  const [stock, setStock] = useState(false);
  const [game, setGame] = useState("");
  const [set, setSet] = useState("");
  const [era, setEra] = useState("");
  const [ed, setEd] = useState("");
  const [band, setBand] = useState("");
  const [limit, setLimit] = useState(first);
  const [count, setCount] = useState(total);
  const rows = useRef<Row[] | null>(null);
  const ready = useRef(false);

  const read = useCallback((): Row[] => {
    if (rows.current) return rows.current;
    const grid = document.getElementById(target);
    rows.current = grid
      ? Array.from(grid.querySelectorAll<HTMLElement>("[data-lc]")).map((el, i) => {
          const [date, cents, stores, pre, g, st, e, u] = (el.dataset.lc ?? "").split("|");
          return { el, i, date, cents: Number(cents) || 0, stores: Number(stores) || 0, pre: pre === "1", game: g ?? "", set: st ?? "", ed: e ?? "", under: Number(u) || 0, name: (el.dataset.qvName ?? el.textContent ?? "").toLowerCase() };
        })
      : [];
    return rows.current;
  }, [target]);

  // The hash on arrival (a shared filtered list), once.
  useEffect(() => {
    const h = new URLSearchParams(window.location.hash.slice(1));
    const s = h.get("sort") as Sort | null;
    if (s && SORTS.some(([k]) => k === s)) setSort(s);
    if (h.get("stock") === "1") setStock(true);
    const g = h.get("game");
    if (g && games.some((x) => x.id === g)) setGame(g);
    const text = h.get("q");
    if (text) setQ(text.slice(0, 60));
    const st = h.get("set");
    if (st && sets.some((x) => x.id === st)) setSet(st);
    const er = h.get("era");
    if (er && ERAS.some(([k]) => k === er)) setEra(er);
    const e = h.get("ed");
    if (e && EDITIONS.some(([k]) => k === e)) setEd(e);
    const b = h.get("price");
    if (b && BANDS.some(([k]) => k === b)) setBand(b);
    ready.current = true;
  }, [games, sets]);

  useEffect(() => {
    const all = read();
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const bandOf = BANDS.find(([k]) => k === band);
    const eraOf = ERAS.find(([k]) => k === era);
    const keep = all.filter(
      (r) =>
        (!game || r.game === game) &&
        (!stock || (r.stores > 0 && !r.pre)) &&
        (!set || r.set === set) &&
        (!ed || r.ed === ed) &&
        (!eraOf || eraOf[2](Number(r.date.slice(0, 4)) || 0)) &&
        (!bandOf || (r.cents > 0 && r.cents >= bandOf[2] && r.cents < bandOf[3])) &&
        words.every((w) => r.name.includes(w)),
    );
    const priced = (r: Row) => (r.cents > 0 ? 0 : 1); // a product with no price never leads a price sort
    const by: Record<Sort, (a: Row, b: Row) => number> = {
      pop: (a, b) => a.i - b.i,
      new: (a, b) => b.date.localeCompare(a.date) || a.i - b.i,
      lo: (a, b) => priced(a) - priced(b) || a.cents - b.cents || a.i - b.i,
      hi: (a, b) => priced(a) - priced(b) || b.cents - a.cents || a.i - b.i,
      under: (a, b) => b.under - a.under || a.i - b.i,
      stores: (a, b) => b.stores - a.stores || a.i - b.i,
    };
    keep.sort(by[sort]);
    const pos = new Map(keep.map((r, n) => [r, n]));
    for (const r of all) {
      const n = pos.get(r);
      r.el.classList.toggle("lc-x", n == null || n >= limit);
      r.el.style.order = n == null ? "" : String(n);
    }
    setCount(keep.length);
    if (ready.current) {
      const h = new URLSearchParams();
      if (sort !== "pop") h.set("sort", sort);
      if (stock) h.set("stock", "1");
      if (game) h.set("game", game);
      if (q) h.set("q", q);
      if (set) h.set("set", set);
      if (era) h.set("era", era);
      if (ed) h.set("ed", ed);
      if (band) h.set("price", band);
      const s = h.toString();
      if (s || window.location.hash) history.replaceState(null, "", s ? `#${s}` : window.location.pathname + window.location.search);
    }
  }, [q, sort, stock, game, set, era, ed, band, limit, read]);

  const change = <T,>(set: (v: T) => void) => (v: T) => { set(v); setLimit(first); };
  const filtered = !!(q || stock || game || set || era || ed || band);
  const hasEd = useHasEditions(target);
  const shown = Math.min(limit, count);
  return (
    <div className="lc" data-lc-bar>
      <div className="lc-row">
        <label className="lc-search">
          <span className="sr-only">Filter these {noun} by name</span>
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-faint" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="6" /><path d="m14 14 4 4" strokeLinecap="round" /></svg>
          <input type="search" value={q} onChange={(e) => change(setQ)(e.target.value)} placeholder="Filter by name" aria-label={`Filter ${total.toLocaleString()} ${noun} by name`} autoComplete="off" enterKeyHint="search" />
        </label>
        <label className="lc-sort">
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(e) => change(setSort)(e.target.value as Sort)}>
            {SORTS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
        {sets.length > 1 && (
          <label className="lc-sort">
            <span className="sr-only">Set</span>
            <select value={set} onChange={(e) => change(setSet)(e.target.value)}>
              <option value="">All sets</option>
              {sets.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.n})</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="scroller lc-chips" role="group" aria-label="Filters">
        <button type="button" aria-pressed={stock} onClick={() => change(setStock)(!stock)} className={`chip min-h-10 whitespace-nowrap ${stock ? "chip-on" : ""}`}>
          <span aria-hidden="true" className="lc-dot" />In stock now
        </button>
        {games.length > 1 && games.map((g) => (
          <button key={g.id} type="button" aria-pressed={game === g.id} onClick={() => change(setGame)(game === g.id ? "" : g.id)} className={`chip min-h-10 whitespace-nowrap ${game === g.id ? "chip-on" : ""}`}>
            {g.name} <span className="tabular text-xs opacity-60">{g.n}</span>
          </button>
        ))}
        {hasEd && EDITIONS.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={ed === k} onClick={() => change(setEd)(ed === k ? "" : k)} className={`chip min-h-10 whitespace-nowrap ${ed === k ? "chip-on" : ""}`}>{label}</button>
        ))}
        <label className="chip min-h-10 whitespace-nowrap">
          <span className="sr-only">Era</span>
          <select value={era} onChange={(e) => change(setEra)(e.target.value)} className="bg-transparent outline-none">
            <option value="">Any year</option>
            {ERAS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
        <label className="chip min-h-10 whitespace-nowrap">
          <span className="sr-only">Price</span>
          <select value={band} onChange={(e) => change(setBand)(e.target.value)} className="bg-transparent outline-none">
            <option value="">Any price</option>
            {BANDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
      </div>
      <p className="lc-count" aria-live="polite">
        {count === 0 ? `No ${noun} match.` : `Showing ${shown.toLocaleString()} of ${count.toLocaleString()}${filtered ? ` (${total.toLocaleString()} in all)` : ""}`}
        {filtered && <button type="button" className="lc-clear" onClick={() => { setQ(""); setStock(false); setGame(""); setSet(""); setEra(""); setEd(""); setBand(""); setLimit(first); }}>Clear filters</button>}
      </p>
      {/* The grid sits between the bar and this foot in the page; `order` in the wrapper (globals.css .lc-wrap) puts it last. */}
      {count > limit && (
        <div className="lc-more">
          <button type="button" className="btn-soft min-h-11 px-5" onClick={() => setLimit(limit + first)}>Show {Math.min(first, count - limit)} more</button>
          <button type="button" className="btn-ghost min-h-11 px-4" onClick={() => setLimit(count)}>Show all {count.toLocaleString()}</button>
        </div>
      )}
    </div>
  );
}

/** Whether the grid holds both editions (a type with none, Tins say, gets no edition chips). */
function useHasEditions(target: string): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    const eds = new Set(Array.from(document.getElementById(target)?.querySelectorAll<HTMLElement>("[data-lc]") ?? []).map((el) => (el.dataset.lc ?? "").split("|")[6]).filter(Boolean));
    setHas(eds.size > 1);
  }, [target]);
  return has;
}

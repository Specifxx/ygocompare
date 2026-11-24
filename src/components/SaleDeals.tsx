"use client";

// The Black Friday / Cyber Monday pages' ONE deal list (lib/sale-deals.ts; owner's review, 2026-11-24). The server renders it with
// the default filters (US), so the first screen of the HTML already holds deal rows; the visitor's market, the toggle, filters and
// sort then run in the browser over the same rows (no request). Every row: a 64-72px thumbnail on a white tile, the name, a discount
// badge, today's price with the reference price struck through, "checked N h ago" (flagged past 12 hours), the delivered price
// where we know the shipping, a 30-day sparkline, the store's button (primary) and an eBay text link (secondary). After the fifth
// row, one slim bar of alerts (email, Discord, Telegram).
import Link from "@/components/Link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { track } from "@vercel/analytics";
import { ALERT_SERVICE } from "@/components/PriceAlertForm";
import { TELEGRAM_URL } from "@/components/DiscordCta";
import { useMarket } from "@/components/ClientPrefs";
import { money } from "@/lib/format";
import { MARKET_LABEL, type Market } from "@/lib/site-types";
import {
  agoLabel,
  applyFilters,
  basesIn,
  DEFAULT_FILTERS,
  deliveredCents,
  isStale,
  pctOn,
  PRICE_BANDS,
  refCents,
  sparkPath,
  valuesOf,
  type SaleBasis,
  type SaleDealRow,
  type SaleFilters,
} from "@/lib/sale-deals";

const PAGE = 20;
const ALERT_AFTER = 5;

const BASIS_LABEL: Record<SaleBasis, { tab: string; badge: string; ref: string; tip: string }> = {
  tcg: {
    tab: "Under TCGplayer",
    badge: "TCGplayer",
    ref: "TCGplayer market",
    tip: "Against TCGplayer's market price (recent sales), in US dollars on both sides: 8% to 60% under, products worth $5 or more.",
  },
  median: {
    tab: "Under other stores today",
    badge: "median",
    ref: "store median",
    tip: "Against the middle price of the stores that have it in stock in this country today (three or more stores, 10% to 45% under: more than that is far likelier a wrong match than a sale), in its own currency.",
  },
};

export function SaleDeals({ rows, siteKey, discordHref, page, email }: { rows: SaleDealRow[]; siteKey: string; discordHref: string | null; page: string; email: boolean }) {
  const { market: visitor } = useMarket();
  const markets = useMemo(() => [...new Set(rows.map((r) => r.market))], [rows]);
  const [f, setF] = useState<SaleFilters>(() => ({ ...DEFAULT_FILTERS, basis: basesIn(rows, "US")[0] ?? "median" }));
  useEffect(() => {
    if (visitor && visitor !== "US" && markets.includes(visitor)) setF((x) => ({ ...x, market: visitor, basis: basesIn(rows, visitor)[0] ?? "median", type: "", game: "" }));
  }, [visitor, markets, rows]);
  const [shown, setShown] = useState(PAGE);
  const list = useMemo(() => applyFilters(rows, f), [rows, f]);
  const types = useMemo(() => valuesOf(rows, f, "productType"), [rows, f]);
  const games = useMemo(() => valuesOf(rows, f, "game"), [rows, f]);
  const bases = basesIn(rows, f.market);
  const currency = rows.find((r) => r.market === f.market)?.currency ?? "USD";
  const fmt = (c: number) => money(c, currency);
  const set = (patch: Partial<SaleFilters>) => {
    setF((x) => {
      const next = { ...x, ...patch };
      if (patch.market) {
        const b = basesIn(rows, patch.market);
        if (!b.includes(next.basis)) next.basis = b[0] ?? "median";
        next.type = "";
        next.game = "";
      }
      return next;
    });
    setShown(PAGE);
    track("bf_filter", { page, key: Object.keys(patch)[0] ?? "", value: String(Object.values(patch)[0] ?? "") });
  };
  const counts = (b: SaleBasis) => rows.filter((r) => r.market === f.market && r[b]).length;
  const sel = "min-h-11 rounded-lg border border-line bg-surface px-2.5 text-sm";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {bases.length > 1 ? (
          <div role="tablist" aria-label="Compare against" className="inline-flex rounded-xl border border-line p-1">
            {bases.map((b) => (
              <button
                key={b}
                role="tab"
                type="button"
                aria-selected={f.basis === b}
                onClick={() => set({ basis: b })}
                className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${f.basis === b ? "bg-brand text-white" : "text-muted hover:text-ink"}`}
              >
                {BASIS_LABEL[b].tab} <span className="tabular font-normal opacity-80">({counts(b)})</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold">{BASIS_LABEL[f.basis].tab}</p>
        )}
        <details className="text-sm">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 text-muted hover:text-ink">
            <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full border border-current text-[11px] font-bold">i</span>
            How we calculate
          </summary>
          <p className="mt-2 max-w-xl text-xs leading-5 text-muted">
            {BASIS_LABEL[f.basis].tip} Item prices are the store&rsquo;s own in-stock price when we last read it; a sale can start or end between reads.
          </p>
        </details>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Filter and sort the deals">
        {markets.length > 1 && (
          <>
            <label className="sr-only" htmlFor="bf-market">Country</label>
            <select id="bf-market" className={sel} value={f.market} onChange={(e) => set({ market: e.target.value })}>
              {markets.map((m) => (
                <option key={m} value={m}>
                  {MARKET_LABEL[m as Market] ?? m}
                </option>
              ))}
            </select>
          </>
        )}
        {games.length > 1 && (
          <>
            <label className="sr-only" htmlFor="bf-game">Game</label>
            <select id="bf-game" className={sel} value={f.game} onChange={(e) => set({ game: e.target.value })}>
              <option value="">All games</option>
              {games.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </>
        )}
        {types.length > 1 && (
          <>
            <label className="sr-only" htmlFor="bf-type">Product type</label>
            <select id="bf-type" className={sel} value={f.type} onChange={(e) => set({ type: e.target.value })}>
              <option value="">All product types</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </>
        )}
        <label className="sr-only" htmlFor="bf-band">Price</label>
        <select id="bf-band" className={sel} value={f.band} onChange={(e) => set({ band: e.target.value as SaleFilters["band"] })}>
          <option value="">Any price</option>
          {PRICE_BANDS.map((b) => (
            <option key={b.key} value={b.key}>
              {b.max === Infinity ? `${fmt(b.min)}+` : b.min === 0 ? `Under ${fmt(b.max)}` : `${fmt(b.min)}–${fmt(b.max)}`}
            </option>
          ))}
        </select>
        {rows.some((r) => r.preorder) && (
          <>
            <label className="sr-only" htmlFor="bf-stock">Availability</label>
            <select id="bf-stock" className={sel} value={f.stock} onChange={(e) => set({ stock: e.target.value as SaleFilters["stock"] })}>
              <option value="all">In stock and pre-order</option>
              <option value="now">In stock</option>
              <option value="pre">Pre-order</option>
            </select>
          </>
        )}
        <label className="sr-only" htmlFor="bf-sort">Sort</label>
        <select id="bf-sort" className={sel} value={f.sort} onChange={(e) => set({ sort: e.target.value as SaleFilters["sort"] })}>
          <option value="pct">Sort: % off</option>
          <option value="price">Sort: price, low to high</option>
        </select>
      </div>

      {list.length ? (
        <ol className="mt-4 grid gap-2">
          {list.slice(0, shown).map((row, i) => (
            <SaleRow key={row.key} row={row} basis={f.basis} fmt={fmt} alertBar={i === ALERT_AFTER - 1} siteKey={siteKey} discordHref={discordHref} page={page} email={email} />
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-xl border border-line px-4 py-6 text-sm text-muted">No deal matches these filters right now. Try another product type or price.</p>
      )}
      {list.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE)} className="btn-soft mt-3 min-h-11 w-full px-4 text-sm sm:w-auto">
          Show {Math.min(PAGE, list.length - shown)} more of {list.length}
        </button>
      )}
    </div>
  );
}

function SaleRow({ row, basis, fmt, alertBar, siteKey, discordHref, page, email }: { row: SaleDealRow; basis: SaleBasis; fmt: (c: number) => string; alertBar: boolean; siteKey: string; discordHref: string | null; page: string; email: boolean }) {
  const pct = pctOn(row, basis);
  const ref = refCents(row, basis);
  const stale = isStale(row.checkedAt);
  const delivered = deliveredCents(row);
  const path = sparkPath(row.spark, 72, 22);
  return (
    <>
      <li className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 rounded-xl border border-line bg-raised p-3 sm:grid-cols-[72px_minmax(0,1fr)_96px_9.5rem_8.5rem] sm:items-center sm:gap-x-4">
        <div className="row-span-2 grid h-16 w-16 place-items-center overflow-hidden rounded-lg bg-white sm:row-span-1 sm:h-[72px] sm:w-[72px]">
          {row.imageUrl ? <img src={row.imageUrl} alt={row.name} width={72} height={72} loading="lazy" decoding="async" className="h-full w-full object-contain p-1" /> : null}
        </div>
        <div className="min-w-0">
          <Link href={`/card/${row.slug}`} className="block font-semibold leading-snug hover:text-brand">
            {row.name}
          </Link>
          <span className="mt-0.5 block text-xs text-muted">
            {row.game ? `${row.game} · ` : ""}
            {row.productType}
            {row.preorder ? " · Pre-order" : ""}
            {basis === "median" && row.median ? ` · ${row.median.stores} stores` : ""}
          </span>
          {row.checkedAt && (
            <span className={`mt-0.5 block text-xs ${stale ? "font-semibold text-amber-700 dark:text-amber-400" : "text-muted"}`}>
              {stale ? "Price checked " : "Checked "}
              <time dateTime={row.checkedAt} suppressHydrationWarning>
                {agoLabel(row.checkedAt)}
              </time>
              {stale ? ": check the store before you buy" : ""}
            </span>
          )}
        </div>
        <div className="col-start-2 sm:col-start-auto" aria-hidden={!path}>
          {path ? (
            <svg width="72" height="22" viewBox="0 0 72 22" role="img" aria-label={`${row.name}: cheapest in-stock store price over the last 30 days`} className="text-brand">
              <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          ) : null}
        </div>
        <div className="col-span-2 flex flex-wrap items-baseline gap-x-2 sm:col-span-1 sm:block sm:text-right">
          {pct != null && <span title={BASIS_LABEL[basis].tip} className="mr-1 inline-block rounded-md bg-open px-1.5 py-0.5 text-sm font-bold text-white sm:mb-1">{pct}% under {BASIS_LABEL[basis].badge}</span>}
          <b className="tabular text-xl font-extrabold">{fmt(row.priceCents)}</b>
          {ref != null && (
            <s className="tabular ml-1 text-sm text-muted" title={BASIS_LABEL[basis].ref}>
              <span className="sr-only">{BASIS_LABEL[basis].ref} </span>
              {fmt(ref)}
            </s>
          )}
          <span className="block w-full text-xs text-muted">
            {row.shipCents == null ? "Shipping at checkout" : row.shipCents === 0 ? "Free shipping" : `≈ ${fmt(delivered!)} delivered`}
          </span>
        </div>
        <div className="col-span-2 flex items-center gap-3 sm:col-span-1 sm:flex-col sm:items-stretch sm:gap-1">
          <a href={row.buyHref} rel="sponsored nofollow noopener" target="_blank" className="btn-primary min-h-11 flex-1 truncate px-3 text-center text-sm sm:flex-none" aria-label={`Buy ${row.name} at ${row.storeName}`}>
            Buy at {row.storeName}
          </a>
          {row.ebayHref && (
            <a href={row.ebayHref} rel="sponsored nofollow noopener" target="_blank" className="min-h-11 shrink-0 content-center text-center text-xs font-semibold text-muted underline underline-offset-2 hover:text-ink sm:min-h-0" aria-label={`${row.name} on eBay (paid link)`}>
              or on eBay
            </a>
          )}
        </div>
      </li>
      {alertBar && <AlertsBar siteKey={siteKey} market={row.market} discordHref={discordHref} page={page} email={email} />}
    </>
  );
}

function AlertsBar({ siteKey, market, discordHref, page, email }: { siteKey: string; market: string; discordHref: string | null; page: string; email: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (String(fd.get("website") ?? "")) return setState("done");
    setState("sending");
    try {
      const r = await fetch(ALERT_SERVICE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: siteKey, region: market, email: String(fd.get("email") ?? ""), kind: "weekly" }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean };
      if (r.ok && j.ok) {
        track("weekly_signup", { placement: page, region: market });
        setState("done");
      } else setState("error");
    } catch {
      setState("error");
    }
  }
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-line px-3 py-2 text-sm" aria-label="Deal alerts">
      <span className="font-semibold">Get new deals as they land:</span>
      {!email ? null : state === "done" ? (
        <span role="status" className="text-muted">Check your inbox to confirm.</span>
      ) : (
        <form onSubmit={submit} className="flex min-w-0 flex-1 basis-56 gap-2">
          <label className="sr-only" htmlFor="bf-alert-email">Your email</label>
          <input id="bf-alert-email" name="email" type="email" required autoComplete="email" placeholder="Your email" className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-transparent px-2.5 text-base sm:text-sm" />
          <span className="sr-only" aria-hidden="true">
            <input name="website" tabIndex={-1} autoComplete="off" />
          </span>
          <button type="submit" disabled={state === "sending"} className="btn-soft min-h-11 shrink-0 px-3 text-sm">
            {state === "sending" ? "Saving…" : "Email me"}
          </button>
        </form>
      )}
      {discordHref && (
        <a href={discordHref} target="_blank" rel="noopener noreferrer" className="min-h-11 content-center font-semibold text-[#5865F2] underline underline-offset-2">
          Discord
        </a>
      )}
      <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="min-h-11 content-center font-semibold text-[#229ED9] underline underline-offset-2">
        Telegram
      </a>
      {state === "error" && <span role="alert" className="w-full text-xs text-red-600">Couldn&rsquo;t save that. Please try again.</span>}
    </li>
  );
}

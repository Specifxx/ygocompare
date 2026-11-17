import type { Metadata } from "next";
import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { deals, meta, storeDealsIn } from "@/lib/data";
import { CyberWeekendNote } from "@/components/CyberWeekendNote";
import { cyberWeekendState } from "@/lib/cyber-weekend";
import { DaysUntil } from "@/components/DaysUntil";
import { gameOf, UnderStoresCards, UnderTcgCards } from "@/components/DealCards";
import { blackFriday, cyberMonday, daysLabel, daysUntil, EVENT_NAME, groupBy, holidayFaq, longDate, seasonYear, splitDeals, type HolidayEvent } from "@/lib/black-friday";
import { listRegions } from "@/lib/sale-seasons";
import { FamilyCluster } from "@/components/FamilyCluster";
import { ADJ, IN, UnderStores } from "@/components/SaleSeasonPage";
import { postsAbout } from "@/lib/posts";
import type { Market } from "@/lib/site-types";

// The Black Friday and Cyber Monday pages (DECISIONS.md, "Black Friday page", 2026-11-02, and "Cyber Monday
// page", 2026-11-07): one URL each, kept year after year, so links and rankings carry over. Rebuilt from the
// day's prices like every page; never a "was" price, a countdown or an invented sale. The US rows are the
// deals() under TCGplayer's market price; every other market's rows are its own stores, in its own currency.

const today = () => (meta()?.updatedAt ?? new Date().toISOString()).slice(0, 10);
const OTHER: Market[] = ["UK", "CA", "AU", "EU", "SG"];

function regions(): string {
  const have = new Set(SITE.stores.map((s) => s.market));
  return listRegions((["US", ...OTHER] as Market[]).filter((m) => have.has(m)).map((m) => IN[m]));
}

export function holidayMetadata(event: HolidayEvent): Metadata {
  const year = seasonYear(today());
  if (event === "black-friday") {
    return {
      title: `${SITE.gameShort} Black Friday Deals ${year}: Store Prices Under TCGplayer`,
      description: `Black Friday and Cyber Monday ${year} ${SITE.game} deals: sealed product and cards that ${SITE.stores.length} stores sell under TCGplayer's market price today, updated every day.`,
      ...canon("/black-friday"),
    };
  }
  return {
    title: `${SITE.gameShort} Cyber Monday Deals ${year}: Store Prices Compared`,
    description: `Cyber Monday ${year} ${SITE.game} deals: booster boxes, sealed product${SITE.sealedOnly ? "" : " and cards"} that ${SITE.stores.length} online stores sell under TCGplayer's market price today, updated every day.`,
    ...canon("/cyber-monday"),
  };
}

export function HolidayDealsPage({ event }: { event: HolidayEvent }) {
  const now = today();
  const year = seasonYear(now);
  const bf = blackFriday(year);
  const cm = cyberMonday(year);
  const { sealed, cards } = splitDeals(deals(400).filter((d) => d.offer.source !== "ebay" && d.offer.source !== "amazon"));
  const asOf = meta()?.updatedAt
    ? new Date(meta()!.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : null;
  const before = now < (event === "black-friday" ? bf : cm);
  const have = new Set(SITE.stores.map((s) => s.market));
  const others = OTHER.filter((m) => have.has(m));
  const faq = holidayFaq(event, year, { game: SITE.gameShort, stores: SITE.stores.length, regions: regions() });
  // The blog's Black Friday guides, linked from the hub so the two are crawled together (2026-11-07).
  const guides = postsAbout(["Black Friday", "Cyber Monday"]).slice(0, 3);
  const sister = event === "black-friday" ? { href: "/cyber-monday", label: "Cyber Monday deals" } : { href: "/black-friday", label: "Black Friday deals" };

  const usAll = [...sealed, ...cards];
  const byGame = groupBy(usAll, (d) => gameOf(d.p)?.id ?? null, (d) => d.market * d.saving, 6);
  const gameName = (id: string) => gameOf(usAll.find((d) => gameOf(d.p)?.id === id)!.p)!.name;
  const featured = [...usAll].sort((a, b) => b.saving - a.saving || b.market - a.market).slice(0, 6);
  const biggest = featured[0]?.saving ?? 0;
  const eventDate = event === "black-friday" ? bf : cm;
  const nowDay = new Date().toISOString().slice(0, 10);
  const page = event;

  return (
    <article className="flex max-w-5xl flex-col gap-8">
      <header className="rounded-2xl border border-line bg-raised p-5 sm:p-7">
        <p className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="tag">Black Friday · {longDate(bf)} · <DaysUntil target={bf} initial={daysLabel(daysUntil(nowDay, bf))} /></span>
          <span className="tag">Cyber Monday · {longDate(cm)} · <DaysUntil target={cm} initial={daysLabel(daysUntil(nowDay, cm))} /></span>
        </p>
        <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">{SITE.gameShort} {EVENT_NAME[event]} deals {year}</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Everything {SITE.stores.length.toLocaleString("en-US")} stores sell under the going price right now, in stock, rebuilt from each day&apos;s prices{asOf ? ` (last updated ${asOf})` : ""}.
          {before ? " Stores often start their sales earlier, so the deals are here before the day." : ""} Bookmark it: the same page updates every day through the sales.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat n={String(usAll.length)} label="US deals today" />
          <Stat n={biggest ? `${biggest}%` : "—"} label="biggest saving under TCGplayer" />
          <Stat n={String(byGame.length || 1)} label={byGame.length === 1 ? "game" : "games with deals"} />
          <Stat n={SITE.stores.length.toLocaleString("en-US")} label="stores compared" />
        </dl>
        <nav aria-label="Jump to" className="mt-4 flex flex-wrap gap-2 text-sm">
          {featured.length > 0 && <a className="chip" href="#biggest">Biggest savings</a>}
          {byGame.map((g) => <a key={g.key} className="chip" href={`#g-${g.key}`}>{gameName(g.key)}</a>)}
          {others.map((m) => <a key={m} className="chip" href={`#${m.toLowerCase()}`}>{IN[m].replace(/^the /, "")}</a>)}
        </nav>
      </header>

      <CyberWeekendNote initial={cyberWeekendState(Date.now())} />

      {featured.length > 0 && (
        <section id="biggest" className="flex scroll-mt-20 flex-col gap-3">
          <h2 className="text-2xl font-bold">Biggest savings under TCGplayer</h2>
          <UnderTcgCards rows={featured} page={`${page}_top`} />
        </section>
      )}

      {byGame.map((g) => (
        <section key={g.key} id={`g-${g.key}`} className="flex scroll-mt-20 flex-col gap-3">
          <h2 className="text-2xl font-bold">{gameName(g.key)} deals <span className="text-base font-normal text-muted">({g.total} under TCGplayer)</span></h2>
          <UnderTcgCards rows={g.rows} page={`${page}_${g.key}`} />
        </section>
      ))}
      {byGame.length === 0 && usAll.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold">Under TCGplayer today</h2>
          <UnderTcgCards rows={usAll.slice(0, 12)} page={`${page}_us`} />
        </section>
      )}
      {usAll.length === 0 && <p className="text-sm text-muted">No product is under TCGplayer&apos;s market price in a US store today. This fills in as stores cut prices.</p>}

      {others.map((m) => {
        const rows = storeDealsIn(m, 12, SITE.sealedOnly ? "sealed" : undefined);
        return (
          <section key={m} id={m.toLowerCase()} className="flex scroll-mt-20 flex-col gap-3">
            <h2 className="text-2xl font-bold">{EVENT_NAME[event]} deals in {ADJ[m]} stores</h2>
            {rows.length ? <UnderStoresCards rows={rows} page={`${page}_${m.toLowerCase()}`} /> : <p className="text-sm text-muted">Nothing is 10% under the other stores in {IN[m]} today. This fills in as stores cut prices.</p>}
          </section>
        );
      })}

      <FamilyCluster cluster="cards" kind="deal" />
      <section className="card-surface flex flex-col gap-2 p-4 text-sm">
        <h2 className="text-lg font-bold">How to read this</h2>
        <p>Each US row is the cheapest in-stock US store price we found (stores only, never eBay or Amazon), 8% to 60% under TCGplayer&apos;s market price, for products worth $5 or more. Item prices before shipping, in US dollars on both sides.{others.length ? " Every other country's rows are its own stores, at least 10% under the middle price of three or more stores there, in its own currency, never converted." : ""}</p>
        <p>We only see what a store asks when we read its prices, so a sale can start or end between updates. Always check the price on the store&apos;s page before you buy.</p>
        <p>
          <Link className="link" href={sister.href}>{sister.label} →</Link> · <Link className="link" href="/tools/deal-finder">Deal Finder, with filters →</Link> ·{" "}
          <Link className="link" href="/price-report">Monthly price report →</Link> · <Link className="link" href="/sealed">Every sealed product →</Link>
        </p>
        {guides.map((g) => (
          <p key={g.slug}>
            Read: <Link className="link" href={`/blog/${g.slug}`}>{g.title}</Link>
          </p>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{EVENT_NAME[event]} {year}: questions</h2>
        {faq.map((f) => (
          <div key={f.q} className="text-sm">
            <h3 className="font-semibold">{f.q}</h3>
            <p className="text-muted">{f.a}</p>
          </div>
        ))}
      </section>
    </article>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2">
      <dt className="sr-only">{label}</dt>
      <dd className="text-2xl font-extrabold tabular-nums">{n}</dd>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

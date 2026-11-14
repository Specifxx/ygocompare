import type { Metadata } from "next";
import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { deals, meta, storeDealsIn, type Deal } from "@/lib/data";
import { money } from "@/lib/format";
import { shortName } from "@/lib/names";
import { sourceNameServer } from "@/lib/sources";
import { blackFriday, cyberMonday, EVENT_NAME, holidayFaq, longDate, seasonYear, splitDeals, type HolidayEvent } from "@/lib/black-friday";
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

  return (
    <article className="flex max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="page-h1">{SITE.gameShort} {EVENT_NAME[event]} deals {year}</h1>
        <p className="text-muted">
          {event === "black-friday" ? <>Black Friday is {longDate(bf)} and Cyber Monday is {longDate(cm)} {year}.{" "}</> : <>Cyber Monday is {longDate(cm)} {year}, the Monday after Black Friday ({longDate(bf)}).{" "}</>}
          {before ? "Stores often start their sales earlier. " : ""}
          Below is everything {SITE.stores.length} stores sell under TCGplayer&apos;s market price right now, in stock, rebuilt from each day&apos;s prices
          {asOf ? ` (last updated ${asOf})` : ""}. Bookmark it: the same page updates every day through the sales.
        </p>
      </header>

      <Section title="Sealed product under TCGplayer today" rows={sealed} empty="No sealed product is under TCGplayer's market price in a US store today." />
      {!SITE.sealedOnly && <Section title="Cards under TCGplayer today" rows={cards} empty="No card worth $5 or more is under TCGplayer's market price in a US store today." />}

      {others.map((m) => (
        <section key={m} id={m.toLowerCase()} className="flex scroll-mt-20 flex-col gap-4">
          <h2 className="text-2xl font-bold">{EVENT_NAME[event]} deals in {ADJ[m]} stores</h2>
          <UnderStores title={`Sealed product under other ${ADJ[m]} stores`} rows={storeDealsIn(m, 12, "sealed")} m={m} />
          {!SITE.sealedOnly && <UnderStores title={`Cards under other ${ADJ[m]} stores`} rows={storeDealsIn(m, 12, "card")} m={m} />}
        </section>
      ))}

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

function Section({ title, rows, empty }: { title: string; rows: Deal[]; empty: string }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">{title}</h2>
      {!rows.length ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr><th className="py-1 pr-3">Product</th><th className="py-1 pr-3 text-right">TCGplayer market</th><th className="py-1 pr-3 text-right">Store price</th><th className="py-1 pr-3">Store</th><th className="py-1 text-right">Under market</th></tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.p.id} className="border-t border-ink-800">
                  <td className="py-1.5 pr-3"><Link className="hover:underline" href={`/card/${d.p.slug}`}>{shortName(d.p.name)}</Link></td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{money(d.market)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums font-semibold">{money(d.offer.cents, d.offer.currency)}</td>
                  <td className="py-1.5 pr-3">{sourceNameServer(d.offer)}</td>
                  <td className="py-1.5 text-right tabular-nums text-up">{d.saving}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


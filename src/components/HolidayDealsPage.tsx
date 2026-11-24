import type { Metadata } from "next";
import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { meta } from "@/lib/data";
import { CyberWeekendNote } from "@/components/CyberWeekendNote";
import { TcgplayerCyberBanner } from "@/components/TcgplayerCyberBanner";
import { goHref } from "@/lib/affiliate";
import { tcgplayerSlugOf } from "@/lib/lines";
import { SaleDeals } from "@/components/SaleDeals";
import { SaleNav } from "@/components/SaleNav";
import { saleDealRows } from "@/lib/sale-deals-data";
import { cyberWeekendState } from "@/lib/cyber-weekend";
import { DaysUntil } from "@/components/DaysUntil";
import { blackFriday, cyberMonday, daysLabel, daysUntil, EVENT_NAME, holidayFaq, longDate, seasonYear, type HolidayEvent } from "@/lib/black-friday";
import { listRegions } from "@/lib/sale-seasons";
import { FamilyCluster } from "@/components/FamilyCluster";
import { IN } from "@/components/SaleSeasonPage";
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
  const page = event;
  // ONE deal list (owner's review, 2026-11-24): the cheapest in-stock store price per product and country, with its saving under
  // TCGplayer's market price (US) and under the middle of the stores (every country); lib/sale-deals*.ts, components/SaleDeals.tsx.
  const rows = saleDealRows(page);
  const us = rows.filter((r) => r.market === "US");
  const best = Math.max(0, ...us.map((r) => Math.max(r.tcg?.pct ?? 0, r.median?.pct ?? 0)));
  const nowDay = new Date().toISOString().slice(0, 10);

  return (
    <article className="flex max-w-5xl flex-col gap-6">
      <header>
        <p className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="tag">Black Friday · {longDate(bf)} · <DaysUntil target={bf} initial={daysLabel(daysUntil(nowDay, bf))} /></span>
          <span className="tag">Cyber Monday · {longDate(cm)} · <DaysUntil target={cm} initial={daysLabel(daysUntil(nowDay, cm))} /></span>
        </p>
        <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">{SITE.gameShort} {EVENT_NAME[event]} deals {year}</h1>
        <p className="mt-2 max-w-3xl text-muted">
          {us.length ? `${us.length} US deals today, up to ${best}% off` : "Store prices under the going price"}, from {SITE.stores.length.toLocaleString("en-US")} stores{asOf ? `, updated ${asOf}` : ""}.
          {before ? " Stores often start their sales early, so the deals show up here first." : ""}{" "}
          <a href="#how-we-calculate" className="link">How we calculate</a>
        </p>
        <p className="mt-1 text-xs text-muted">Store buttons and eBay links are paid links: we may earn a commission, at no cost to you.</p>
      </header>

      <SaleNav
        page={page}
        items={[
          { id: "deals", label: "Deals" },
          { id: "tcgplayer-sale", label: "TCGplayer sale" },
          { id: "how-we-calculate", label: "How we calculate" },
          { id: "questions", label: "Questions" },
        ]}
      />

      <section id="deals" aria-labelledby="deals-h" className="scroll-mt-28">
        <h2 id="deals-h" className="sr-only">{EVENT_NAME[event]} deals</h2>
        {rows.length ? (
          <SaleDeals rows={rows} siteKey={SITE.key} discordHref={SITE.discordInvite ?? null} page={page} email={!!SITE.priceAlerts} />
        ) : (
          <p className="text-sm text-muted">No product is under TCGplayer&apos;s market price or the other stores&apos; middle price today. This fills in as stores cut prices.</p>
        )}
      </section>

      <section id="tcgplayer-sale" aria-label="TCGplayer's Cyber Weekend sale" className="flex scroll-mt-28 flex-col gap-3">
        <CyberWeekendNote initial={cyberWeekendState(Date.now())} />
        <TcgplayerCyberBanner
          href={goHref({ url: `https://www.tcgplayer.com/search/${tcgplayerSlugOf(null)}/product?productLineName=${tcgplayerSlugOf(null)}&ProductTypeName=Sealed+Products`, source: "tcgplayer", market: "US" }, undefined, "cyber_banner")}
          at={Date.now()}
        />
      </section>
      <FamilyCluster cluster="cards" kind="deal" />
      <section id="how-we-calculate" className="card-surface flex scroll-mt-28 flex-col gap-2 p-4 text-sm">
        <h2 className="text-lg font-bold">How we calculate</h2>
        <p>Each row is the cheapest in-stock store price we found for that product in that country (stores only, never eBay or Amazon), and both savings are measured against that one price. &ldquo;Under TCGplayer&rdquo; is 8% to 60% under TCGplayer&apos;s market price, for US products worth $5 or more, in US dollars on both sides.{others.length ? " \u201cUnder other stores today\u201d is at least 10% under the middle price of three or more stores in the same country, in its own currency, never converted." : ""}</p>
        <p>We only see what a store asks when we read its prices, so a sale can start or end between reads; a row read more than 12 hours ago says so. Shipping is the store&apos;s own where we have read it. Always check the price on the store&apos;s page before you buy.</p>
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

      <section id="questions" className="flex scroll-mt-28 flex-col gap-3">
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


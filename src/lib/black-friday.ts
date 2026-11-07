// The Black Friday page (/black-friday): its dates and what it lists. Pure: tests/black-friday.test.ts.
//
// WHAT IT LISTS, AND WHAT IT NEVER SAYS. Today's in-stock store prices under TCGplayer's market price
// (the same deals() the homepage and the Deal Finder use), sealed first, then cards, stores only (eBay and Amazon are never a store). Never a "was"
// price, a countdown, "ends soon" or "limited time": stores set their own sales, and we only know
// what they asked when the prices were last read. The page is always there (one URL that gathers
// links year after year); the homepage links it only in season.

/** Black Friday: the day after the fourth Thursday of November (US Thanksgiving), YYYY-MM-DD. */
export function blackFriday(year: number): string {
  const first = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const firstThursday = 1 + ((4 - first + 7) % 7);
  return `${year}-11-${String(firstThursday + 22).padStart(2, "0")}`;
}

/** Cyber Monday: three days after Black Friday. */
export function cyberMonday(year: number): string {
  return addDays(blackFriday(year), 3);
}

/** The season the page is about: this year's, or next year's once a week past Cyber Monday. */
export function seasonYear(today: string): number {
  const y = Number(today.slice(0, 4));
  return today > addDays(cyberMonday(y), 7) ? y + 1 : y;
}

/** Whether the homepage links the page: 1 November to a week after Cyber Monday. */
export function inSeason(today: string): boolean {
  const y = Number(today.slice(0, 4));
  return today >= `${y}-11-01` && today <= addDays(cyberMonday(y), 7);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "Friday 27 November" */
export function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

/** Split ranked deals into sealed and cards, one row per product (its best saving). */
export function splitDeals<T extends { p: { id: number; kind: string } }>(list: T[], perKind = 24): { sealed: T[]; cards: T[] } {
  const seen = new Set<number>();
  const sealed: T[] = [];
  const cards: T[] = [];
  for (const d of list) {
    if (seen.has(d.p.id)) continue;
    seen.add(d.p.id);
    const into = d.p.kind === "sealed" ? sealed : cards;
    if (into.length < perKind) into.push(d);
  }
  return { sealed, cards };
}

export type HolidayEvent = "black-friday" | "cyber-monday";

/** "Black Friday" / "Cyber Monday" */
export const EVENT_NAME: Record<HolidayEvent, string> = { "black-friday": "Black Friday", "cyber-monday": "Cyber Monday" };

/**
 * The one-line strip under the header on every page, and the nav link beside it (DECISIONS.md, "Black Friday
 * strip", 2026-11-07): Black Friday from 1 November to the Saturday after it, then Cyber Monday to the day
 * after Cyber Monday, then nothing (the homepage keeps linking both until a week after). A link in the server
 * HTML, never a pop-up, a countdown or "ends soon".
 */
export function saleStrip(today: string): { event: HolidayEvent; href: string; name: string } | null {
  const y = Number(today.slice(0, 4));
  const bf = blackFriday(y);
  if (today < `${y}-11-01`) return null;
  if (today <= addDays(bf, 1)) return { event: "black-friday", href: "/black-friday", name: "Black Friday" };
  if (today <= addDays(cyberMonday(y), 1)) return { event: "cyber-monday", href: "/cyber-monday", name: "Cyber Monday" };
  return null;
}

/** The questions both holiday pages answer in visible text: the dates, where the prices come from, and how to use the page. */
export function holidayFaq(event: HolidayEvent, year: number, o: { game: string; stores: number; regions: string }): { q: string; a: string }[] {
  const bf = longDate(blackFriday(year));
  const cm = longDate(cyberMonday(year));
  const name = EVENT_NAME[event];
  return [
    {
      q: `When is ${name} ${year}?`,
      a: event === "black-friday"
        ? `Black Friday ${year} is ${bf}, the day after US Thanksgiving. Cyber Monday follows on ${cm}. Many stores start their sales the week before and run them through the weekend.`
        : `Cyber Monday ${year} is ${cm}, the Monday after Black Friday (${bf}). Online stores often run their Black Friday prices through the weekend and end them on Cyber Monday night.`,
    },
    {
      q: `Do ${o.game} stores have ${name} sales?`,
      a: `Some do, some don't, and some sell under the market price all year. That is why this page lists prices, not promises: every row is a real in-stock price from one of the ${o.stores} stores we compare across ${o.regions}, read that day.`,
    },
    {
      q: "Are these prices shown before or after shipping?",
      a: "Item prices, before shipping. A cheap price at a store with expensive postage can still lose, so open the product page to compare every store side by side, and check the store's own page before you buy.",
    },
    {
      q: "How often does this page update?",
      a: "Every day, from that day's store prices, through the sales and after them. Bookmark it: the URL stays the same every year.",
    },
  ];
}

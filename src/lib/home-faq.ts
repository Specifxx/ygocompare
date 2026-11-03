// The homepage FAQ (SEO report, 2026-11-03). The four engine sites answered the
// same four questions in the same words; now each site leads with its own game's
// questions (SITE.home.faqs), then questions answered from its own live data (the
// newest set's most valuable cards, this week's risers, the next release), then
// the engine's four. The live answers are real prices from data/, recomputed with
// the page (revalidate 21600), so no two sites can read alike.
import { SITE } from "@/site.config";
import { byValue, latestReleasedSet, movers, productsInSet, refCents } from "./data";
import { preorderSetList } from "./hubs";
import { money } from "./format";
import { shortName } from "./names";
import { isPreorder, longDate } from "./preorders";

export interface Faq {
  q: string;
  a: string;
}

type Named = { name: string; number?: string | null };
const label = (p: Named) => `${shortName(p.name)}${p.number ? ` (${p.number})` : ""}`;

/** "A, B and C". */
export function joinList(parts: string[]): string {
  return parts.length < 2 ? (parts[0] ?? "") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** Questions answered from today's data; a question with too little data to answer is left out. */
export function liveFaqs(): Faq[] {
  const out: Faq[] = [];
  const latest = latestReleasedSet();
  if (latest) {
    const top = byValue(productsInSet(latest.id).filter((p) => p.kind === "card" && (refCents(p.id) ?? 0) > 0)).slice(0, 3);
    if (top.length === 3) {
      const [first, ...rest] = top;
      out.push({
        q: `What is the most valuable card in ${latest.name}?`,
        a: `Right now it is ${label(first)}, at about ${money(refCents(first.id))} on TCGplayer's market price. Next come ${joinList(rest.map((p) => `${label(p)} at ${money(refCents(p.id))}`))}. Prices move every day; the ${latest.name} set page lists every card from the most valuable down.`,
      });
    }
  }
  // A thin market can jump 2,000% on one sale: only rises up to 200% on things worth $5 or more read as news.
  const up = movers(7, 500).up.filter((m) => m.change <= 200).slice(0, 3);
  if (up.length === 3) {
    out.push({
      q: `Which ${SITE.gameShort} cards went up in price this week?`,
      a: `The biggest risers over the last 7 days, among cards and sealed products worth $5 or more: ${joinList(up.map((m) => `${label(m.p)} (up ${Math.round(m.change)}%, now ${money(m.cents)})`))}. The movers page has the full list, fallers included.`,
    });
  }
  // The release the homepage hero links (a real set with sealed product listed, never a promo group).
  const next = preorderSetList().find((s) => isPreorder(s));
  if (next?.releasedOn) {
    out.push({
      q: `When does ${next.name} come out?`,
      a: `${next.name} is due on ${longDate(next.releasedOn)}. Its pre-order page compares every store that has listed its sealed product so far.`,
    });
  }
  return out;
}

/** The engine's own four, last. */
function engineFaqs(storeCount: number): Faq[] {
  return [
    { q: `What is ${SITE.name}?`, a: `${SITE.name} is a free ${SITE.game} price comparison site. It compares prices for every ${SITE.gameShort} card and sealed product across TCGplayer, eBay and ${storeCount} online game stores in the US, UK, Canada, Australia and Europe, and updates them every day.` },
    { q: `Where is the cheapest place to buy ${SITE.gameShort} cards?`, a: `It changes card by card. Search a card on ${SITE.name} to see every store's price for it, cheapest in-stock first, in your own currency, with a direct link to buy.` },
    { q: `How often are ${SITE.gameShort} prices updated?`, a: `Every day. TCGplayer prices and store listings refresh daily; eBay listings for cards worth $${SITE.ebay.minPriceUsd} or more are re-checked every one to four days depending on value and demand.` },
    { q: `Is ${SITE.name} free?`, a: `Yes, completely, and you don't need an account. ${SITE.name} is paid for by affiliate commissions: when you buy through some links, the store may pay us a small fee at no cost to you.` },
  ];
}

/** The homepage FAQ, in order: this game's own questions, the live ones, the engine's. */
export function homeFaqs(storeCount: number): Faq[] {
  return [...(SITE.home?.faqs ?? []), ...liveFaqs(), ...engineFaqs(storeCount)];
}

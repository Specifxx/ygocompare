// The product page's "Is it worth it?" section, written from this product's own data (2026-11-23, SEO quality pass).
//
// WHY: a live audit of the sitemap's product pages (23 Nov 2026, 24 random pages per site, 5-word shingles shared by
// more than a fifth of the sample counted as template) found a median of 57 words of a page's own on YGO Compare, 69 on
// TCG Prices and 83 on Gundam Compare kits, against 650 on DexCompare. The old section was ONE sentence with the name
// and a price slotted in: the same paragraph on every page, the shape Google's scaled-content guidance warns about.
//
// WHAT THIS DOES: it emits observations that exist only because of what this product's data says, choosing each
// sentence's FORM from the data (not shuffled synonyms), in four families:
//   1. Where to buy: each market's in-stock store count, cheapest and dearest, what the gap saves, and (in US dollars
//      only, never converted) how the cheapest store compares with TCGplayer's market price.
//   2. Stock depth: one store versus many, listed but sold out, pre-orders only.
//   3. Price trajectory: TCGplayer's market price since we started recording, the tracked low and high with dates,
//      where today sits between them.
//   4. Set context: release date and age, the product's rank among the set's sealed products, and how many of the set's
//      cheapest pack this product costs (a price ratio, never a claim about what is inside the box).
// HARD RULES: nothing is asserted without data on this render to back it; no currency conversion; eBay, TCGplayer and
// Amazon rows are never counted as stores; a product with little data gets one short paragraph, not padding.
// Pure (no imports from the data layer) so the same file serves every site that copies it; pinned by
// tests/buyer-read.test.ts.

export type BuyerMarket = "US" | "UK" | "CA" | "AU" | "EU" | "SG" | string;

export interface BuyerOffer {
  source: string;
  market: BuyerMarket;
  currency: string;
  cents: number;
  inStock: boolean;
  preorder?: boolean;
}

export interface BuyerSibling {
  name: string;
  sealedType: string | null;
  refCents: number | null;
}

export interface BuyerReadInput {
  name: string;
  /** "Booster Box", "Booster Pack"…, null for a single card. */
  sealedType: string | null;
  /** TCGplayer market price, US cents. */
  refCents: number | null;
  /** TCGplayer's lowest listing, US cents, when it has one. */
  tcgLowCents?: number | null;
  /** TCGplayer market price history: [day since 1970, US cents], change-only points, oldest first. */
  history: [number, number][];
  /** The import's own last day (days since 1970). */
  today: number;
  offers: BuyerOffer[];
  storeName: (o: BuyerOffer) => string;
  set: { name: string; releasedOn: string | null; upcoming: boolean } | null;
  /** The OTHER sealed products of the same set, with their TCGplayer market price. */
  siblings: BuyerSibling[];
  money: (cents: number, currency?: string) => string;
  /** Markets in the order the site lists them (the US first). */
  marketOrder: BuyerMarket[];
  marketName: (m: BuyerMarket) => string;
  /** What `history` is, in a sentence ("TCGplayer's market price" by default; a kit page passes its cheapest US shop price,
   *  and then today's value is the series' last point rather than `refCents`). */
  historyLabel?: string;
  /** false on a site that never shows an eBay price (TCG Prices, 2026-11-14). */
  ebayPrices?: boolean;
}

const NOT_STORES = new Set(["ebay", "tcgplayer", "amazon"]);
const DAY_MS = 86_400_000;

function dayLabel(day: number): string {
  return new Date(day * DAY_MS).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
function isoDay(iso: string): number | null {
  const t = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isFinite(t) ? Math.floor(t / DAY_MS) : null;
}
function pctOf(a: number, b: number): number {
  return Math.round(((a - b) / b) * 100);
}
function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
}
function age(days: number): string {
  if (days < 45) return `${plural(Math.max(1, Math.round(days / 7)), "week")}`;
  if (days < 730) return `${plural(Math.round(days / 30.4), "month")}`;
  const y = days / 365;
  return y >= 5 ? `${Math.round(y)} years` : `${y.toFixed(1).replace(/\.0$/, "")} years`;
}

interface MarketRead {
  market: BuyerMarket;
  currency: string;
  inStock: BuyerOffer[]; // cheapest first, one per store
  preorders: number;
  listed: number;
}

/** One row per store per market: its cheapest in-stock (or, failing that, any) offer. */
function readMarkets(i: BuyerReadInput): MarketRead[] {
  const by = new Map<BuyerMarket, BuyerOffer[]>();
  for (const o of i.offers) {
    if (NOT_STORES.has(o.source)) continue;
    const list = by.get(o.market) ?? [];
    list.push(o);
    by.set(o.market, list);
  }
  const out: MarketRead[] = [];
  const order = [...i.marketOrder, ...[...by.keys()].filter((m) => !i.marketOrder.includes(m))];
  for (const m of order) {
    const list = by.get(m);
    if (!list?.length) continue;
    const stores = new Map<string, BuyerOffer>();
    for (const o of list) {
      const prev = stores.get(o.source);
      const live = o.inStock && !o.preorder;
      const prevLive = prev ? prev.inStock && !prev.preorder : false;
      if (!prev || (live && !prevLive) || (live === prevLive && o.cents < prev.cents)) stores.set(o.source, o);
    }
    const rows = [...stores.values()];
    const inStock = rows.filter((o) => o.inStock && !o.preorder).sort((a, b) => a.cents - b.cents);
    out.push({ market: m, currency: inStock[0]?.currency ?? rows[0].currency, inStock, preorders: rows.filter((o) => o.preorder).length, listed: rows.length });
  }
  return out;
}

/** Where to buy and how deep the stock is (families 1 and 2). */
function whereToBuy(i: BuyerReadInput, markets: MarketRead[]): string[] {
  const out: string[] = [];
  const live = markets.filter((m) => m.inStock.length > 0);
  const [lead, ...rest] = live;
  if (lead) {
    const lo = lead.inStock[0];
    const hi = lead.inStock[lead.inStock.length - 1];
    const where = `in ${i.marketName(lead.market)}`;
    let s: string;
    if (lead.inStock.length === 1) {
      s = `Only one store we track has ${i.name} in stock ${where}: ${i.storeName(lo)} at ${i.money(lo.cents, lo.currency)}.`;
      const out1 = lead.listed - 1;
      if (out1 > 0) s += ` ${plural(out1, "other store")} list${out1 === 1 ? "s" : ""} it but ${out1 === 1 ? "is" : "are"} sold out or taking pre-orders, so a single restock or sell-out moves the cheapest price.`;
    } else {
      const gap = hi.cents - lo.cents;
      s = `${plural(lead.inStock.length, "store")} have ${i.name} in stock ${where}, from ${i.money(lo.cents, lo.currency)} at ${i.storeName(lo)} to ${i.money(hi.cents, hi.currency)} at ${i.storeName(hi)}.`;
      if (gap > 0 && hi.cents > 0) {
        const p = Math.round((gap / hi.cents) * 100);
        s += p >= 15
          ? ` That is a ${p}% spread: buying from the cheapest saves ${i.money(gap, lo.currency)} on the same product.`
          : ` The spread is only ${p}% (${i.money(gap, lo.currency)}), so delivery cost and speed matter more than which store you pick.`;
      }
      const second = lead.inStock[1];
      if (lead.inStock.length >= 3 && second && second.cents - lo.cents > 0 && pctOf(second.cents, lo.cents) >= 10) {
        s += ` The next cheapest, ${i.storeName(second)}, is ${pctOf(second.cents, lo.cents)}% dearer, so the lowest price depends on one store's stock.`;
      }
    }
    // TCGplayer's market price is in US dollars: compare only a US-dollar store price, never a converted one.
    if (i.refCents && lo.currency === "USD") {
      const d = pctOf(lo.cents, i.refCents);
      if (d <= -5) s += ` The cheapest is ${-d}% under TCGplayer's market price of ${i.money(i.refCents)}.`;
      else if (d >= 5) s += ` Every store here is above TCGplayer's market price of ${i.money(i.refCents)} (the cheapest by ${d}%), so TCGplayer's own sellers are worth checking.`;
      else s += ` That is within 5% of TCGplayer's market price of ${i.money(i.refCents)}, a fair price for it today.`;
    }
    out.push(s);
  }
  if (rest.length) {
    const parts = rest.map((m) => `${i.marketName(m.market)} ${m.inStock.length === 1 ? `has 1 store at ${i.money(m.inStock[0].cents, m.currency)}` : `has ${m.inStock.length} stores from ${i.money(m.inStock[0].cents, m.currency)}`}`);
    out.push(`Outside ${i.marketName(lead!.market)}, ${parts.join("; ")}, each in its own currency.`);
  }
  const soldOut = markets.filter((m) => m.inStock.length === 0 && m.listed > 0);
  if (!lead && soldOut.length) {
    const listed = soldOut.reduce((n, m) => n + m.listed, 0);
    const pre = soldOut.reduce((n, m) => n + m.preorders, 0);
    out.push(pre > 0
      ? `No store we track has ${i.name} in stock right now; ${plural(pre, "store")} ${pre === 1 ? "is" : "are"} taking pre-orders${listed > pre ? ` and ${plural(listed - pre, "more")} list${listed - pre === 1 ? "s" : ""} it as sold out` : ""}. A price alert is the quickest way to hear when one restocks.`
      : `${plural(listed, "store")} list${listed === 1 ? "s" : ""} ${i.name}, but none has it in stock right now. A price alert is the quickest way to hear when one restocks.`);
  }
  return out;
}

/** The marketplaces beside the stores: TCGplayer's lowest listing and eBay's cheapest Buy It Now, never counted as stores. */
function marketplaces(i: BuyerReadInput, markets: MarketRead[]): string | null {
  const usStore = markets.find((m) => m.market === "US")?.inStock[0];
  const ebay = i.ebayPrices === false ? undefined : i.offers.filter((o) => o.source === "ebay" && o.inStock && o.currency === "USD").sort((a, b) => a.cents - b.cents)[0];
  const parts: string[] = [];
  if (i.tcgLowCents && i.refCents && i.tcgLowCents < i.refCents * 0.97) {
    parts.push(`TCGplayer's lowest listing is ${i.money(i.tcgLowCents)}, ${pctOf(i.refCents, i.tcgLowCents)}% under its market price, which is what recent sales averaged`);
  }
  if (ebay) {
    const vs = usStore ? ` (${Math.abs(pctOf(ebay.cents, usStore.cents))}% ${ebay.cents <= usStore.cents ? "under" : "over"} the cheapest US store)` : "";
    parts.push(`the cheapest US eBay Buy It Now we found is ${i.money(ebay.cents)}${vs}`);
  }
  if (!parts.length) return null;
  const s = parts.join("; ");
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
}

/** TCGplayer's market price since we started recording (family 3). */
function trajectory(i: BuyerReadInput): string | null {
  const h = i.history.filter(([, c]) => c > 0);
  const label = i.historyLabel ?? "TCGplayer's market price";
  const now = i.historyLabel ? h[h.length - 1]?.[1] : i.refCents;
  if (h.length < 2 || !now) return null;
  const first = h[0];
  const span = i.today - first[0];
  if (span < 14) return null;
  let lo = h[0];
  let hi = h[0];
  for (const p of h) {
    if (p[1] < lo[1]) lo = p;
    if (p[1] > hi[1]) hi = p;
  }
  const change = pctOf(now, first[1]);
  const since = `since ${dayLabel(first[0])}, when we started recording it`;
  let s =
    Math.abs(change) < 3
      ? `${label.charAt(0).toUpperCase()}${label.slice(1)} has held steady ${since}: ${i.money(first[1])} then, ${i.money(now)} now.`
      : `${label.charAt(0).toUpperCase()}${label.slice(1)} is ${change > 0 ? "up" : "down"} ${Math.abs(change)}% ${since}, from ${i.money(first[1])} to ${i.money(now)}.`;
  if (hi[1] > lo[1] && pctOf(hi[1], lo[1]) >= 5) {
    s += ` Its tracked range is ${i.money(lo[1])} (${dayLabel(lo[0])}) to ${i.money(hi[1])} (${dayLabel(hi[0])}).`;
    const pos = (now - lo[1]) / (hi[1] - lo[1]);
    if (now <= lo[1] * 1.03) s += " Today's price is at the bottom of that range.";
    else if (now >= hi[1] * 0.97) s += " Today's price is at the top of that range, so waiting for a dip is reasonable if you are not in a hurry.";
    else s += ` Today's price sits ${Math.round(pos * 100)}% of the way from the low to the high.`;
  }
  return s;
}

const PACK = /booster pack|^pack$|blister|sleeved booster/i;

/** Release and the set's other sealed products (family 4). */
function setContext(i: BuyerReadInput): string | null {
  if (!i.set) return null;
  const parts: string[] = [];
  const rel = i.set.releasedOn ? isoDay(i.set.releasedOn) : null;
  if (i.set.upcoming) {
    parts.push(`${i.set.name} is not out yet${rel ? `; it is due on ${dayLabel(rel)}` : ""}, so every store price is a pre-order and can change before release.`);
  } else if (rel != null && i.today - rel >= 0) {
    parts.push(`${i.set.name} came out on ${dayLabel(rel)}, ${age(i.today - rel)} ago.`);
  }
  if (i.refCents) {
    const priced = i.siblings.filter((s) => s.refCents && s.refCents > 0);
    if (priced.length >= 2) {
      const rank = priced.filter((s) => (s.refCents ?? 0) > i.refCents!).length + 1;
      const total = priced.length + 1;
      parts.push(rank === 1
        ? `It is the most valuable of the ${total} sealed ${i.set.name} products with a TCGplayer price.`
        : `It is the ${ordinal(rank)} most valuable of the ${total} sealed ${i.set.name} products with a TCGplayer price.`);
    }
    if (i.sealedType && !PACK.test(i.sealedType)) {
      const packs = priced.filter((s) => PACK.test(s.sealedType ?? "") || /booster pack/i.test(s.name)).sort((a, b) => (a.refCents ?? 0) - (b.refCents ?? 0));
      const pack = packs[0];
      if (pack?.refCents && i.refCents > pack.refCents * 1.5) {
        const n = i.refCents / pack.refCents;
        parts.push(`At TCGplayer's prices it costs as much as ${n >= 10 ? Math.round(n) : n.toFixed(1)} of the set's cheapest pack (${pack.name}, ${i.money(pack.refCents)}); check what it contains to see whether it beats buying packs one at a time.`);
      }
    }
  }
  return parts.length ? parts.join(" ") : null;
}

/** The section's paragraphs, each backed by this render's data. Empty when there is nothing true to say. */
export function buyerRead(i: BuyerReadInput): string[] {
  const markets = readMarkets(i);
  const out = whereToBuy(i, markets);
  const mp = marketplaces(i, markets);
  if (mp) out.push(mp);
  const t = trajectory(i);
  if (t) out.push(t);
  const c = setContext(i);
  if (c) out.push(c);
  if (!out.length && i.refCents) out.push(`${i.name} sells for about ${i.money(i.refCents)} on TCGplayer. No store we track lists it yet.`);
  return out;
}

// ─── The set page's "<set> prices at a glance", from the set's own products (2026-11-23) ───────────────────────────────

export interface SetReadProduct {
  name: string;
  sealedType: string | null;
  /** TCGplayer market price, US cents. */
  refCents: number | null;
  /** 30-day change of that price, percent. */
  change30d: number | null;
  /** Cheapest in-stock store price per market (never eBay, TCGplayer or Amazon). */
  best: { market: BuyerMarket; currency: string; cents: number }[];
  /** Stores that have it in stock, all markets. */
  inStockStores: number;
}

export interface SetReadInput {
  name: string;
  releasedOn: string | null;
  upcoming: boolean;
  today: number;
  products: SetReadProduct[];
  money: (cents: number, currency?: string) => string;
  marketName: (m: BuyerMarket) => string;
}

/** Paragraphs about the set's prices, each backed by its products' data; empty when there is nothing true to say. */
export function setRead(i: SetReadInput): string[] {
  const out: string[] = [];
  const n = i.products.length;
  if (!n) return out;
  const priced = i.products.filter((p) => p.refCents && p.refCents > 0).sort((a, b) => b.refCents! - a.refCents!);
  const rel = i.releasedOn ? isoDay(i.releasedOn) : null;
  const when = i.upcoming
    ? `${i.name} is not out yet${rel ? ` (due ${dayLabel(rel)})` : ""}, so every store price here is a pre-order.`
    : rel != null && i.today >= rel ? `${i.name} came out on ${dayLabel(rel)}, ${age(i.today - rel)} ago.` : "";
  if (priced.length >= 2) {
    const top = priced[0];
    const low = priced[priced.length - 1];
    out.push(`${when ? `${when} ` : ""}We track ${plural(n, "sealed product")} from it; ${priced.length === n ? (n === 2 ? "both" : `all ${n}`) : priced.length} have a TCGplayer market price, from ${i.money(low.refCents!)} for the ${low.name} to ${i.money(top.refCents!)} for the ${top.name}.`);
  } else if (when) {
    out.push(`${when} We track ${plural(n, "sealed product")} from it.`);
  }
  const usInStock = i.products.filter((p) => p.best.some((b) => b.market === "US"));
  const deep = [...i.products].sort((a, b) => b.inStockStores - a.inStockStores)[0];
  const parts: string[] = [];
  if (usInStock.length) parts.push(`${usInStock.length} of the ${n} ${usInStock.length === 1 ? "is" : "are"} in stock at a US store today`);
  else if (!i.upcoming) parts.push(n === 2 ? "neither is in stock at a US store today" : `none of the ${n} is in stock at a US store today`);
  if (deep && deep.inStockStores >= 2) parts.push(`the ${deep.name} has the widest choice, with ${plural(deep.inStockStores, "store")} in stock across our markets`);
  if (parts.length) out.push(`${parts.join("; ").replace(/^./, (c) => c.toUpperCase())}.`);
  // Store price against TCGplayer, US dollars only: how many products a store sells under TCGplayer's market price.
  const cmp = i.products.filter((p) => p.refCents && p.best.some((b) => b.market === "US" && b.currency === "USD"));
  if (cmp.length >= 2) {
    const under = cmp.filter((p) => p.best.find((b) => b.market === "US")!.cents < p.refCents!).sort((a, b) => {
      const da = a.best.find((x) => x.market === "US")!.cents / a.refCents!;
      const db = b.best.find((x) => x.market === "US")!.cents / b.refCents!;
      return da - db;
    });
    const best = under[0];
    out.push(under.length
      ? `${under.length} of the ${cmp.length} with both prices can be bought from a US store under TCGplayer's market price; the biggest gap is the ${best.name}, ${-pctOf(best.best.find((b) => b.market === "US")!.cents, best.refCents!)}% under at ${i.money(best.best.find((b) => b.market === "US")!.cents)}.`
      : `None of the ${cmp.length} with both prices is cheaper at a US store than TCGplayer's market price today.`);
  }
  const moved = i.products.filter((p) => p.change30d != null && p.refCents && Math.abs(p.change30d) >= 5).sort((a, b) => Math.abs(b.change30d!) - Math.abs(a.change30d!));
  if (moved.length) {
    const m = moved[0];
    const rest = moved.length - 1;
    out.push(`The biggest move over 30 days is the ${m.name}, ${m.change30d! > 0 ? "up" : "down"} ${Math.abs(Math.round(m.change30d!))}% to ${i.money(m.refCents!)}${rest ? `; ${plural(rest, "other product")} moved 5% or more` : ""}.`);
  }
  const pack = priced.filter((p) => PACK.test(p.sealedType ?? "") || /booster pack/i.test(p.name)).sort((a, b) => a.refCents! - b.refCents!)[0];
  const box = priced.find((p) => /booster box|display/i.test(`${p.sealedType ?? ""} ${p.name}`) && !/case/i.test(`${p.sealedType ?? ""} ${p.name}`));
  if (pack && box && box.refCents! > pack.refCents! * 1.5) {
    const r = box.refCents! / pack.refCents!;
    out.push(`On TCGplayer the ${box.name} costs as much as ${r >= 10 ? Math.round(r) : r.toFixed(1)} of the ${pack.name} (${i.money(pack.refCents!)} each).`);
  }
  return out;
}

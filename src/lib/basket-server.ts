// BEST BASKET ON YGO COMPARE (owner, 2026-11-25: "have it on all the sites as premium"). The visitor's shortlist products, priced at
// every store that has them in their market, split across stores for the lowest delivered total: RiftCompare's solver
// (lib/basket-optimize.ts, a straight port, as on DexCompare and MTG Compare) over this site's own offers and the store shipping the
// sister sites MEASURED (lib/borrowed-shipping.ts). DECISIONS.md, 2026-11-25.
//
// The rows a basket may use are Rift's rules after Rob's Sprite Fountain report (TCGEmpire #653):
//   • in stock, from a store the import read in the last BASKET_ROW_MAX_AGE_H hours (meta.stores[key].at is its last good read;
//     a failed read keeps the old rows, never those);
//   • never a pre-order (an unreleased set's product, an offer flagged pre-order, or "pre-order" in its title or link);
//   • never a marketplace (TCGplayer, eBay, Amazon): a basket is stores, each with its own checkout;
//   • only stores with a measured rate in that market: an unmeasured store's postage would be a guess, so it is left out and
//     counted, never priced at zero.
// Postage is the store's measured figure for an order of that subtotal at the DEAREST address, "up to" when addresses differ or the
// order holds more than one item (single-item carts are what is measured).
import fs from "node:fs";
import path from "node:path";
import { planBasket, type BasketCard, type BasketListing, type BasketResult, type BasketStores } from "./basket-optimize";
import type { PostageCart, PostageQuote } from "./postage";
import { EMPTY_BORROWED, validBorrowed, type BorrowedShipping, type StoreShipping } from "./borrowed-shipping";
import { quoteAt, type ShipQuote } from "./shipping-quote";
import { meta, priceOf, productBySlug, setById } from "./data";
import { isPreorder } from "./preorders";
import { goHref } from "./affiliate";
import type { Market, Offer } from "./site-types";
import { SITE } from "@/site.config";

export const BASKET_ROW_MAX_AGE_H = 48;
export const BASKET_MAX_LINES = 30;
export const BASKET_MAX_QTY = 20;

const PREORDER = /\bpre[-\s]?orders?\b/i;
const MARKETPLACE = /^(ebay|tcgplayer|amazon)/;

export interface BasketRequestLine {
  slug: string;
  qty: number;
}

/** The request's lines, cleaned: known slug shape, 1..BASKET_MAX_QTY each, one line per product, at most BASKET_MAX_LINES. */
export function cleanLines(raw: unknown): BasketRequestLine[] {
  if (!Array.isArray(raw)) return [];
  const out = new Map<string, number>();
  for (const l of raw) {
    const slug = typeof l?.slug === "string" ? l.slug.trim().toLowerCase() : "";
    if (!/^[a-z0-9][a-z0-9-]{0,199}$/.test(slug)) continue;
    const qty = Math.min(BASKET_MAX_QTY, Math.max(1, Math.floor(Number(l?.qty) || 1)));
    out.set(slug, Math.max(out.get(slug) ?? 0, qty));
    if (out.size >= BASKET_MAX_LINES) break;
  }
  return [...out].map(([slug, qty]) => ({ slug, qty }));
}

let cached: BorrowedShipping | null = null;
function shipping(): BorrowedShipping {
  if (cached) return cached;
  try {
    cached = validBorrowed(JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/shipping/borrowed.json"), "utf8")));
  } catch {
    cached = EMPTY_BORROWED;
  }
  return cached;
}

/** A store's measured postage for a basket order, or null when no sister measured it in this market. */
export function measuredPostage(storeKey: string, market: string, snap: BorrowedShipping = shipping()): ((cart: PostageCart) => PostageQuote) | null {
  const s: StoreShipping | undefined = snap.stores[storeKey];
  if (!s || s.market !== market) return null;
  const ids = (snap.addresses[market] ?? []).map((a) => a.id);
  const addressIds = ids.length ? ids : [...new Set(s.points.flatMap((p) => Object.keys(p.rates)))];
  const lowest = s.points.reduce((m, p) => Math.min(m, p.subtotalCents), Infinity);
  const quote = (cents: number): ShipQuote | null => quoteAt(s, addressIds, cents);
  if (!Number.isFinite(lowest) || !quote(lowest)) return null;
  return (cart) => {
    // Under the store's cheapest measured item there is nothing to read from: its cheapest measured cart's figure stands in, as an
    // estimate (a smaller order rarely posts dearer).
    const exact = quote(cart.subtotalCents);
    const q = (exact ?? quote(lowest))!;
    return {
      cents: q.maxCents,
      label: q.maxCents === 0 ? "Free shipping" : "Measured shipping",
      tracked: null,
      basis: exact ? "measured" : "estimate",
      free: q.maxCents === 0,
      upTo: q.minCents !== q.maxCents,
      ...(q.freeAtCents != null && q.freeAtCents > cart.subtotalCents ? { freeFromCents: q.freeAtCents } : {}),
      ...(cart.items > 1 && q.maxCents > 0 ? { beyondMeasured: true } : {}),
      measuredAt: q.measuredAt.slice(0, 10),
    };
  };
}

/** The product's offers a basket may use in this market (rules at the top), cheapest per store. */
export function basketListings(
  offers: Offer[],
  market: Market,
  storesRead: Record<string, { at?: string } | undefined>,
  preorderProduct: boolean,
  now = Date.now(),
): BasketListing[] {
  if (preorderProduct) return [];
  const best = new Map<string, BasketListing>();
  for (const o of offers) {
    if (o.market !== market || MARKETPLACE.test(o.source) || !o.inStock || o.preorder || !(o.cents > 0)) continue;
    const at = Date.parse(storesRead[o.source]?.at ?? "");
    if (!Number.isFinite(at) || now - at > BASKET_ROW_MAX_AGE_H * 3_600_000) continue;
    if (PREORDER.test(o.title) || PREORDER.test(o.url)) continue;
    const cur = best.get(o.source);
    if (!cur || o.cents < cur.priceCents) best.set(o.source, { retailer: o.source, priceCents: o.cents, url: o.url, condition: null });
  }
  return [...best.values()];
}

/** Store entries for every store the cards list: measured postage, or left out with the reason. */
export function basketStores(cards: BasketCard[], market: string, postageFor: (key: string, market: string) => ((cart: PostageCart) => PostageQuote) | null = measuredPostage): BasketStores {
  const names = new Map(SITE.stores.map((s) => [s.key, s.name]));
  const stores: BasketStores = {};
  for (const c of cards) {
    for (const l of c.listings) {
      if (stores[l.retailer]) continue;
      const name = names.get(l.retailer) ?? l.retailer;
      const postage = postageFor(l.retailer, market);
      stores[l.retailer] = postage
        ? { name, postage }
        : { name, postage: () => ({ cents: 0, label: "", tracked: null, basis: "estimate", free: false, upTo: false }), unavailable: "We haven't measured its shipping yet" };
    }
  }
  return stores;
}

export interface LoadedBasket {
  result: BasketResult;
  missing: string[];
  products: { slug: string; name: string; image: string | null; qty: number }[];
}

export function loadBasket(lines: BasketRequestLine[], market: Market, now = Date.now()): LoadedBasket {
  const read = meta()?.stores ?? {};
  const cards: BasketCard[] = [];
  const missing: string[] = [];
  const products: LoadedBasket["products"] = [];
  for (const l of lines) {
    const p = productBySlug(l.slug);
    if (!p || p.kind !== "sealed") {
      missing.push(l.slug);
      continue;
    }
    const set = setById(p.setId);
    const offers = priceOf(p.id).offers;
    products.push({ slug: p.slug, name: p.name, image: p.image, qty: l.qty });
    cards.push({ cardId: String(p.id), name: p.name, slug: p.slug, qty: l.qty, listings: basketListings(offers, market, read, !!set && isPreorder(set), now) });
  }
  const result = planBasket(cards, basketStores(cards, market), {
    // The row's own /go link (logs the click, tags the store, opens its checkout where the variant is known).
    link: (url, key) => goHref({ url, source: key, market, inStock: true }, undefined, "best-basket"),
  });
  return { result, missing, products };
}

/** What a visitor without Premium sees: the delivered total and what splitting saves, never the store-by-store plan. */
export function basketSummary(b: LoadedBasket) {
  const p = b.result.plan;
  return {
    totalCents: p.totalCents,
    itemsCents: p.itemsCents,
    shippingCents: p.shippingCents,
    storeCount: p.storeCount,
    naiveTotalCents: p.naiveTotalCents,
    savedCents: p.savedCents,
    matchedCards: p.matchedCards,
    coveredCopies: p.coveredCopies,
    unbuyable: p.unbuyable,
    estimated: p.stores.some((s) => s.postage.basis === "estimate" || s.postage.beyondMeasured || s.postage.upTo),
  };
}

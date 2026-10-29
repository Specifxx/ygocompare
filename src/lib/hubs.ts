// Crawlable hub pages: one per card rarity (/cards/rarity/<slug>) and one per
// sealed product type (/sealed/<type>). Only hubs with products exist, so the
// sitemap never lists an empty page.
import { SITE } from "@/site.config";
import type { Product } from "@/lib/site-types";
import { byValue, products, productsInSet, refCents, setById, sets } from "@/lib/data";
import { preorderSets, todayIso } from "@/lib/preorders";
import { slugify } from "@/lib/slug";

// "LR+" and "LR++" must not share a slug.
const raritySlug = (r: string) => slugify(r.replace(/\+/g, " plus "));

export const SEALED_ORDER = ["Booster Box", "Case", "Illumineer's Trove", "Booster Pack", "Sleeved Pack", "Starter Deck", "Structure Deck", "Tin", "Special Edition", "Collection", "Prerelease", "Deck", "Other"];
export const SEALED_PLURAL: Record<string, string> = { "Booster Box": "Booster boxes", Case: "Cases", "Illumineer's Trove": "Illumineer's Troves", "Booster Pack": "Booster packs", "Sleeved Pack": "Sleeved packs", "Starter Deck": "Starter decks", "Structure Deck": "Structure decks", Tin: "Tins", "Special Edition": "Special editions", Collection: "Collections and gift sets", Prerelease: "Prerelease kits", Deck: "Decks", Other: "Other sealed" };

export interface Hub { slug: string; label: string; items: Product[] }

export function rarityHubs(): Hub[] {
  const cards = products().filter((p) => p.kind === "card" && p.rarity);
  const names = [...new Set(cards.map((p) => p.rarity!))];
  const rank = (r: string) => { const i = SITE.rarityOrder.indexOf(r); return i < 0 ? 99 : i; };
  return names
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((r) => ({ slug: raritySlug(r), label: r, items: byValue(cards.filter((p) => p.rarity === r)) }))
    .filter((h) => h.slug && h.items.length);
}

export function sealedHubs(): Hub[] {
  const sealed = products().filter((p) => p.kind === "sealed");
  return SEALED_ORDER.filter((t) => t !== "Other")
    .map((t) => ({ slug: slugify(t), label: SEALED_PLURAL[t] ?? t, items: byValue(sealed.filter((p) => p.sealedType === t)) }))
    .filter((h) => h.items.length);
}

export const rarityHref = (r: string | null) => (r ? `/cards/rarity/${raritySlug(r)}` : null);
export const sealedHref = (t: string | null) => (t && t !== "Other" && t !== "Insert" ? `/sealed/${slugify(t)}` : null);

// The homepage's sealed shelf: booster boxes from the newest released sets
// first, then other headline sealed (troves, tins, collections, decks) to fill
// the row. Priced products only; never cases, loose packs, inserts or pre-orders
// (the pre-order banner has those).
const SHELF_FILL = ["Illumineer's Trove", "Special Edition", "Tin", "Collection", "Structure Deck", "Starter Deck", "Sleeved Pack", "Booster Pack"];
export function featuredSealed(limit = 6): Product[] {
  const released = (p: Product) => { const s = setById(p.setId); return s && !s.upcoming ? s.releasedOn ?? "" : null; };
  const pool = products().filter((p) => p.kind === "sealed" && released(p) !== null && refCents(p.id) != null);
  const newest = (a: Product, b: Product) => released(b)!.localeCompare(released(a)!) || (refCents(b.id) ?? 0) - (refCents(a.id) ?? 0);
  const boxes = pool.filter((p) => p.sealedType === "Booster Box").sort(newest);
  const rank = (p: Product) => SHELF_FILL.indexOf(p.sealedType ?? "");
  const fill = pool.filter((p) => rank(p) >= 0).sort((a, b) => newest(a, b) || rank(a) - rank(b));
  return [...boxes, ...fill].slice(0, limit);
}

/** A set's sealed products, booster boxes first (SEALED_ORDER), Inserts left out. */
export function sealedInSet(setId: number): Product[] {
  const rank = (t: string | null) => {
    const i = SEALED_ORDER.indexOf(t ?? "Other");
    return i < 0 ? SEALED_ORDER.length : i;
  };
  return byValue(productsInSet(setId).filter((p) => p.kind === "sealed" && p.sealedType !== "Insert")).sort((a, b) => rank(a.sealedType) - rank(b.sealedType));
}

/** The releases with a pre-order page (lib/preorders.ts), soonest first. */
export const preorderSetList = (today = todayIso()) =>
  preorderSets(sets(), (s) => { const list = sealedInSet(s.id); return { products: list.length, boxes: list.filter((p) => p.sealedType === "Booster Box").length }; }, today);

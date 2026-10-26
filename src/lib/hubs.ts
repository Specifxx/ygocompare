// Crawlable hub pages: one per card rarity (/cards/rarity/<slug>) and one per
// sealed product type (/sealed/<type>). Only hubs with products exist, so the
// sitemap never lists an empty page.
import { SITE } from "@/site.config";
import type { Product } from "@/lib/site-types";
import { byValue, products } from "@/lib/data";
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

// Types shared by the engine and src/site.config.ts.

export type Market = "US" | "UK" | "CA" | "AU" | "EU" | "SG";
export const MARKETS: Market[] = ["US", "UK", "CA", "AU", "EU", "SG"];
export const CURRENCY: Record<Market, string> = {
  US: "USD",
  UK: "GBP",
  CA: "CAD",
  AU: "AUD",
  EU: "EUR",
  SG: "SGD",
};
export const MARKET_LABEL: Record<Market, string> = {
  US: "United States",
  UK: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  EU: "Europe",
  SG: "Singapore",
};

export interface StoreConfig {
  key: string;
  name: string;
  /** Origin, no trailing slash. */
  base: string;
  market: Market;
  /** Shopify collection handles that hold this game's products. */
  collections: string[];
  kind: "singles" | "sealed" | "both";
  /** Shopify Markets country to request prices in (defaults from market). */
  country?: string;
}

export interface SisterSite {
  name: string;
  url: string;
  game: string;
  /** Link text: what a searcher types ("Riftbound card prices"), the site's
   *  name after it. Without one the name is the link. */
  anchor?: string;
  /** The sister site's own search for a query, `{q}` replaced by it (its
   *  SearchAction target). Card games only: the "Searching another game?"
   *  line under /cards search results (components/FamilySearch.tsx). */
  search?: string;
}

export interface SiteConfig {
  key: string;
  name: string;
  shortName: string;
  wordmark: [string, string];
  game: string;
  gameShort: string;
  domain: string;
  /** Serve and link the bare domain (no `www.`); the default is www. */
  apexHost?: boolean;
  tagline: string;
  description: string;
  keywords: string[];
  /** Hard-coded admins (owner request). ADMIN_EMAILS env adds to it. */
  adminEmails: string[];
  /** Public contact address, shown on the site. */
  supportEmail: string;
  /** Private: where the ops monitor and form notifications go. Never rendered. */
  ownerEmail: string;
  /** Impact (affiliate network) site-verification id, rendered in every page's <head>. */
  impactSiteVerification?: string;
  tcgcsvCategoryId: number;
  tcgplayerSlug: string;
  ebay: {
    query: string;
    singlesCategoryId: string;
    sealedCategoryId: string;
    /** Never spend a call on a CARD the market prices under this (USD). Sealed is always eligible. */
    minPriceUsd: number;
    /** This site's share of the eBay app's daily Browse quota. */
    dailyBudget: number;
    runHourUtc: number;
  };
  /** "fraction" 42/204 (Lorcana), "code" GD02-048 (Gundam), "ygo" LOB-EN005
   *  (set code, language, number; the language is part of the key). */
  numberStyle: "fraction" | "code" | "ygo";
  /** "name" (default): the first product of a name keeps the bare slug.
   *  "name-number": every card's slug carries its number ("dark-magician-lob-en005"),
   *  for games that reprint one card in dozens of sets. Slugs are decided
   *  from the whole TCGplayer listing, before any catalogue floor, so they
   *  never change when a card crosses it. */
  slugStyle?: "name" | "name-number";
  /** Leave out cards (never sealed) whose every TCGplayer price is under
   *  this many US cents, except in sets released in the last 120 days.
   *  For games with tens of thousands of printings (data size, build size). */
  catalogMinCardCents?: number;
  /** Cards under this TCGplayer price (US cents) stay out of the sitemap but
   *  remain crawlable through set pages. Default 50. A new domain with tens of
   *  thousands of card URLs gets few of them crawled; this points Google at
   *  the ones people search for. */
  sitemapMinCardCents?: number;
  /** TCGplayer extended fields shown on card pages, besides the engine's own. */
  extraAttrs?: string[];
  /** Game-specific sealed types, checked before the engine's defaults.
   *  Return "Insert" for anything that isn't sealed product (accessories). */
  sealedTypes?: [RegExp, string][];
  /** A store or eBay title that names a rarity must name the product's own
   *  (games where one card number exists in several rarities). */
  rarityMustAgree?: boolean;
  /** Extra ways sellers write a rarity: { "Quarter Century Secret Rare": ["QCSR", "QCScR"] }. */
  rarityAliases?: Record<string, string[]>;
  /** Markets outside the US where TCGplayer Direct ships this game's singles
   *  (the TCGplayer ad strip says so there). Off by default: say nothing we
   *  have not checked. TCGplayer Direct: AU since 2026-10-07 for Magic,
   *  Pokémon and Yu-Gi-Oh! singles. */
  tcgplayerDirectMarkets?: Market[];
  rarityOrder: string[];
  chaseRarities: string[];
  theme: {
    brand: string;
    brandLight: string;
    brandDark: string;
    accent: string;
    pageDark: string;
    /** ink-950 … ink-600, darkest first. */
    inkDark: [string, string, string, string, string, string];
    wordmarkGradient: string;
    /** Google Fonts family for headings, e.g. "Cinzel". */
    displayFont: string;
  };
  halloween: { headline: string; blurb: string };
  stores: StoreConfig[];
  sisterSites: SisterSite[];
  social: { reddit?: string; discord?: string };
  /** A model-kit section (/kits, /kit/<slug>), off unless set: plastic model
   *  kits compared across hobby shops by their JAN barcode (lib/kits.ts,
   *  scripts/import-kits.ts). Gundam Compare's Gunpla. */
  kits?: KitsConfig;
}

export interface KitsConfig {
  /** Nav and heading word: "Gunpla". */
  label: string;
  /** What the section is, in a sentence's middle: "Gunpla model kits". */
  noun: string;
  /** The kits' maker, for structured data and the disclaimer: "Bandai Spirits". */
  maker: string;
  /** JAN prefixes the maker's kits carry (Bandai: 4573102, 4549660, 4543112). */
  janPrefixes: string[];
  /** The JAN prefix the maker's own item numbers map to (lib/import/kits.ts
   *  janFromItemCode), so a shop that keys kits by item number still matches.
   *  Bandai Spirits: "4573102". */
  itemCodeJanPrefix?: string;
  /** eBay and Amazon search words put before a kit's name ("gunpla"). */
  searchPrefix: string;
  /** The section's link preview (a 2400×1260 file under public/), so a shared
   *  /kits link shows kits, not the card site. Unset: the site's image. */
  shareImage?: { url: string; alt: string };
  stores: KitStoreConfig[];
}

export interface KitStoreConfig {
  key: string;
  name: string;
  base: string;
  market: Market;
  /** Shopify collection handles holding the kits; for a Neto store, its
   *  category paths ("model-building/gundam-plastic-models/high-grade"). */
  collections: string[];
  country?: string;
  /** The shop's platform: Shopify (the default) or Neto/Maropost, read from
   *  its public category pages (lib/import/kits-neto.ts). */
  platform?: "shopify" | "neto";
}

// ── Pre-order pages (src/content/preorders.ts) ──────────────────────────────

export interface QA { q: string; a: string }

/** One release's copy for /preorders/<set slug>. Facts only from a dated source; anything unsure is left out. */
export interface PreorderSetCopy {
  /** HTML intro under the heading; a plain generated line when unset. */
  intro?: string;
  facts: { label: string; value: string }[];
  faq: QA[];
}

export interface PreorderCopy {
  /** The /preorders hub's intro (HTML). */
  intro: string;
  /** The hub's FAQ: questions about pre-ordering in general. */
  faq: QA[];
  /** Per release, keyed by the set's slug. A set without copy still gets a page from its data. */
  sets: Record<string, PreorderSetCopy>;
}

// ── Public data (data/public/*.json) ────────────────────────────────────────

export interface SetInfo {
  id: number; // TCGplayer groupId
  name: string;
  code: string; // abbreviation or slug
  slug: string;
  releasedOn: string | null; // ISO date
  productCount: number;
  upcoming: boolean;
}

export interface Product {
  id: number; // TCGplayer productId
  slug: string;
  name: string;
  kind: "card" | "sealed";
  setId: number;
  number: string | null;
  rarity: string | null;
  /** Extended fields worth showing (ink colour, type, cost…). */
  attrs: Record<string, string>;
  sealedType: string | null;
  image: string | null;
  tcgUrl: string;
  printings: string[];
}

export interface Offer {
  source: string; // store key, "ebay" or "tcgplayer"
  market: Market;
  currency: string;
  cents: number;
  inStock: boolean;
  url: string;
  title: string;
  printing?: string; // "Foil", "Normal"…
  preorder?: boolean;
  shippingCents?: number | null;
}

export interface TcgPrice {
  market: number | null; // USD cents
  low: number | null;
  mid: number | null;
}

export interface PriceEntry {
  tcg: Record<string, TcgPrice>; // by printing
  offers: Offer[];
  /** 7-day change of the reference price, percent. */
  change7d: number | null;
  change30d: number | null;
}

export interface Catalog {
  generatedAt: string;
  sets: SetInfo[];
  products: Product[];
}

export interface Prices {
  generatedAt: string;
  byId: Record<string, PriceEntry>;
}

export interface StoreStatus {
  ok: boolean;
  products: number;
  matched: number;
  at: string;
  error?: string;
}

export interface Meta {
  updatedAt: string;
  fx: Record<string, number>; // 1 USD = x currency
  stores: Record<string, StoreStatus>;
  ebay: { day: string; calls: number; budget: number; eligible: number; refreshed: number; at: string } | null;
  counts: { cards: number; sealed: number; offers: number; sets: number };
}

export interface EbayPick {
  productId: number;
  name: string;
  image: string | null;
  cents: number;
  currency: string;
  url: string;
  title: string;
  marketCents: number | null;
}

// ── Model kits (data/public/kits/*.json) ─────────────────────────────────────

export interface Kit {
  /** The JAN (EAN-13) barcode, the one key every store shares. */
  jan: string;
  slug: string;
  name: string;
  /** "HG", "RG", "MG", "PG", "EG", "SD", "MGSD", "MGEX", "RE/100", "FM", or null. */
  grade: string | null;
  /** "1/144", "1/100", "1/60", or null. */
  scale: string | null;
  image: string | null;
  /** First day any store listed it (ISO date). */
  firstSeen: string;
}


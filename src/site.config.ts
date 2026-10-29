// The ONE game-specific configuration file. YGO Compare, Lorcana Compare and
// Gundam Compare run the same engine (the Rift Compare playbook, rebuilt
// lean); everything that differs between them — names, colours, data sources,
// stores, copy — lives here or in src/content/. Keep engine code free of game
// names.
import type { SiteConfig } from "@/lib/site-types";
import { STORES } from "@/content/stores";

export const SITE: SiteConfig = {
  key: "ygo",
  name: "YGO Compare",
  shortName: "YGOCompare",
  wordmark: ["YGO", "COMPARE"],
  game: "Yu-Gi-Oh! TCG",
  gameShort: "Yu-Gi-Oh!",
  domain: "ygocompare.com",
  // The bare domain is the address (owner, 2026-10-26: ygocompare.com).
  apexHost: true,
  tagline: "Compare Yu-Gi-Oh! card prices across every store",
  description:
    "Free Yu-Gi-Oh! price comparison: live prices for Yu-Gi-Oh! TCG cards, 1st Editions and booster boxes across TCGplayer, eBay and game stores in the US, UK, Canada and Australia.",
  keywords: [
    "yugioh card prices",
    "yu-gi-oh card prices",
    "yugioh price guide",
    "yugioh booster box price",
    "yugioh card value",
    "quarter century secret rare prices",
  ],
  adminEmails: ["bill.jyang101@gmail.com"],
  supportEmail: "riftcompare@gmail.com",
  ownerEmail: "bill.jyang101@gmail.com",
  impactSiteVerification: "3c00a442-a61e-4003-a422-540b7435b80d",

  tcgcsvCategoryId: 2,
  tcgplayerSlug: "yugioh",
  ebay: {
    // The card number ("RA01-EN008") or the product name is specific enough;
    // sellers spell the game "Yu-Gi-Oh!", "Yugioh" and "YGO", so no game word.
    query: "",
    singlesCategoryId: "183454",
    sealedCategoryId: "183456",
    // Yu-Gi-Oh! has thousands of $10 cards: only $20+ cards get a call (every
    // sealed product does), so the 1,500 calls reach the cards buyers check.
    minPriceUsd: 20,
    // One eBay app, three sites (4,500 of its 5,000 a day): Lorcana 1,150,
    // Gundam 1,150, YGO 2,200 (2026-10-28; 1,500 each from the owner's
    // 2026-10-26 split, but Gundam and Lorcana spent ~1,000 a day covering every
    // eligible product while YGO's 3,400 eligible products hit the cap). Never
    // raise one without lowering another by the same amount.
    dailyBudget: 2200,
    // Lorcana runs at 06 UTC and Gundam at 18 UTC on the same app; eBay's
    // day resets at midnight Pacific, so each eBay day holds one run of each.
    runHourUtc: 12,
  },

  // "LOB-EN005": set code, language, number. One number can exist in several
  // rarities (Rarity Collection, Quarter Century reprints), so titles that
  // name a rarity must name the product's own.
  numberStyle: "ygo",
  slugStyle: "name-number",
  rarityMustAgree: true,
  rarityAliases: {
    "Quarter Century Secret Rare": ["QCSR", "QCScR", "QCSCR", "Quarter Century Secret", "25th Secret Rare", "Quarter Century Rare"],
    "Starlight Rare": ["StR", "STR"],
    "Prismatic Secret Rare": ["PScR", "PSCR", "Prismatic Secret"],
    "Platinum Secret Rare": ["PlScR", "PLSCR", "Platinum Secret"],
    "Collector's Rare": ["Collectors Rare", "Collector’s Rare", "CR", "CoR"],
    "Prismatic Collector's Rare": ["PCR", "Prismatic Collectors Rare", "Prismatic Collector’s Rare"],
    "Prismatic Ultimate Rare": ["PUR"],
    "Grand Master Rare": ["GMR"],
    "Secret Pharaoh’s Rare": ["Secret Pharaoh's Rare", "Secret Pharaohs Rare"],
    "Ultra Pharaoh’s Rare": ["Ultra Pharaoh's Rare", "Ultra Pharaohs Rare"],
    "Ghost Rare": ["GR"],
    // Sellers often drop "Rare": "Black Rose Dragon - 1st Edition - Ultra". The
    // bare words are case-sensitive and the card's own name is removed first,
    // so "Ultimate Conductor Tyranno" is not read as a rarity.
    "Ultimate Rare": ["UtR", "UTR", "Ultimate"],
    "Secret Rare": ["ScR", "SCR", "Secret"],
    "Ultra Rare": ["UR", "Ultra"],
    "Super Rare": ["SR", "Super"],
  },
  // Tens of thousands of printings, most of them worth cents: cards under $1
  // in every printing stay out (except in new sets). Keeps the data, the
  // build and every server function small.
  catalogMinCardCents: 100,
  // The sitemap lists cards from $5 (about 6,100 of 14,000; 2026-10-28: 28 of
  // 31 sampled URLs were unknown to Google from a 16,191-URL sitemap). Cheaper
  // cards stay reachable through their set pages.
  sitemapMinCardCents: 500,
  extraAttrs: ["Attribute", "Card Type", "Monster Type", "MonsterType", "Attack", "Defense", "Link Rating", "LinkRating", "Rank", "Scale", "Pendulum Scale"],
  sealedTypes: [
    // Accessories TCGplayer lists beside the game: not sealed product.
    [/\b(sleeves?|playmat|game mat|duel(ist)? mat|deck box|deck case|binder|portfolio|card case|dice|field center|token pack|tokens?)\b/i, "Insert"],
    [/\bcase\b/i, "Case"],
    [/\bmega[- ]?tins?\b|\btins?\b/i, "Tin"],
    [/structure deck/i, "Structure Deck"],
    [/special edition/i, "Special Edition"],
    [/booster (box|display)|\bdisplay\b/i, "Booster Box"],
    [/booster pack|\bpack\b/i, "Booster Pack"],
    [/box set|collector'?s? (box|set)|collection|legendary decks?|gift/i, "Collection"],
  ],
  // Every rarity TCGplayer used for Yu-Gi-Oh! on 2026-10-26, rarest first.
  // TCGplayer Direct ships Yu-Gi-Oh! singles to Australia since 2026-10-07
  // (TCGplayer press release); the TCGplayer ad strip says so to AU visitors.
  tcgplayerDirectMarkets: ["AU"],
  rarityOrder: [
    "Quarter Century Secret Rare",
    "Grand Master Rare",
    "Starlight Rare",
    "Ghost Rare",
    "Platinum Secret Rare",
    "Prismatic Secret Rare",
    "Prismatic Collector's Rare",
    "Prismatic Ultimate Rare",
    "Collector's Rare",
    "Ultimate Rare",
    "Ghost/Gold Rare",
    "10000 Secret Rare",
    "Secret Pharaoh’s Rare",
    "Ultra Pharaoh’s Rare",
    "Emblazoned Secret Rare",
    "Emblazoned Ultra Rare",
    "Gold Secret Rare",
    "Premium Gold Rare",
    "Gold Rare",
    "Platinum Rare",
    "Secret Rare",
    "Ultra Rare",
    "Super Rare",
    "Mosaic Rare",
    "Starfoil Rare",
    "Shatterfoil Rare",
    "Parallel Rare",
    "Duel Terminal Ultra Parallel Rare",
    "Duel Terminal Super Parallel Rare",
    "Duel Terminal Rare Parallel Rare",
    "Duel Terminal Normal Parallel Rare",
    "Duel Terminal Technology Ultra Rare",
    "Duel Terminal Technology Common",
    "Rare",
    "Promo",
    "Common",
  ],
  chaseRarities: ["Quarter Century Secret Rare", "Grand Master Rare", "Starlight Rare", "Ghost Rare", "Platinum Secret Rare", "Prismatic Secret Rare", "Prismatic Collector's Rare", "Prismatic Ultimate Rare", "Collector's Rare", "Ultimate Rare"],

  theme: {
    brand: "#e8553d",
    brandLight: "#ff8a6b",
    brandDark: "#b8341f",
    accent: "#f2c14e",
    pageDark: "#0d0907",
    inkDark: ["#090605", "#120c0a", "#19110e", "#221813", "#3a2a21", "#574034"],
    wordmarkGradient: "linear-gradient(180deg, #fff1c9 0%, #f2c14e 50%, #c98a1b 100%)",
    displayFont: "Exo 2",
  },
  halloween: {
    headline: "Shadow Game: the Graveyard is open until 31 October",
    blurb: "Spooky season in the Shadow Realm: find the cheapest Zombie, Fiend and Ghost Rare cards before the clock strikes midnight.",
  },

  stores: STORES,
  // The whole Compare Empire family, card games first (2026-10-27, DECISIONS.md
  // "Every site links the whole family"). `anchor` is the link text.
  sisterSites: [
    { name: "Rift Compare", url: "https://riftcompare.com", game: "Riftbound", anchor: "Riftbound card prices", search: "https://riftcompare.com/browse?q={q}" },
    { name: "OP Compare", url: "https://opcompare.app", game: "One Piece", anchor: "One Piece card prices", search: "https://opcompare.app/browse?q={q}" },
    { name: "DexCompare", url: "https://dexcompare.app", game: "Pokémon", anchor: "Pokémon sealed prices", search: "https://dexcompare.app/us/sealed?q={q}" },
    { name: "MTG Compare", url: "https://mtgcompare.app", game: "Magic", anchor: "Magic: The Gathering sealed prices", search: "https://mtgcompare.app/us/sealed?q={q}" },
    { name: "Gundam Compare", url: "https://gundamcompare.com", game: "Gundam", anchor: "Gundam Card Game prices", search: "https://gundamcompare.com/cards?q={q}" },
    { name: "Lorcana Compare", url: "https://lorcanacompare.com", game: "Disney Lorcana", anchor: "Disney Lorcana card prices", search: "https://lorcanacompare.com/cards?q={q}" },
    { name: "WargameCompare", url: "https://wargamecompare.com", game: "Wargames", anchor: "Miniature wargame prices" },
    { name: "FigureCompare", url: "https://figurecompare.com", game: "Anime figures", anchor: "Anime figure prices" },
    { name: "CamCompare", url: "https://www.camcompare.app", game: "Cameras", anchor: "Camera and lens prices" },
    { name: "Compare Empire", url: "https://compareempire.com", game: "Australian tech", anchor: "Australian tech prices" },
  ],
  social: { reddit: "https://www.reddit.com/r/yugioh/" },
};

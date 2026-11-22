import { test } from "node:test";
import assert from "node:assert/strict";
import type { Product, SetInfo } from "@/lib/site-types";
import { buildIndex, leadingStrangerWords, looksLikeCard, matchCard, matchSealed, markersAgree, numbersInTitle, printingOf, strangerWords } from "@/lib/import/match";

const set = (id: number, name: string): SetInfo => ({ id, name, code: String(id), slug: name, releasedOn: "2026-01-01", productCount: 1, upcoming: false });
const card = (id: number, name: string, number: string, setId: number, rarity = "Rare"): Product => ({ id, slug: String(id), name, kind: "card", setId, number, rarity, attrs: {}, sealedType: null, image: null, tcgUrl: "", printings: [] });
const sealed = (id: number, name: string, setId: number): Product => ({ ...card(id, name, "", setId), kind: "sealed", number: null, sealedType: "x" });

const sets = [set(1, "The First Chapter"), set(2, "Hyperia City"), set(3, "Attack of the Vine!")];
const products = [
  card(10, "Elsa - Spirit of Winter", "42/204", 1, "Legendary"),
  card(11, "Elsa - Spirit of Winter (Enchanted)", "207/204", 1, "Enchanted"),
  card(12, "Fru Fru - VIP Guest", "1/204", 2, "Common"),
  card(13, "4*Town - Hottest Band of the Year", "17/204", 3),
  sealed(20, "Disney Lorcana: Hyperia City Booster Box", 2),
  sealed(21, "Disney Lorcana: Hyperia City Booster Box Case", 2),
  sealed(22, "Disney Lorcana: Into the Inkdark Collector Booster Display", 2),
  sealed(23, "Disney Lorcana: Hyperia City Booster Pack", 2),
];
const idx = buildIndex(products, sets, "fraction");

test("card by number and name", () => {
  assert.equal(matchCard("Elsa - Spirit of Winter (42/204) [The First Chapter]", idx)?.product.id, 10);
  assert.equal(matchCard("Elsa - Spirit of Winter - Enchanted - 207/204 - Holo Foil", idx)?.product.id, 11);
  assert.equal(matchCard("Shenzi - Hyena Pack Leader (85//204) [Into the Inklands]", idx), null);
});

test("never matches on number alone", () => {
  assert.equal(matchCard("Mickey Mouse - True Friend 42/204", idx), null);
});

test("bare number with the set in the product type", () => {
  assert.equal(matchCard("4*Town, Hottest Band of the Year (0017) - Cold Foil", idx, "Disney Lorcana Singles > Attack of the Vine!")?.product.id, 13);
  assert.equal(matchCard("4*Town, Hottest Band of the Year (0017)", idx, "Disney Lorcana Singles > Hyperia City"), null);
});

test("foreign-language product is never matched", () => {
  assert.equal(matchSealed("Lorcana - Hyperia City - Japanese Booster Box (16 Packs)", idx), null);
});

test("sealed: box vs case vs collector display", () => {
  assert.equal(matchSealed("Disney Lorcana: Hyperia City - Booster Box", idx)?.product.id, 20);
  assert.equal(matchSealed("Disney Lorcana: Hyperia City Booster Box Case (4 boxes)", idx)?.product.id, 21);
  assert.equal(matchSealed("Disney Lorcana - Into the Inkdark Booster Display - EN", idx), null);
});

test("sealed: a pack bundle is never one pack (live, 2026-10-27: Mad Merchant)", () => {
  assert.equal(matchSealed("Disney Lorcana: Hyperia City Booster Pack", idx)?.product.id, 23);
  assert.equal(matchSealed("Disney Lorcana Pack Bundle - Hyperia City", idx), null);
  assert.equal(matchSealed("Disney Lorcana: Hyperia City Booster Pack Bundle", idx), null);
});

test("variant markers", () => {
  assert.equal(markersAgree("Psycho Gundam (LR+)", "LR+", "Psycho Gundam GD02-012 Parallel"), true);
  assert.equal(markersAgree("Psycho Gundam", "Legend Rare", "Psycho Gundam GD02-012 Parallel"), false);
  assert.equal(markersAgree("Psycho Gundam (LR+)", "LR+", "Psycho Gundam GD02-012"), false);
  assert.equal(printingOf("Elsa - Cold Foil"), "Cold Foil");
  assert.equal(printingOf("Elsa", "Non-Foil"), "Normal");
});

test("set code / initials / bare-number-with-set-tag formats", () => {
  const s2 = [set(1, "The First Chapter"), set(3, "Attack of the Vine!")];
  s2[1].code = "13";
  s2[0].code = "1";
  const idx2 = buildIndex([card(30, "Ariel - On Human Legs", "1/204", 1), card(13, "4*Town - Hottest Band of the Year", "17/204", 3), card(31, "Ursula - Power Hungry", "59/204", 1)], s2, "fraction");
  assert.equal(matchCard("4*Town - Hottest Band of the Year (13-017) (Cold Foil)", idx2)?.product.id, 13);
  assert.equal(matchCard("Ariel - On Human Legs [TFC-1] NM / Normal", idx2)?.product.id, 30);
  assert.equal(matchCard("1TFC-059, L, Ursula - Power Hungry", idx2)?.product.id, 31);
  assert.equal(matchCard("Ariel - On Human Legs (1)", idx2, "Singles | 1 | Character | Lorcana")?.product.id, 30);
  assert.equal(matchCard("Ariel - On Human Legs (1)", idx2, "Singles | 13 | Character"), null);
});

test("every store request names the store's own country (Shopify Markets)", async () => {
  const { countryOf } = await import("@/lib/import/shopify");
  const base = { key: "x", name: "x", base: "https://x", collections: [], kind: "both" as const };
  assert.equal(countryOf({ ...base, market: "AU" }), "AU");
  assert.equal(countryOf({ ...base, market: "UK" }), "GB");
  assert.equal(countryOf({ ...base, market: "EU" }), "ES");
});

// ── Yu-Gi-Oh! ("ygo" numbers, rarity must agree, editions) ─────────────────
const ygoSets = [set(101, "Rarity Collection"), set(102, "Legend of Blue Eyes White Dragon"), set(103, "Maze of Millennia")];
const ygo = [
  card(200, "Ash Blossom & Joyous Spring (Quarter Century Secret Rare)", "RA01-EN008", 101, "Quarter Century Secret Rare"),
  card(201, "Ash Blossom & Joyous Spring (Super Rare)", "RA01-EN008", 101, "Super Rare"),
  card(202, "Ash Blossom & Joyous Spring (Platinum Secret Rare)", "RA01-EN008", 101, "Platinum Secret Rare"),
  card(203, "Blue-Eyes White Dragon", "LOB-001", 102, "Ultra Rare"),
  card(204, "Rare Metal Dragon", "MAZE-EN010", 103, "Rare"),
  card(205, "Blue-Eyes White Dragon", "LOB-E001", 102, "Ultra Rare"),
];
const yidx = buildIndex(ygo, ygoSets, "ygo", { rarityMustAgree: true, rarityAliases: { "Quarter Century Secret Rare": ["QCSR", "QCScR"], "Platinum Secret Rare": ["PlScR"] } });

test("ygo numbers: language is part of the key; other languages never match", () => {
  assert.deepEqual(numbersInTitle("Ash Blossom - RA01-EN008 - QCSR", "ygo"), ["RA01-EN008"]);
  assert.deepEqual(numbersInTitle("Blue-Eyes White Dragon LOB-001 Ultra Rare", "ygo"), ["LOB-001"]);
  assert.deepEqual(numbersInTitle("Dark Magician YGLD-ENA01", "ygo"), ["YGLD-ENA001"]);
  assert.deepEqual(numbersInTitle("Ash Blossom RA01-DE008", "ygo"), []);
  assert.deepEqual(numbersInTitle("Ash Blossom RA01-AE008", "ygo"), []);
  assert.deepEqual(numbersInTitle("Released 2026-11 in a 25-card box", "ygo"), []);
});

test("ygo: the rarity a title names picks the printing; none named between rarities is no match", () => {
  assert.equal(matchCard("Ash Blossom & Joyous Spring - RA01-EN008 - Quarter Century Secret Rare - 1st Edition", yidx)?.product.id, 200);
  assert.equal(matchCard("Ash Blossom & Joyous Spring [RA01-EN008] Super Rare", yidx)?.product.id, 201);
  assert.equal(matchCard("Ash Blossom & Joyous Spring (QCSR) RA01-EN008", yidx)?.product.id, 200);
  assert.equal(matchCard("Ash Blossom & Joyous Spring RA01-EN008 PlScR", yidx)?.product.id, 202);
  assert.equal(matchCard("Ash Blossom & Joyous Spring RA01-EN008", yidx), null);
  assert.equal(matchCard("Ash Blossom & Joyous Spring - RA01-EN008 - Secret Rare", yidx), null);
});

test("ygo: a card named like a rarity, and LOB-001 vs LOB-E001", () => {
  assert.equal(matchCard("Rare Metal Dragon - MAZE-EN010 - Rare - 1st Edition", yidx)?.product.id, 204);
  assert.equal(matchCard("Rare Metal Dragon - MAZE-EN010 - Ultra Rare", yidx), null);
  assert.equal(matchCard("Blue-Eyes White Dragon - LOB-001 - Ultra Rare - Unlimited", yidx)?.product.id, 203);
  assert.equal(matchCard("Blue-Eyes White Dragon - LOB-E001 - Ultra Rare", yidx)?.product.id, 205);
});

test("ygo editions: named edition, single printing, or unknown", () => {
  assert.equal(printingOf("Ash Blossom - RA01-EN008", "Near Mint 1st Edition", ["1st Edition"]), "1st Edition");
  assert.equal(printingOf("Blue-Eyes White Dragon - LOB-001 - Unlimited", "", ["1st Edition", "Unlimited"]), "Unlimited");
  assert.equal(printingOf("Blue-Eyes White Dragon - LOB-001", "Near Mint", ["1st Edition", "Unlimited"]), undefined);
  assert.equal(printingOf("Ash Blossom - RA01-EN008", "Near Mint", ["1st Edition"]), "1st Edition");
  assert.equal(printingOf("Ash Blossom - RA01-EN008 Unlimited", "", ["1st Edition"]), undefined);
  assert.equal(printingOf("Elsa - Spirit of Winter Holo Foil", "", ["Normal", "Foil"]), "Foil");
});

test("used, damaged and graded store listings are left out", async () => {
  const { isUnfitListing } = await import("@/lib/import/match");
  assert.equal(isUnfitListing("Yu-Gi-Oh Dark Crisis - Guardian Grarl - DCR-007 - Used Ultra Rare card"), true);
  assert.equal(isUnfitListing("2002 Yu-Gi-Oh! Magic Ruler 1st Edition #076 Toon World PSA 9"), true);
  assert.equal(isUnfitListing("Ash Blossom & Joyous Spring - RA01-EN008 - Quarter Century Secret Rare - 1st Edition"), false);
  assert.equal(isUnfitListing("Elsa - Spirit of Winter (42/204) [The First Chapter]"), false);
});

test("ygo: real store title formats from the 2026-10-26 probe", () => {
  const p = [
    card(300, "Swiftwind Panther Warrior (Super Rare)", "BETB-EN001", 103, "Super Rare"),
    card(301, "Swiftwind Panther Warrior (Starlight Rare)", "BETB-EN001", 103, "Starlight Rare"),
    card(302, "Garura, Wings of Resonant Life", "RA02-EN024", 101, "Ultra Rare"),
    card(303, "Garura, Wings of Resonant Life (Secret Rare)", "RA02-EN024", 101, "Secret Rare"),
    card(304, "Fiendsmith in Paradise", "INFO-EN072", 103, "Super Rare"),
  ];
  const i = buildIndex(p, ygoSets, "ygo", { rarityMustAgree: true, rarityAliases: { "Starlight Rare": ["StR"], "Ultra Rare": ["UR"], "Super Rare": ["SR"] } });
  assert.equal(matchCard("Swiftwind Panther Warrior (Starlight Rare) [BETB-EN001-StR]", i)?.product.id, 301);
  assert.equal(matchCard("Swiftwind Panther Warrior (Super Rare) [BETB-EN001-SuR]", i)?.product.id, 300);
  assert.equal(matchCard("Garura, Wings of Resonant Life (UR) [RA02 - RA02-EN024]", i)?.product.id, 302);
  assert.equal(matchCard("Fiendsmith in Paradise [INFO-EN072] Super Rare", i)?.product.id, 304);
  assert.equal(matchCard("Yu-Gi-Oh! Crackle Blitzclique CORI-EN012 1st Edition NM", i), null);
});

test("Japanese boxes and wrong set codes never match (Gundam Compare, live 2026-11-08)", async () => {
  const { handleOf, isForeign } = await import("@/lib/import/match");
  const gsets: SetInfo[] = [
    { ...set(24804, "Stardust Trails"), code: "GD06" },
    { ...set(24699, "Freedom Ascension"), code: "GD05" },
    { ...set(24767, "Deck Build Box Freedom Ascension"), code: "SC01" },
  ];
  const gidx = buildIndex(
    [sealed(710652, "Stardust Trails Booster Box", 24804), sealed(693621, "Freedom Ascension Booster Box", 24699), sealed(693625, "Freedom Ascension Deck Build Box", 24767)],
    gsets,
    "code",
  );
  // The Avid Collectors (SG): S$70 for the Japanese box on the English box's page.
  assert.equal(matchSealed("Gundam Card Game Booster Box Stardust Trails [GD06] JPN", gidx), null);
  assert.equal(matchSealed("Gundam Card Game Booster Box Stardust Trails (GD06) - Japanese", gidx), null);
  assert.equal(matchSealed("ガンダムカードゲーム ブースターパック Stardust Trails Booster Box", gidx), null);
  assert.ok(isForeign(handleOf("https://theavidcollectors.com/products/gundam-card-game-booster-box-stardust-trails-gd06-jpn?variant=46041928269960")));
  // A stale handle is read for the language only: these are real GD06 boxes, retitled copies of a GD05 listing.
  assert.equal(isForeign(handleOf("https://levelupgames.ca/products/gundam-freedom-ascension-booster-box-gd05-copy?variant=67970350645422")), false);
  assert.equal(isForeign(handleOf("https://northumbriantinsoldier.com/products/gundam-card-game-freedom-ascension-booster-box-gd05-1?variant=1")), false);
  // English boxes still match, with or without the code.
  assert.equal(matchSealed("Gundam Card Game GD06 Stardust Trails Booster Box", gidx)?.product.id, 710652);
  assert.equal(matchSealed("Gundam Card Game: Stardust Trails Booster Box (English)", gidx)?.product.id, 710652);
  assert.equal(matchSealed("Gundam Card Game - Stardust Trails Booster Box [GD-06]", gidx)?.product.id, 710652);
  // A title naming another set's code is no match.
  assert.equal(matchSealed("Gundam Card Game Stardust Trails Booster Box [GD05]", gidx), null);
  assert.equal(matchSealed("Gundam Freedom Ascension Booster Box GD06", gidx), null);
  // The deck build box carries its parent set's code.
  assert.equal(matchSealed("Gundam Freedom Ascension Deck Build Box [GD05]", gidx)?.product.id, 693625);
});

test("a single card filed under a pack's name is not the pack (live 2026-11-17, YGO Compare)", () => {
  for (const [title, handle] of [
    ["Axe of Fools (V.1 - Common) [Battle Pack 2: War of the Giants]", "axe of fools v 1 common battle pack 2 war of the giants common 161 262"],
    ["Photon Lizard (V.2 - Starfoil Rare)", "photon lizard v 2 starfoil rare star pack 2014 starfoil rare 006 26626"],
    ["Yazi, Evil of the Yang Zing MP15-EN163 Secret Rare", "yazi evil of the yang zing mp15 en163 secret rare"],
    ["Tribute Burial DPRP-EN010 Super Rare", "tribute burial dprp en010 super rare"],
  ]) assert.equal(looksLikeCard(title, handle), true, title);
  for (const title of ["Light of Destruction Booster Pack 1st Edition", "Maze of Muertos Booster Box 1st Edition", "Rage of the Abyss Special Edition Box"])
    assert.equal(looksLikeCard(title), false, title);
});

test("a singles store's card name in front of the product's is a stranger", () => {
  assert.equal(strangerWords("Vylon Stella - Battle Pack 2: War of the Giants", "Battle Pack 2: War of the Giants Booster Pack"), 2);
  assert.equal(strangerWords("Warrior Dai Grepher - Starter Deck: Yugi Evolution", "Yugi Evolution Starter Deck [Unlimited Edition]"), 3);
  assert.equal(strangerWords("Yu-Gi-Oh! Battle Pack 2: War of the Giants Booster Pack 1st Edition", "Battle Pack 2: War of the Giants Booster Pack"), 0);
});

test("a singles store's one-word card name in front of the product's is refused", () => {
  // Live 2026-11-18 (Mighty Cool Games, handles yubel-ra-yellow-mega-pack, steamroid-starter-deck-syrus-truesdale,
  // the-tricky-legendary-collection-3-yugis-world): one stranger word each, so strangerWords alone let them through.
  assert.equal(leadingStrangerWords("Yubel - Ra Yellow Mega-Pack", "Ra Yellow Mega-Pack Booster Pack"), 1);
  assert.equal(leadingStrangerWords("Steamroid - Starter Deck: Syrus Truesdale", "Syrus Truesdale Starter Deck [1st Edition]"), 1);
  assert.equal(leadingStrangerWords("The Tricky - Legendary Collection 3: Yugi's World", "Legendary Collection 3 - Yugi's World Box Set [1st Edition]"), 1);
  // Real product titles from singles stores in the same import open with the product's own name.
  for (const [title, name] of [
    ["Doom of Dimensions Sleeved Booster Pack DOOD", "Doom of Dimensions Sleeved Booster Pack"],
    ["Yu-Gi-Oh! Magnificent Maestros Box Display (10 Boxes)", "Magnificent Maestros Display"],
    ["Yu-Gi-Oh! Legendary Duelists: Duels From the Deep 1st Edition Booster Box", "Legendary Duelists: Duels From the Deep Booster Box [1st Edition]"],
    ["Maze of Muertos Booster Box 1st Edition", "Maze of Muertos Booster Box [1st Edition]"],
    ["Pre-Order Beyond the Brave Booster Box 1st Edition", "Beyond the Brave Booster Box [1st Edition]"],
  ]) assert.equal(leadingStrangerWords(title, name), 0, title);
});

test("a title naming a longer set is never the shorter set's product (live 2026-11-20, YGO Compare)", () => {
  const ysets = [
    set(2049, "Legendary Duelists"),
    set(23111, "Legendary Duelists: Soulburning Volcano"),
    set(2829, "Legendary Duelists: Synchro Storm"),
    set(1700, "Raging Tempest"),
    set(1701, "Raging Tempest: Special Edition"),
  ];
  const yidx = buildIndex(
    [
      sealed(144981, "Legendary Duelists Booster Box", 2049),
      sealed(144982, "Legendary Duelists Booster Pack", 2049),
      sealed(493307, "Legendary Duelists: Soulburning Volcano Booster Box [1st Edition]", 23111),
      sealed(240555, "Legendary Duelists: Synchro Storm Booster Pack [1st Edition]", 2829),
      sealed(129303, "Raging Tempest Special Edition Box", 1700),
    ],
    ysets,
    "ygo",
  );
  // Live: US$47 for a Soulburning Volcano box (no "1st Edition") on the US$213 Legendary Duelists box's page.
  assert.equal(matchSealed("Yu-Gi-Oh! Legendary Duelists 10: Soulburning Volcano Booster Box", yidx), null);
  assert.equal(matchSealed("Legendary Duelists: Synchro Storm Booster Pack", yidx), null);
  // The longer set's own product, and the plain set's, still match.
  assert.equal(matchSealed("Yu-Gi-Oh! Legendary Duelists: Soulburning Volcano Booster Box 1st Edition", yidx)?.product.id, 493307);
  assert.equal(matchSealed("Yu-Gi-Oh! Legendary Duelists Booster Box", yidx)?.product.id, 144981);
  // A product filed under the shorter set whose own name carries the longer set's words keeps its match.
  assert.equal(matchSealed("Yugioh Raging Tempest Special Edition Box", yidx)?.product.id, 129303);
  // Live 2026-11-21: a listing whose handle names the longer set is that set's, whatever its title says.
  assert.equal(matchSealed("Yu-Gi-Oh! Legendary Duelists Booster Pack", yidx, "yu gi oh soulburning volcano booster pack"), null);
  assert.equal(matchSealed("Yu-Gi-Oh! Legendary Duelists Booster Pack", yidx, "legendary duelists booster pack")?.product.id, 144982);
  assert.equal(matchSealed("Yu-Gi-Oh! Legendary Duelists: Soulburning Volcano Booster Box 1st Edition", yidx, "ld10 soulburning volcano box")?.product.id, 493307);
});

test("a single deck is never the deck display, and a tin's loose pack never the tin (live 2026-11-21, YGO Compare)", () => {
  const ysets = [set(3096, "Structure Deck: Legend of the Crystal Beasts"), set(3100, "2022 Tin of the Pharaoh's Gods")];
  const yidx = buildIndex(
    [
      sealed(275360, "Legend of the Crystal Beasts Structure Deck [1st Edition]", 3096),
      sealed(275361, "Legend of the Crystal Beasts Structure Deck Display", 3096),
      sealed(275402, "2022 Tin of the Pharaoh's Gods", 3100),
      sealed(275401, "2022 Tin of the Pharaoh's Gods Mega Pack", 3100),
    ],
    ysets,
    "ygo",
  );
  // Live: 47 single decks at US$8-15 on the US$29 display; with no edition named they are no match at all.
  assert.notEqual(matchSealed("Yu-Gi-Oh! Structure Deck: Legend of the Crystal Beasts", yidx)?.product.id, 275361);
  assert.notEqual(matchSealed("Legend of the Crystal Beasts Structure Deck", yidx)?.product.id, 275361);
  assert.equal(matchSealed("Legend of the Crystal Beasts Structure Deck Display", yidx)?.product.id, 275361);
  assert.equal(matchSealed("Yu-Gi-Oh! Legend of the Crystal Beasts Structure Deck 1st Edition", yidx)?.product.id, 275360);
  // Live: 401games' "yugioh-2022-tin-of-the-pharaohs-gods-booster-pack" at US$5.95 on the US$12 tin.
  assert.equal(matchSealed("Yugioh 2022 Tin of the Pharaoh's Gods", yidx, "yugioh 2022 tin of the pharaohs gods booster pack")?.product.id ?? null, null);
  assert.notEqual(matchSealed("2022 Tin of the Pharaoh's Gods Booster Pack", yidx)?.product.id, 275402);
  assert.equal(matchSealed("Yu-Gi-Oh! 2022 Tin of the Pharaoh's Gods", yidx, "yu-gi-oh-2022-tin-of-the-pharaohs-gods")?.product.id, 275402);
  assert.equal(matchSealed("2022 Tin of the Pharaoh's Gods (3 Mega Packs)", yidx)?.product.id, 275402);
});

test("Rarity Collection 2 is never the first one, a reprint never the original, a tin's single card never the tin (live 2026-11-22)", () => {
  const ysets = [
    set(23233, "25th Anniversary Rarity Collection"),
    set(23416, "25th Anniversary Rarity Collection II"),
    set(1304, "Anniversary Pack"),
    set(1462, "Structure Deck: Realm of Light"),
    set(24012, "Structure Deck: Realm of Light (2020 Date Reprint)"),
    set(1292, "Retro Pack 2"),
    set(24352, "Retro Pack 2 (2020 Date Reprint)"),
  ];
  const yidx = buildIndex(
    [
      sealed(501747, "25th Anniversary Rarity Collection Booster Pack", 23233),
      sealed(501748, "25th Anniversary Rarity Collection Booster Box", 23233),
      sealed(534532, "25th Anniversary Rarity Collection II Booster Box", 23416),
      sealed(534539, "25th Anniversary Rarity Collection II Booster Pack", 23416),
      sealed(272187, "Anniversary Pack", 1304),
      sealed(91027, "Realm of Light Structure Deck", 1462),
      sealed(607805, "Structure Deck: Realm of Light (2020 Date Reprint)", 24012),
      sealed(166470, "Retro Pack 2 Booster Pack", 1292),
    ],
    ysets,
    "ygo",
  );
  // Live: 31 stores' Rarity Collection 2 boxes and packs sat on the first Rarity Collection's pages.
  assert.equal(matchSealed("Yu-Gi-Oh! 25th Anniversary Rarity Collection 2 Booster Box", yidx)?.product.id, 534532);
  assert.equal(matchSealed("25th Anniversary Rarity Collection 2 Booster Pack 1st Edition", yidx)?.product.id, 534539);
  assert.equal(matchSealed("25th Anniversary Rarity Collection II Booster Pack", yidx)?.product.id, 534539);
  assert.equal(matchSealed("Yu-Gi-Oh! 25th Anniversary Rarity Collection Booster Box", yidx)?.product.id, 501748);
  // "2 Players" is a count, not a sequel.
  assert.equal(matchSealed("Yu-Gi-Oh! Trading Card Game 25th Anniversary Rarity Collection Booster Box - 24 Packs | Card Game, 2 Players", yidx)?.product.id, 501748);
  // Live: reprint decks at US$6.40 on the US$21 original, reprint Retro Pack 2 packs on the original's page.
  assert.notEqual(matchSealed("Yu-Gi-Oh! Realm of Light Structure Deck Reprint Unlimited Edition", yidx)?.product.id, 91027);
  assert.notEqual(matchSealed("Structure Deck: Realm of Light 2024 Reprint", yidx)?.product.id, 91027);
  assert.notEqual(matchSealed("Yu-Gi-Oh! Retro Pack 2 Booster Reprint Unlimited Edition", yidx)?.product.id, 166470);
  assert.equal(matchSealed("Yu-Gi-Oh! Realm of Light Structure Deck", yidx)?.product.id, 91027);
  assert.equal(matchSealed("Yu-Gi-Oh! Retro Pack 2 Booster Pack", yidx)?.product.id, 166470);
  // Live: single cards (one a PSA 10) on the US$35 Dueling Mirrors tin.
  assert.equal(looksLikeCard("2024 Yu-Gi-Oh! MP24 25th Anniversary Tin Dueling Mirrors EN073 Triple Tactics Thrust 1st Edition"), true);
  assert.equal(looksLikeCard("Triple Tactics Thrust 25th Anniversary Tin Dueling Mirrors", "yu-gi-oh-tcg-triple-tactics-thrust-25th-anniversary-tin-dueling-mirrors-mp24-en073mp24-en073"), true);
  assert.equal(looksLikeCard("Harpie's Feather Duster 25th Anniversary Tin Dueling Mirrors PSA 10"), true);
  assert.equal(looksLikeCard("Yu-Gi-Oh! 25th Anniversary Tin: Dueling Mirrors"), false);
});

test("Italian and German packs, MVP1 movie-pack cards and '1st Edition Rare' singles are left out (live 2026-11-20)", async () => {
  const { handleOf, isForeign } = await import("@/lib/import/match");
  assert.ok(isForeign(handleOf("https://bsastore.it/products/bustina-3-carte-yu-gi-oh-star-pack-vrains-1a-edizione-ita?variant=1")));
  assert.ok(isForeign(handleOf("https://tradingtoys.de/products/yugioh-lord-of-the-tachyon-galaxy-booster-pack-ltgy-de-1-auflage?variant=1")));
  assert.ok(isForeign("Yu-Gi-Oh! Lord of the Tachyon Galaxy Booster Pack LTGY-DE"));
  // English product from the same shops stays.
  assert.equal(isForeign(handleOf("https://bsastore.it/products/box-display-24-bustine-yu-gi-oh-crossover-breakers-1a-edizione-eng?variant=1")), false);
  assert.equal(isForeign(handleOf("https://tradingtoys.de/products/yugioh-shadow-specters-karten-booster-pack-shsp-en-englisch-1st?variant=1")), false);
  assert.equal(isForeign("Yu-Gi-Oh! Lord of the Tachyon Galaxy Booster Pack LTGY-EN 1st Edition"), false);
  assert.equal(looksLikeCard("Obelisk the Tormentor MVP1-ENSV5", "obelisk the tormentor mvp1 ensv5 the dark side of dimensions movie pack secret edition limited"), true);
  assert.equal(looksLikeCard("Raigeki - 1st Edition Rare - Battle Pack: Epic Dawn", "raigeki 1st edition rare battle pack epic dawn"), true);
  for (const title of ["The Dark Side of Dimensions Movie Pack Secret Edition", "Rarity Collection 5 Booster Box 1st Edition", "Battle Pack: Epic Dawn Booster Pack 1st Edition"])
    assert.equal(looksLikeCard(title), false, title);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { displayUnits, ebayReferenceUsd, ebayTrusted, pricedAsOneUnit, tcgplayerOfferCents } from "@/lib/import/sanity";

test("a TCGplayer low under half the market shows the market price", () => {
  // Hyperia City booster box, 2026-10-27: low $1.00, market $150.67.
  assert.equal(tcgplayerOfferCents([100], 15067), 15067);
  assert.equal(tcgplayerOfferCents([13999], 15067), 13999);
  assert.equal(tcgplayerOfferCents([], 15067), 15067);
  assert.equal(tcgplayerOfferCents([500], null), 500);
  assert.equal(tcgplayerOfferCents([1], 15), 1);
  assert.equal(tcgplayerOfferCents([], null), null);
});

test("eBay rows need a reference and must sit within 0.25x-4x of it", () => {
  // Stardust Trails booster pack, 2026-10-27: no TCGplayer price, stores ~$5-12,
  // eBay rows at $74-$129 were booster boxes.
  const ref = ebayReferenceUsd(null, [12, 5.5, 6.65].map((d) => d * 100));
  assert.equal(ref, 550);
  assert.equal(ebayTrusted(8263, ref), false);
  assert.equal(ebayTrusted(700, ref), true);
  assert.equal(ebayTrusted(700, null), false);
  assert.equal(ebayReferenceUsd(15067, [100]), 15067);
});

test("a display priced like one of its units is that unit", () => {
  // Live 2026-11-28: j2games' US$11.99 "...mini-box-display-toys" on the US$33.34 Midterm Paradox Mini Box Display.
  const products = [
    { id: 1, setId: 10, kind: "sealed", name: "Speed Duel GX: Midterm Paradox Mini Box Display" },
    { id: 2, setId: 10, kind: "sealed", name: "Speed Duel GX: Midterm Paradox Mini Box" },
    { id: 3, setId: 20, kind: "sealed", name: "Shining Victories: Special Edition Display Box" },
    { id: 4, setId: 20, kind: "sealed", name: "Shining Victories: Special Edition Box" },
    { id: 5, setId: 30, kind: "sealed", name: "Magnificent Maestros Display" },
    { id: 6, setId: 40, kind: "sealed", name: "Fire Kings Structure Deck [1st Edition]" },
    { id: 7, setId: 41, kind: "sealed", name: "Fire Kings Structure Deck Display [1st Edition]" },
  ];
  const units = displayUnits(products);
  assert.equal(units.get(1), 2);
  assert.equal(units.get(3), 4);
  assert.equal(units.has(5), false); // no unit product
  assert.equal(units.has(7), false); // another set's deck is not its unit
  assert.equal(pricedAsOneUnit(1199, 3334, 945), true);
  assert.equal(pricedAsOneUnit(3199, 3334, 945), false); // a display's real price
  assert.equal(pricedAsOneUnit(1599, 3334, 945), false); // over 1.5x one unit
  assert.equal(pricedAsOneUnit(1199, 2000, 945), false); // half the display's market or more
  assert.equal(pricedAsOneUnit(1199, null, 945), false);
  assert.equal(pricedAsOneUnit(1199, 3334, null), false);
});

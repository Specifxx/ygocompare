import { test } from "node:test";
import assert from "node:assert/strict";
import type { Product, SetInfo } from "@/lib/site-types";
import { buildIndex, matchCard, matchSealed, titleEdition, type SetEdition } from "@/lib/import/match";

// SITE.setEditions (2026-11-01, Cyberpunk TCG): one set printed as "Beta"
// (Kickstarter, 36-pack boxes, ~US$315) and "Retail" (24 packs, ~US$155) under
// the same names. Store titles are real ones from the store probe.
const EDITIONS: SetEdition[] = [
  { word: "beta", implied: /\b36[- ]?(packs?|ct|count)\b|kickstarter|\bbackers?\b/i },
  { word: "retail", default: true },
];
const set = (id: number, name: string): SetInfo => ({ id, name, code: "", slug: String(id), releasedOn: "2026-11-06", productCount: 1, upcoming: false });
const sealed = (id: number, name: string, setId: number): Product => ({ id, slug: String(id), name, kind: "sealed", setId, number: null, rarity: null, attrs: {}, sealedType: "x", image: null, tcgUrl: "", printings: [] });
const card = (id: number, name: string, number: string, setId: number): Product => ({ ...sealed(id, name, setId), kind: "card", number, sealedType: null, rarity: "Rare" });

const sets = [set(1, "Welcome to Night City - Beta"), set(2, "Welcome to Night City - Retail"), set(3, "Set 1 Promos")];
const products = [
  sealed(10, "Welcome to Night City - Beta Booster Box", 1),
  sealed(11, "Welcome to Night City - Retail Booster Box", 2),
  sealed(12, "Welcome to Night City - Beta Booster Pack", 1),
  sealed(13, "Welcome to Night City - Retail Booster Pack", 2),
  card(20, "Adam Smasher - Ender of Legends", "012/140", 1),
  card(21, "Adam Smasher - Ender of Legends", "012/140", 2),
];
const idx = buildIndex(products, sets, "fraction", { setEditions: EDITIONS });

test("a title that names no edition is the default (Retail) one", () => {
  assert.equal(matchSealed("Cyberpunk TCG: Welcome to Night City Booster Box", idx)?.product.id, 11);
  assert.equal(matchSealed("Cyberpunk TCG Welcome to Night City Retail Booster Box", idx)?.product.id, 11);
  assert.equal(matchSealed("Cyberpunk TCG - Welcome to Night City Booster Pack", idx)?.product.id, 13);
});

test("Beta, or a 36-pack / Kickstarter box, is only ever the Beta product", () => {
  assert.equal(matchSealed("Cyberpunk TCG Welcome to Night City Beta Booster Box", idx)?.product.id, 10);
  assert.equal(matchSealed("Cyberpunk TCG: Welcome to Night City Booster Box (36 Packs)", idx)?.product.id, 10);
  assert.equal(matchSealed("Cyberpunk TCG Kickstarter Booster Box - Welcome to Night City", idx)?.product.id, 10);
});

test("a title pointing at both editions matches neither", () => {
  assert.equal(titleEdition("Welcome to Night City Beta Booster Box (not retail)", EDITIONS), false);
  assert.equal(matchSealed("Welcome to Night City Beta + Retail Booster Box", idx), null);
});

test("cards follow their set's edition", () => {
  assert.equal(matchCard("Adam Smasher - Ender of Legends 012/140 Beta", idx)?.product.id, 20);
  assert.equal(matchCard("Adam Smasher - Ender of Legends 012/140", idx)?.product.id, 21);
});

test("games without editions are unchanged", () => {
  const plain = buildIndex(products, sets, "fraction");
  // Both editions' boxes fit an unmarked title, and a tie is no match.
  assert.equal(plain.editions, null);
  assert.equal(matchSealed("Welcome to Night City Booster Box", plain), null);
});

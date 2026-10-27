import { test } from "node:test";
import assert from "node:assert/strict";
import type { Product } from "@/lib/site-types";

const card = (id: number, name: string, number: string | null, rarity: string | null, image: string | null): Product => ({
  id, slug: String(id), name, kind: "card", setId: 1, number, rarity, attrs: {}, sealedType: null, image, tcgUrl: "", printings: [] });
const img = (id: number) => `https://tcgplayer-cdn.tcgplayer.com/product/${id}_200w.jpg`;

test("a card without a photo borrows one from the same number and name", async () => {
  const { borrowImages } = await import("@/lib/import/tcgcsv");
  const list = [
    card(146748, "Dark Magician the Dragon Knight", "LEDD-ENA00", "Ultra Rare", img(146748)),
    card(606221, "Dark Magician the Dragon Knight", "LEDD-ENA00", "Ultra Rare", null),
    card(606300, "Dark Magician the Dragon Knight (Secret Rare)", "LEDD-ENA00", "Secret Rare", null),
    card(1, "Dark Magician", "LOB-005", "Ultra Rare", img(1)),
    card(2, "Dark Magician Girl", "LOB-005", "Ultra Rare", null),
    card(3, "Dark Magician", "SDY-006", "Ultra Rare", null),
  ];
  borrowImages(list);
  assert.equal(list[1].image, img(146748));
  assert.equal(list[2].image, img(146748), "a rarity suffix in the name is not a different card");
  assert.equal(list[4].image, null, "same number, other name: no photo is better than a wrong one");
  assert.equal(list[5].image, null, "same name, other number: art may differ");
});

test("the same rarity's photo wins", async () => {
  const { borrowImages } = await import("@/lib/import/tcgcsv");
  const list = [
    card(10, "Blue-Eyes White Dragon", "X-001", "Common", img(10)),
    card(11, "Blue-Eyes White Dragon", "X-001", "Ultra Rare", img(11)),
    card(12, "Blue-Eyes White Dragon", "X-001", "Ultra Rare", null),
  ];
  borrowImages(list);
  assert.equal(list[2].image, img(11));
});

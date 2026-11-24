import test from "node:test";
import assert from "node:assert/strict";
import { setNameOf, uniqueSetSlug } from "../src/lib/import/tcgcsv";

test("TCGplayer's 'Immortal Pheonix' becomes Konami's Immortal Phoenix before its slug is made", () => {
  assert.equal(setNameOf("Immortal Pheonix"), "Immortal Phoenix");
  assert.equal(uniqueSetSlug(setNameOf("Immortal Pheonix"), undefined, new Set()), "immortal-phoenix");
  assert.equal(setNameOf("Glorious Victors"), "Glorious Victors");
});

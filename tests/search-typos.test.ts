// Owner's UX review (2026-11-23, P0 5): typo-tolerant search, synonyms and a "did you mean" fallback, never a dead end.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { correctWords, editDistance, expandSynonyms, nearestWord } from "../src/lib/search-fuzzy";

const vocab = new Map([["blue", 40], ["eyes", 40], ["white", 30], ["dragon", 60], ["booster", 300], ["box", 300], ["structure", 100], ["deck", 120], ["dark", 50], ["magician", 20], ["maze", 5]]);
const known = (w: string) => [...vocab.keys()].some((t) => t.startsWith(w));

test("a swap or one wrong letter is one edit", () => {
  assert.equal(editDistance("dragno", "dragon", 2), 1);
  assert.equal(editDistance("magican", "magician", 2), 1);
  assert.equal(editDistance("abc", "xyz", 1), 2);
});

test("misspelt words are corrected to the nearest catalogue word", () => {
  assert.deepEqual(correctWords(["blue", "eys", "whte", "dragn"], known, vocab), ["blue", "eys", "white", "dragon"]);
  assert.deepEqual(correctWords(["dark", "magicain"], known, vocab), ["dark", "magician"]);
  assert.equal(correctWords(["dragon"], known, vocab), null, "nothing to fix");
  assert.equal(nearestWord("xyzzyq", vocab), null, "too far: no guess");
  assert.equal(nearestWord("box", vocab), null, "3 letters or fewer are never changed");
});

test("shorthand becomes the words in product names", () => {
  assert.deepEqual(expandSynonyms(["bb"]), ["booster", "box"]);
  assert.deepEqual(expandSynonyms(["sd", "tins"]), ["structure", "deck", "tin"]);
  assert.deepEqual(expandSynonyms(["dragon"]), ["dragon"]);
});

test("the search route corrects, and falls back to popular products instead of nothing", () => {
  const src = readFileSync(new URL("../src/app/api/search/route.ts", import.meta.url), "utf8");
  assert.match(src, /correctWords\(/);
  assert.match(src, /popular: true/);
  const box = readFileSync(new URL("../src/components/SearchBox.tsx", import.meta.url), "utf8");
  assert.match(box, /Showing results for/);
  assert.match(box, /Popular right now/);
});

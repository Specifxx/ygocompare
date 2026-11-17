import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Owner, 2026-11-17 (final): eBay first, then TCGplayer, then Amazon, above the stores.
test("Amazon sits right under the last pinned row (eBay, then TCGplayer)", () => {
  const s = readFileSync(new URL("../src/components/PriceTable.tsx", import.meta.url), "utf8");
  assert.match(s, /const amazonAfter = shown\.reduce\(\(at, o, i\) => \(pinned\.includes\(o\) \? i : at\), -1\);/);
  assert.doesNotMatch(s, /norm\(a\) - norm\(b\)/);
});

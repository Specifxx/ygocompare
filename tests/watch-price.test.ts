// Lever 1 of the retention programme (lib/watch-price.ts, components/WatchPrice.tsx; owner 2026-11-18).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pickWatchArm, seenToday } from "../src/lib/watch-price";

test("half the visitors are the control arm", () => {
  assert.equal(pickWatchArm(0.1), "on");
  assert.equal(pickWatchArm(0.5), "off");
  assert.equal(pickWatchArm(0.99), "off");
});

test("eligibility counts once a visitor-day", () => {
  assert.equal(seenToday("Wed Nov 18 2026", "Wed Nov 18 2026"), true);
  assert.equal(seenToday(null, "Wed Nov 18 2026"), false);
});

test("the button is in the page, never a pop-up, and the control arm sees nothing", () => {
  const src = readFileSync("src/components/WatchPrice.tsx", "utf8");
  assert.match(src, /if \(arm !== "on"\) return null;/);
  assert.doesNotMatch(src, /position:\s*["']fixed|<dialog|showModal|window\.open/);
});

test("the shared form reports opens and saves", () => {
  const form = readFileSync("src/components/PriceAlertForm.tsx", "utf8");
  assert.match(form, /new CustomEvent\("price-alert", \{ detail: \{ kind: "saved"/);
  assert.match(form, /new CustomEvent\("price-alert", \{ detail: \{ kind: "open"/);
});

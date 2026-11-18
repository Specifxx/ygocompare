import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Back in stock, free for everyone (owner, 2026-11-18): a product sold out in the visitor's
// region gets the restock form, on RiftCompare's shared alert service, with its own event.
test("the alert form turns into a back-in-stock form when the region has no in-stock price", () => {
  const src = fs.readFileSync("src/components/PriceAlertForm.tsx", "utf8");
  assert.match(src, /props\.priceCents == null \? <RestockForm/);
  assert.match(src, /kind: "restock"/);
  assert.match(src, /track\("restock_signup", \{ member: "no", region \}\)/);
  // Same double opt-in, same service, no pop-up: the form is inline like the price alert.
  assert.match(src, /fetch\(ALERT_SERVICE/);
  assert.doesNotMatch(src, /window\.open|<dialog/);
});

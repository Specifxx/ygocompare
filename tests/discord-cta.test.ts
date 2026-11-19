import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SITE } from "../src/site.config";

// The Discord hub (owner, 2026-11-20): this site's own invite, shown with a reason, under the price table and in the footer.
test("the Discord box links this site's own hub invite, never above a price", () => {
  assert.match(SITE.discordInvite ?? "", /^https:\/\/discord\.gg\/[A-Za-z0-9]+$/);
  const page = readFileSync("src/app/card/[slug]/page.tsx", "utf8");
  assert.ok(page.indexOf("<DiscordCta") > page.indexOf("<PriceTable"), "the box sits under the price table");
  assert.match(readFileSync("src/components/Footer.tsx", "utf8"), /<DiscordCta href=\{SITE\.discordInvite\}/);
  assert.match(readFileSync("src/components/DiscordCta.tsx", "utf8"), /Restock and price-drop alerts/);
});

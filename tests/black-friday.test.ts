import { test } from "node:test";
import assert from "node:assert/strict";
import { blackFriday, cyberMonday, inSeason, seasonYear, splitDeals } from "../src/lib/black-friday";

test("Black Friday is the day after US Thanksgiving", () => {
  assert.equal(blackFriday(2026), "2026-11-27");
  assert.equal(blackFriday(2025), "2025-11-28");
  assert.equal(blackFriday(2027), "2027-11-26");
  assert.equal(cyberMonday(2026), "2026-11-30");
});

test("season window and year roll over a week after Cyber Monday", () => {
  assert.equal(inSeason("2026-10-31"), false);
  assert.equal(inSeason("2026-11-01"), true);
  assert.equal(inSeason("2026-12-07"), true);
  assert.equal(inSeason("2026-12-08"), false);
  assert.equal(seasonYear("2026-11-02"), 2026);
  assert.equal(seasonYear("2026-12-08"), 2027);
});

test("splitDeals keeps one row per product, sealed apart from cards", () => {
  const d = (id: number, kind: string) => ({ p: { id, kind } });
  const out = splitDeals([d(1, "sealed"), d(2, "card"), d(1, "sealed"), d(3, "card")], 1);
  assert.deepEqual(out.sealed.map((x) => x.p.id), [1]);
  assert.deepEqual(out.cards.map((x) => x.p.id), [2]);
});

test("the strip shows Black Friday from 1 November, then Cyber Monday, then nothing", async () => {
  const { saleStrip, holidayFaq } = await import("../src/lib/black-friday");
  assert.equal(saleStrip("2026-10-31"), null);
  assert.equal(saleStrip("2026-11-01")?.href, "/black-friday");
  assert.equal(saleStrip("2026-11-28")?.href, "/black-friday");
  assert.equal(saleStrip("2026-11-29")?.href, "/cyber-monday");
  assert.equal(saleStrip("2026-12-01")?.href, "/cyber-monday");
  assert.equal(saleStrip("2026-12-02"), null);
  const faq = holidayFaq("cyber-monday", 2026, { game: "Lorcana", stores: 10, regions: "the US and the UK" });
  assert.match(faq[0].a, /Monday 30 November/);
  for (const f of faq) assert.doesNotMatch(f.q + f.a, /was \$|ends soon|limited time/i);
});

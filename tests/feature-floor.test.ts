// Front-page placements favour the pricier items (owner, 2026-11-12): the shelf and the deals only carry products at or
// above SITE.featureMinCents (TCGplayer market); cheaper ones stay in the catalogue.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SITE } from "../src/site.config";
import { deals, refCents } from "../src/lib/data";
import { featuredSealed } from "../src/lib/hubs";

test("the featuring floor is set", () => {
  assert.ok((SITE.featureMinCents ?? 0) >= 2000);
});

test("the home shelf holds nothing under the floor", () => {
  for (const p of featuredSealed(12)) assert.ok((refCents(p.id) ?? 0) >= (SITE.featureMinCents ?? 0), p.name);
});

test("today's deals hold nothing under the floor", () => {
  for (const d of deals(40)) assert.ok(d.market >= (SITE.featureMinCents ?? 0), d.p.name);
});

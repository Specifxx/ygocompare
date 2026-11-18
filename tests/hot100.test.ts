import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { hotChart, latestDay, moveLabel, hotName } from "../src/lib/hot100";

// The weekly Hot 100 (owner, 2026-11-18): real risers only, last week's place from the same history.
const D = 20_400;
const s = (...pts: [number, number][]) => pts;

test("ranks only real seven-day risers, biggest first, and keeps the honest count", () => {
  const inputs = [
    { item: "flat", series: s([D - 30, 1000]) },
    { item: "up10", series: s([D - 30, 1000], [D - 1, 1100]) },
    { item: "up50", series: s([D - 30, 1000], [D, 1500]) },
    { item: "down", series: s([D - 30, 1000], [D, 900]) },
    { item: "cheap", series: s([D - 30, 100], [D, 200]) },
    { item: "young", series: s([D - 3, 1000], [D, 2000]) },
  ];
  const c = hotChart(inputs, D);
  assert.deepEqual(c.rows.map((r) => r.item), ["up50", "up10"]);
  assert.equal(c.rows[0].change, 50);
  assert.equal(c.rows[0].cents, 1500);
  assert.equal(hotName(c.rows.length), "Hot 2");
});

test("last week's place is worked out the same way seven days earlier", () => {
  const inputs = [
    { item: "a", series: s([D - 20, 1000], [D - 8, 1300], [D, 1400]) }, // last week +30%, this week +7.7%
    { item: "b", series: s([D - 20, 1000], [D - 9, 1100], [D, 2000]) }, // last week +10%, this week +81.8%
    { item: "c", series: s([D - 20, 1000], [D - 1, 1050]) }, // new this week
  ];
  const c = hotChart(inputs, D);
  assert.deepEqual(c.rows.map((r) => [r.item, r.lastRank]), [["b", 2], ["a", 1], ["c", null]]);
  assert.equal(moveLabel(c.rows[0], c.lastWeekSize), "▲ 1");
  assert.equal(moveLabel(c.rows[1], c.lastWeekSize), "▼ 1");
  assert.equal(moveLabel(c.rows[2], c.lastWeekSize), "NEW");
  assert.equal(moveLabel({ rank: 1, lastRank: null }, 0), null);
  assert.equal(latestDay(inputs), D);
});

test("caps at 100", () => {
  const inputs = Array.from({ length: 150 }, (_, i) => ({ item: i, series: s([D - 10, 1000], [D, 1001 + i]) }));
  assert.equal(hotChart(inputs, D).rows.length, 100);
  assert.equal(hotChart(inputs, D).rows[0].item, 149);
});

test("the page and its share image exist and read the same chart", () => {
  for (const f of ["src/app/hot-100/page.tsx", "src/app/hot-100/opengraph-image.tsx"]) {
    const src = fs.readFileSync(f, "utf8");
    assert.match(src, /hotChart\(/);
    assert.doesNotMatch(src, /fetch\(/);
  }
});

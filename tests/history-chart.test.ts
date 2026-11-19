import { test } from "node:test";
import assert from "node:assert/strict";
import { chartRanges, dailyValues, historyLines } from "../src/lib/history-chart";

test("dailyValues carries each value until the next point, and 0 is a gap for store lows", () => {
  assert.deepEqual(dailyValues([[10, 500], [12, 0], [13, 450]], 9, 14, true), [null, 500, 500, null, 450, 450]);
  assert.deepEqual(dailyValues([[10, 500], [12, 0]], 10, 12), [500, 500, 0]);
});

test("historyLines converts TCGplayer's US cents at the market's rate and keeps the store line in its own cents", () => {
  const l = historyLines([[100, 1000]], [[101, 1600]], 1.5, 103)!;
  assert.deepEqual(l.days, [100, 101, 102, 103]);
  assert.deepEqual(l.market, [1500, 1500, 1500, 1500]);
  assert.deepEqual(l.local, [null, 1600, 1600, 1600]);
});

test("historyLines draws the local line alone when there is no TCGplayer price, and nothing with under two days", () => {
  const l = historyLines(undefined, [[100, 900], [102, 800]], 1, 102)!;
  assert.deepEqual(l.local, [900, 900, 800]);
  assert.ok(l.market.every((v) => v == null));
  assert.equal(historyLines(undefined, undefined, 1, 102), null);
  assert.equal(historyLines([[102, 900]], undefined, 1, 102), null);
});

test("historyLines starts no earlier than `days` before the last day", () => {
  const l = historyLines([[0, 100]], undefined, 1, 500, 365)!;
  assert.equal(l.days[0], 135);
});

test("range tabs are offered only when the history is longer than them; All is last", () => {
  const days = Array.from({ length: 40 }, (_, i) => i);
  const r = chartRanges(days, [days.map((d) => d + 1)]);
  assert.deepEqual(r.map((x) => x.label), ["7D", "30D", "All"]);
});

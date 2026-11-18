import { test } from "node:test";
import assert from "node:assert/strict";
import { SEEN_MAX, findDrops, hasEarlier, localDay, noteSeen, parseSeen, pickSinceArm, rebase } from "../src/lib/since-visit";

test("noteSeen keeps one entry a product, newest first, and drops empty prices", () => {
  let l = noteSeen([], "1", "2026-11-17", { US: 1000 });
  l = noteSeen(l, "2", "2026-11-17", { US: 500, UK: 0 });
  l = noteSeen(l, "1", "2026-11-18", { US: 900 });
  assert.deepEqual(l.map((s) => s.id), ["1", "2"]);
  assert.deepEqual(l[0], { id: "1", d: "2026-11-18", p: { US: 900 } });
  assert.deepEqual(l[1].p, { US: 500 });
  assert.equal(noteSeen(l, "3", "2026-11-18", {}).length, 2);
});

test("the list is capped", () => {
  let l: ReturnType<typeof parseSeen> = [];
  for (let i = 0; i < SEEN_MAX + 5; i++) l = noteSeen(l, String(i), "2026-11-18", { US: 100 + i });
  assert.equal(l.length, SEEN_MAX);
  assert.equal(parseSeen(JSON.stringify(l)).length, SEEN_MAX);
  assert.deepEqual(parseSeen("nope"), []);
  assert.deepEqual(parseSeen('[{"id":1}]'), []);
});

test("only products seen on an earlier day count, and only real drops in the visitor's market", () => {
  const list = [
    { id: "a", d: "2026-11-17", p: { US: 10000 } }, // 10% drop
    { id: "b", d: "2026-11-17", p: { US: 2000 } }, // up
    { id: "c", d: "2026-11-18", p: { US: 5000 } }, // seen today: never
    { id: "d", d: "2026-11-10", p: { US: 1000, UK: 900 } }, // 40% drop
    { id: "e", d: "2026-11-10", p: { US: 10000 } }, // 0.5%: too small
    { id: "f", d: "2026-11-10", p: { UK: 3000 } }, // other market
    { id: "g", d: "2026-11-10", p: { US: 3000 } }, // off-site url refused
  ];
  const items = {
    a: { n: "A", u: "/card/a", p: { US: 9000 } },
    b: { n: "B", u: "/card/b", p: { US: 2100 } },
    c: { n: "C", u: "/card/c", p: { US: 100 } },
    d: { n: "D", u: "/card/d", p: { US: 600 } },
    e: { n: "E", u: "/card/e", p: { US: 9950 } },
    f: { n: "F", u: "/card/f", p: { US: 100, UK: 2000 } },
    g: { n: "G", u: "https://elsewhere.example/x", p: { US: 100 } },
  };
  assert.ok(hasEarlier(list, "2026-11-18"));
  assert.ok(!hasEarlier([list[2]], "2026-11-18"));
  const drops = findDrops(list, items, "US", "2026-11-18");
  assert.deepEqual(drops.map((d) => [d.id, d.pct]), [["d", 40], ["a", 10]]);
  assert.deepEqual(findDrops(list, items, "UK", "2026-11-18").map((d) => d.id), ["f"]);
});

test("rebase moves earlier prices to today's so a drop is told once", () => {
  const list = [{ id: "a", d: "2026-11-17", p: { US: 10000, UK: 5000 } }, { id: "b", d: "2026-11-18", p: { US: 1 } }];
  const items = { a: { n: "A", u: "/card/a", p: { US: 9000 } }, b: { n: "B", u: "/card/b", p: { US: 5 } } };
  const next = rebase(list, items, "2026-11-18");
  assert.deepEqual(next[0].p, { US: 9000, UK: 5000 });
  assert.deepEqual(next[1].p, { US: 1 });
  assert.equal(findDrops(next, items, "US", "2026-11-18").length, 0);
});

test("arms split in half and days are local dates", () => {
  assert.equal(pickSinceArm(0.1), "on");
  assert.equal(pickSinceArm(0.9), "off");
  assert.equal(localDay(new Date(2026, 0, 5)), "2026-01-05");
});

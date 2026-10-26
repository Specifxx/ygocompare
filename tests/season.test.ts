import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { SEASON_BOOT_SCRIPT, seasonAt } from "@/lib/season";

test("Halloween runs through 31 October and is gone on 1 November", () => {
  assert.equal(seasonAt(new Date(2026, 9, 24)), "halloween");
  assert.equal(seasonAt(new Date(2026, 9, 31, 23, 59)), "halloween");
  assert.equal(seasonAt(new Date(2026, 10, 1, 0, 0)), null);
  assert.equal(seasonAt(new Date(2026, 9, 15)), null);
});

test("boot script agrees with seasonAt", () => {
  for (const d of [new Date(2026, 9, 20), new Date(2026, 10, 1)]) {
    const attrs: Record<string, string> = {};
    const RealDate = Date;
    const ctx = {
      location: { search: "" },
      document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
      Date: class extends RealDate { constructor() { super(d.getTime()); } },
    };
    vm.runInNewContext(SEASON_BOOT_SCRIPT, ctx);
    assert.equal(attrs["data-season"] ?? null, seasonAt(d));
  }
});

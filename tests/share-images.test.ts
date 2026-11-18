import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// More shareable artefacts (DECISIONS.md, 2026-11-18): the movers and Deal Finder share images.
test("movers and Deal Finder have their own text-only share image and no images key that would hide it", () => {
  for (const dir of ["movers", "tools/deal-finder"]) {
    if (!fs.existsSync(`src/app/${dir}/page.tsx`)) continue;
    assert.ok(fs.existsSync(`src/app/${dir}/opengraph-image.tsx`), dir);
    const page = fs.readFileSync(`src/app/${dir}/page.tsx`, "utf8");
    assert.ok(!/images\s*:/.test(page) && !page.includes("canon("), `${dir} page must not set og images`);
    assert.ok(page.includes("<ShareButton"), `${dir} has a share button`);
    assert.ok(!/<img|p\.image/.test(fs.readFileSync(`src/app/${dir}/opengraph-image.tsx`, "utf8")), `${dir} image is text only`);
  }
});

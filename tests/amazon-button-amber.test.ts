// Owner, 2026-11-18: the Amazon row's button is amber, never the site's own buy button; the quick view carries a real "See full page" button.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("the Amazon row's link is the amber .btn-amazon button, keeping rel sponsored and its tracked link", () => {
  const table = read("src/components/PriceTable.tsx");
  const row = table.slice(table.indexOf("data-amazon-row"));
  const link = /<a href=\{goHref\(\{ url: amazonUrl[^>]*>/.exec(row)?.[0] ?? "";
  assert.match(link, /className="btn-amazon /);
  assert.match(link, /rel="sponsored nofollow noopener"/);
  assert.match(link, /_pinned/);
  assert.doesNotMatch(link, /btn-(soft|ghost|primary|ad|tcg)/);
});

test(".btn-amazon is amber with dark words, written without a theme variant so both themes match", () => {
  const css = read("src/app/globals.css");
  const rule = /\.btn-amazon\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  assert.match(rule, /bg-\[#F5A524\]/i);
  assert.match(rule, /text-\[#111111\]/i);
  assert.match(rule, /hover:bg-\[#DC8A0B\]/i);
  assert.match(rule, /border-\[#B7791F\]/i);
  assert.doesNotMatch(css, /:root\[data-theme[^{]*\.btn-amazon|dark[^{]*\.btn-amazon/);
});

test("the quick view has a full-width See full page button, at least 44px tall, pinned under the scrolling prices", () => {
  const qv = read("src/components/QuickView.tsx");
  const link = /<Link href=\{href\}[^>]*data-qv-full-page[^>]*>/.exec(qv)?.[0] ?? "";
  assert.ok(link, "the full-page link exists");
  assert.match(link, /min-h-12/);
  assert.match(link, /w-full/);
  assert.match(link, /btn-primary/);
  assert.match(qv, /See full page: price history and details/);
  assert.equal((qv.match(/data-qv-full-page/g) ?? []).length, 1, "one button, not two");
  // Outside the overflow-y-auto body, so it is on screen without scrolling.
  assert.ok(qv.indexOf("data-qv-full-page") > qv.indexOf("overflow-y-auto"));
});

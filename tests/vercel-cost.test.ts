import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import robots from "../src/app/robots";

// DECISIONS.md, "Vercel cost: no prefetch, a day per page, fewer bots", and the engine port (2026-11-04): the catalogue
// pages are one CDN copy per URL, never ISR.
const files = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : /\.tsx?$/.test(e.name) ? [p] : [];
  });

test("every link goes through the no-prefetch wrapper", () => {
  const offenders = files("src").filter((f) => f !== path.join("src", "components", "Link.tsx") && /from "next\/link"/.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(offenders, []);
  assert.match(fs.readFileSync("src/components/Link.tsx", "utf8"), /prefetch = false/);
});

const CDN_PAGES: [string, string][] = [
  ["src/app/card/[slug]/page.tsx", "/card/:slug"],
  ["src/app/kit/[slug]/page.tsx", "/kit/:slug"],
  ["src/app/sets/[slug]/page.tsx", "/sets/:slug"],
  ["src/app/sealed/[type]/page.tsx", "/sealed/:type"],
  ["src/app/games/[slug]/page.tsx", "/games/:slug"],
  ["src/app/kits/grade/[grade]/page.tsx", "/kits/grade/:grade"],
  ["src/app/preorders/[slug]/page.tsx", "/preorders/:slug"],
];

test("pages with one URL per product or set are one CDN copy a day each, never ISR and never prerendered", () => {
  const config = fs.readFileSync("next.config.js", "utf8");
  assert.match(config, /s-maxage=86400, stale-while-revalidate=86400/);
  for (const [f, source] of CDN_PAGES) {
    const src = fs.readFileSync(f, "utf8");
    assert.match(src, /export const dynamic = "force-dynamic";/, f);
    assert.doesNotMatch(src, /export const revalidate/, `${f} must not revalidate`);
    assert.doesNotMatch(src, /generateStaticParams/, `${f} must not prerender`);
    assert.ok(config.includes(`"${source}"`), `${source} has no CDN header rule`);
  }
  // The CDN header never covers the click redirect or the API.
  assert.doesNotMatch(config, /"\/go|"\/api/);
  // Nothing in those pages' trees reads the request: the copy must serve everyone.
  for (const [f] of CDN_PAGES) {
    const src = fs.readFileSync(f, "utf8");
    assert.doesNotMatch(src, /cookies\(\)|headers\(\)|unstable_noStore/, `${f} reads the request`);
  }
  for (const f of files("src/app")) {
    const m = fs.readFileSync(f, "utf8").match(/export const revalidate = (\d+)/);
    if (m) assert.ok(Number(m[1]) >= 21600, `${f} revalidates under six hours`);
  }
});

test("robots.txt blocks bulk scrapers and query-string URLs, not search engines", () => {
  const rules = [robots().rules].flat();
  const all = rules.find((r) => r.userAgent === "*")!;
  assert.ok([all.disallow].flat().includes("/*?"));
  assert.ok([all.allow].flat().includes("/_next/"));
  const blocked = rules.filter((r) => r.disallow === "/").flatMap((r) => [r.userAgent].flat());
  assert.ok(blocked.includes("Bytespider"));
  for (const ok of ["Googlebot", "Bingbot", "AhrefsBot", "SemrushBot", "GPTBot", "ClaudeBot", "PerplexityBot"]) assert.ok(!blocked.includes(ok), ok);
});

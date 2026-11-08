import { test } from "node:test";
import assert from "node:assert/strict";
import { SITE } from "@/site.config";

// Every site links the whole Compare Empire family from its footer (owner,
// 2026-10-27): the other sites (eleven or more), each once (WargameCompare and FigureCompare joined 2026-10-28, Cyberpunk Compare 2026-11-01, BandaiCompare 2026-11-03), over https, never itself,
// with a descriptive anchor (the words a searcher types) rather than the brand.
test("sister sites: the eleven or more others, once each, with descriptive anchors", () => {
  const hosts = SITE.sisterSites.map((s) => new URL(s.url).host);
  assert.ok(SITE.sisterSites.length >= 11);
  assert.equal(new Set(hosts).size, hosts.length, "no site twice");
  for (const s of SITE.sisterSites) {
    assert.equal(new URL(s.url).protocol, "https:", s.name);
    assert.notEqual(s.name, SITE.name, "never this site itself");
    assert.match(s.anchor ?? "", /prices$/, `${s.name}: anchor says what it compares`);
    // Owner, 2026-11-02: never tie a sister site to one country ("Australian
    // tech prices" for a site that compares US and UK stores too).
    assert.doesNotMatch(`${s.anchor} ${s.game}`, /\b(Australian|Aussie|American|British|Canadian|Australia only|AU only)\b/i, `${s.name}: region-neutral`);
  }
});

// The footer (2026-11-08): one link to /our-sites, which lists every other site once by plain name; no
// site-wide links to our own sites, never KaeYoung.
test("footer: one link to /our-sites, which lists the other family sites", async () => {
  const { FAMILY_SITES } = await import("@/lib/family-network");
  const fs = await import("node:fs");
  const footer = fs.readFileSync("src/components/Footer.tsx", "utf8");
  assert.match(footer, /href="\/our-sites"/);
  assert.doesNotMatch(footer, /footerSisters|NETWORK_PAGE|href="https?:\/\//, "no external site links in the footer");
  const page = fs.readFileSync("src/app/our-sites/page.tsx", "utf8");
  assert.match(page, /FAMILY_SITES\.filter\(\(s\) => s\.id !== SITE\.family\.id\)/);
  assert.match(page, /rel="noopener"/);
  assert.doesNotMatch(page, /nofollow|sponsored/);
  assert.ok(FAMILY_SITES.length >= 10 && !FAMILY_SITES.some((s) => /kaeyoung/i.test(s.url)));
});

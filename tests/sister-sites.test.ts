import { test } from "node:test";
import assert from "node:assert/strict";
import { SITE } from "@/site.config";

// Every site links the whole Compare Empire family from its footer (owner,
// 2026-10-27): the other eight sites, each once, over https, never itself,
// with a descriptive anchor (the words a searcher types) rather than the brand.
test("sister sites: the eight others, once each, with descriptive anchors", () => {
  const hosts = SITE.sisterSites.map((s) => new URL(s.url).host);
  assert.equal(SITE.sisterSites.length, 8);
  assert.equal(new Set(hosts).size, hosts.length, "no site twice");
  for (const s of SITE.sisterSites) {
    assert.equal(new URL(s.url).protocol, "https:", s.name);
    assert.notEqual(s.name, SITE.name, "never this site itself");
    assert.match(s.anchor ?? "", /prices$/, `${s.name}: anchor says what it compares`);
  }
});

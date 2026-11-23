import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boostTarget } from "../src/components/NavBoost";

const here = { origin: "https://example.com", pathname: "/sealed", search: "" };

test("intent prefetch: only a same-site page this tab would open", () => {
  assert.equal(boostTarget({ href: "/sets/chromatic-ascension" }, here), "/sets/chromatic-ascension");
  assert.equal(boostTarget({ href: "https://example.com/games/pokemon" }, here), "/games/pokemon");
  assert.equal(boostTarget({ href: "/sealed#lc=in" }, here), null, "the same page");
  assert.equal(boostTarget({ href: "/go/abc?u=1" }, here), null, "a link out");
  assert.equal(boostTarget({ href: "/out/tcgplayer" }, here), null);
  assert.equal(boostTarget({ href: "/api/quick/x" }, here), null);
  assert.equal(boostTarget({ href: "https://www.ebay.com/sch" }, here), null, "another host");
  assert.equal(boostTarget({ href: "/card/x", target: "_blank" }, here), null);
  assert.equal(boostTarget({ href: "/card/x", rel: "sponsored nofollow" }, here), null);
  assert.equal(boostTarget({ href: "/feed.xml", download: true }, here), null);
});

test("NavBoost is mounted once, and Link still keeps viewport prefetch off", () => {
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  assert.equal(layout.split("<NavBoost").length - 1, 1);
  assert.match(readFileSync("src/components/Link.tsx", "utf8"), /prefetch = false/);
  const src = readFileSync("src/components/NavBoost.tsx", "utf8");
  assert.doesNotMatch(src, /IntersectionObserver/, "never a viewport prefetch");
  assert.match(src, /saveData/);
});

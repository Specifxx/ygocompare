import { test } from "node:test";
import assert from "node:assert/strict";
import { looksLikeBot, suspectClick } from "../src/lib/bot-click";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const OLD_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.6 Mobile/15E148 Safari/604.1";
const YANDEX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 YaBrowser/24.6.0.0 Yowser/2.5 Safari/537.36";
const BAIDU_APP = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 baiduboxapp/13.40.0.10";
const person = (ua: string) => new Headers({ "user-agent": ua, "accept-language": "en-US,en;q=0.9", "sec-fetch-mode": "navigate" });

test("a person clicking in Chrome or on an iPhone is not a bot", () => {
  assert.equal(looksLikeBot(person(CHROME)), false);
  assert.equal(looksLikeBot(person(IPHONE)), false);
  assert.equal(suspectClick(person(CHROME)), false);
});

test("named crawlers, scripts and headless browsers are bots", () => {
  for (const ua of [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36",
    "python-requests/2.32.3",
    "curl/8.7.1",
    "Scrapy/2.11.2 (+https://scrapy.org)",
  ]) {
    assert.equal(looksLikeBot(person(ua)), true, ua);
    assert.equal(suspectClick(person(ua)), true, ua);
  }
  assert.equal(looksLikeBot(new Headers({ "accept-language": "en", "sec-fetch-mode": "navigate" })), true, "no browser sends no User-Agent");
});

test("owner, 2026-11-22: a real person is never untagged, whatever headers their browser leaves out", () => {
  // iOS before 16.4 and some in-app browsers send no Sec-Fetch-*; some privacy setups send no Accept-Language.
  assert.equal(looksLikeBot(new Headers({ "user-agent": OLD_IPHONE, "accept-language": "en-AU" })), false);
  assert.equal(looksLikeBot(new Headers({ "user-agent": CHROME, "sec-fetch-mode": "navigate" })), false);
  assert.equal(looksLikeBot(new Headers({ "user-agent": CHROME })), false);
  // A link opened from Discord, an email, a pasted URL or a translate proxy.
  for (const site of ["none", "cross-site"]) assert.equal(looksLikeBot(new Headers({ "user-agent": CHROME, "accept-language": "en", "sec-fetch-mode": "navigate", "sec-fetch-site": site })), false, site);
  // Real browsers whose names once matched the list.
  assert.equal(looksLikeBot(person(YANDEX)), false);
  assert.equal(looksLikeBot(person(BAIDU_APP)), false);
});

test("those requests only stay out of the server-side click log", () => {
  assert.equal(suspectClick(new Headers({ "user-agent": CHROME, "sec-fetch-mode": "navigate" })), true);
  assert.equal(suspectClick(new Headers({ "user-agent": CHROME, "accept-language": "en" })), true);
  const h = (site?: string) => new Headers({ "user-agent": CHROME, "accept-language": "en-US", "sec-fetch-mode": "navigate", ...(site ? { "sec-fetch-site": site } : {}) });
  assert.equal(suspectClick(h("same-origin")), false);
  assert.equal(suspectClick(h("same-site")), false);
  assert.equal(suspectClick(h()), false);
  assert.equal(suspectClick(h("cross-site")), true);
  assert.equal(suspectClick(h("none")), true);
});

test("/go sends only a declared bot to the shop untagged", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync(new URL("../src/app/go/route.ts", import.meta.url), "utf8");
  assert.match(src, /looksLikeBot\(req\.headers\) \? dest/);
});

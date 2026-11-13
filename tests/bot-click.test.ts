import { test } from "node:test";
import assert from "node:assert/strict";
import { looksLikeBot } from "../src/lib/bot-click";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const person = (ua: string) => new Headers({ "user-agent": ua, "accept-language": "en-US,en;q=0.9", "sec-fetch-mode": "navigate" });

test("a person clicking in Chrome or on an iPhone is not a bot", () => {
  assert.equal(looksLikeBot(person(CHROME)), false);
  assert.equal(looksLikeBot(person(IPHONE)), false);
});

test("named crawlers, scripts and headless browsers are bots", () => {
  for (const ua of [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36",
    "python-requests/2.32.3",
    "curl/8.7.1",
    "Scrapy/2.11.2 (+https://scrapy.org)",
  ]) assert.equal(looksLikeBot(person(ua)), true, ua);
});

test("no user agent, no language or no fetch metadata is a bot", () => {
  assert.equal(looksLikeBot(new Headers({ "accept-language": "en", "sec-fetch-mode": "navigate" })), true);
  assert.equal(looksLikeBot(new Headers({ "user-agent": CHROME, "sec-fetch-mode": "navigate" })), true);
  assert.equal(looksLikeBot(new Headers({ "user-agent": CHROME, "accept-language": "en" })), true);
});

test("/go sends a bot to the shop untagged", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync(new URL("../src/app/go/route.ts", import.meta.url), "utf8");
  assert.match(src, /looksLikeBot\(req\.headers\)/);
});

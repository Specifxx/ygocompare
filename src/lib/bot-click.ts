// Is this /go request a bot rather than a person? (2026-11-13: a crawler that ignores robots.txt opened
// ~10,000 TCGplayer buy links in three days, one per product, so the affiliate network saw thousands of clicks
// with no sales.) A bot is still sent to the shop, but untagged: the network never counts it as our click.
// Every browser a person uses sends a User-Agent and an Accept-Language; a known crawler names itself; and
// every current browser (Chrome 76+, Firefox 90+, Safari 16.4+) marks a navigation with Sec-Fetch-Mode.
// The rules may only mark obvious bots: a person is never refused a link, at worst sent untagged.
const BOT_UA =
  /bot\b|bot\/|crawl|spider|slurp|scrape|headless|phantom|puppeteer|playwright|selenium|python|curl|wget|httpx|okhttp|axios|node-fetch|undici|go-http|java\/|libwww|aiohttp|scrapy|feedfetcher|facebookexternalhit|preview|bytespider|gptbot|claudebot|ccbot|perplexity|amazonbot|petalbot|semrush|ahrefs|mj12|dotbot|yandex|baidu/i;

export function looksLikeBot(headers: Headers): boolean {
  const ua = headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return true;
  if (!headers.get("accept-language")) return true;
  if (!headers.get("sec-fetch-mode")) return true;
  return false;
}

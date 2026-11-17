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
  // 2026-11-17: the same hole Dex closed on 15 Nov (2,835 go_clicks from 1,381 devices on a day with 632 visitors, full browser headers).
  // What a crawler cannot fake by opening /go URLs it collected: Sec-Fetch-Site. A /go link exists only on our own pages, so a person's
  // click is "same-origin"; a URL opened directly is "none" and one followed from elsewhere "cross-site". An absent header (an old
  // browser) is left alone: the rules only mark obvious bots.
  const site = headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "same-site") return true;
  return false;
}

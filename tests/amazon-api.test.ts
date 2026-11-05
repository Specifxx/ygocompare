// Amazon's Creators API prices (2026-11-05): ASINs found by the daily refresh, prices fetched by the build, shown 24 hours, never committed.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { amazonTitleMatches } from "../scripts/amazon-asins";
import { amazonItemUrl } from "@/lib/affiliate";
import { credentialsFor, itemsOf, pickListing, tokenEndpoint, type Item } from "@/lib/amazon-creators";
import { isFreshAmazonPrice } from "@/lib/amazon-live";
import { buildIndex } from "@/lib/import/match";
import type { Product, SetInfo } from "@/lib/site-types";

test("the token endpoint follows the credential version, else the store's home region", () => {
  assert.equal(tokenEndpoint("3.1", "AU"), "https://api.amazon.com/auth/o2/token");
  assert.equal(tokenEndpoint("3.3", "US"), "https://api.amazon.co.jp/auth/o2/token");
  assert.equal(tokenEndpoint(undefined, "UK"), "https://api.amazon.co.uk/auth/o2/token");
  assert.equal(tokenEndpoint(undefined, "AU"), "https://api.amazon.co.jp/auth/o2/token");
});

test("one credential serves every store: the AU-named variables are the default, a market's own win", () => {
  const au = { AMAZON_CREATORS_AU_CLIENT_ID: " a ", AMAZON_CREATORS_AU_CLIENT_SECRET: "b", AMAZON_CREATORS_AU_VERSION: "3.3" };
  assert.equal(credentialsFor("US", {}), null);
  assert.deepEqual(credentialsFor("AU", au), { id: "a", secret: "b", version: "3.3" });
  assert.deepEqual(credentialsFor("US", au), { id: "a", secret: "b", version: "3.3" });
  assert.deepEqual(credentialsFor("US", { ...au, AMAZON_CREATORS_US_CLIENT_ID: "u", AMAZON_CREATORS_US_CLIENT_SECRET: "v" }), { id: "u", secret: "v", version: "3.1" });
});

const listing = (amount: number, o: Partial<{ cond: string; avail: string; cur: string; box: boolean; seller: string }> = {}) => ({
  price: { money: { amount, currency: o.cur ?? "USD" } },
  condition: { value: o.cond ?? "New" },
  availability: { type: o.avail ?? "IN_STOCK" },
  isBuyBoxWinner: o.box,
  merchantInfo: { name: o.seller ?? "Amazon.com" },
});
const item = (...listings: ReturnType<typeof listing>[]): Item => ({ asin: "B000000001", offersV2: { listings } });

test("the shown price is the new, in-stock buy box in the store's currency, else the cheapest such listing", () => {
  assert.deepEqual(pickListing(item(listing(130), listing(125, { box: true })), "USD"), { amount: 125, seller: undefined });
  assert.deepEqual(pickListing(item(listing(130, { seller: "Card Shop" }), listing(128)), "USD"), { amount: 128, seller: undefined });
  assert.equal(pickListing(item(listing(10, { cond: "Used" })), "USD"), null, "used is never shown");
  assert.equal(pickListing(item(listing(10, { avail: "OUT_OF_STOCK" })), "USD"), null);
  assert.equal(pickListing(item(listing(10, { cur: "AUD" })), "USD"), null, "another currency is another store");
  assert.equal(pickListing({ asin: "B000000001", offersV2: null }, "USD"), null);
  assert.equal(itemsOf({ itemResults: { items: [item()] } }).length, 1);
});

test("a price is shown for 24 hours after it was fetched, never from the future", () => {
  const now = Date.parse("2026-11-05T12:00:00Z");
  assert.ok(isFreshAmazonPrice("2026-11-05T00:00:00Z", now));
  assert.ok(!isFreshAmazonPrice("2026-11-04T11:00:00Z", now));
  assert.ok(!isFreshAmazonPrice("2026-11-06T00:00:00Z", now));
  assert.ok(!isFreshAmazonPrice(undefined, now));
});

const product = (id: number, name: string, extra: Partial<Product> = {}): Product => ({ id, slug: String(id), name, kind: "sealed", setId: 1, number: null, rarity: null, attrs: {}, sealedType: null, image: null, tcgUrl: "", printings: [], ...extra });
const set: SetInfo = { id: 1, name: "Hyperia City", code: "14", slug: "hyperia-city", releasedOn: "2026-10-16", productCount: 2, upcoming: false };

test("an Amazon title matches a sealed product only as the store matcher's own product", () => {
  const box = product(1, "Hyperia City Booster Box");
  const etb = product(2, "Hyperia City Illumineer's Trove");
  const idx = buildIndex([box, etb], [set], "fraction", {});
  assert.ok(amazonTitleMatches(box, "Disney Lorcana TCG: Hyperia City Booster Box (24 Packs)", idx));
  assert.ok(!amazonTitleMatches(box, "Disney Lorcana TCG: Hyperia City Illumineer's Trove", idx), "another product");
  assert.ok(!amazonTitleMatches(box, "Disney Lorcana Hyperia City Booster Pack", idx), "a pack is not a box");
  assert.ok(!amazonTitleMatches(box, "Disney Lorcana Hyperia City Booster Box Japanese", idx), "another language");
});

test("an item link goes to the market's own Amazon with its tag", () => {
  assert.match(amazonItemUrl("B0ABCDEFGH", "US")!, /^https:\/\/www\.amazon\.com\/dp\/B0ABCDEFGH\?tag=[a-z0-9-]+-20$/);
  assert.match(amazonItemUrl("B0ABCDEFGH", "AU")!, /^https:\/\/www\.amazon\.com\.au\/dp\/B0ABCDEFGH\?tag=[a-z0-9-]+-22$/);
  assert.equal(amazonItemUrl("B0ABCDEFGH", "SG"), null, "no Amazon SG");
  assert.equal(amazonItemUrl("bad", "US"), null);
});

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));

test("the Creators API client stays script-side; only the card page reads live Amazon prices; prices are never committed", () => {
  for (const f of [...walk("src/app"), ...walk("src/components"), ...walk("src/lib")].filter((f) => /\.tsx?$/.test(f))) {
    const s = readFileSync(f, "utf8");
    if (f !== "src/lib/amazon-creators.ts") assert.ok(!/amazon-creators/.test(s), `${f} imports the Creators API client`);
    if (/import \{[^}]*\} from "@\/lib\/amazon-live"/.test(s)) assert.equal(f, "src/app/card/[slug]/page.tsx", `${f} reads live Amazon prices`);
    assert.ok(!/AMAZON_CREATORS/.test(s) || f === "src/lib/amazon-creators.ts", `${f} names the credentials`);
  }
  assert.match(readFileSync(".gitignore", "utf8"), /^data\/amazon-live\/$/m);
  assert.match(JSON.parse(readFileSync("package.json", "utf8")).scripts.build, /^\(tsx scripts\/fetch-amazon-prices\.ts \|\| true\) && next build/);
  assert.match(readFileSync("next.config.js", "utf8"), /data\/amazon-live\/\*\.json/);
  assert.match(readFileSync(".github/workflows/refresh-prices.yml", "utf8"), /scripts\/amazon-asins\.ts/);
});

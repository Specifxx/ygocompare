// Finds each sealed product's ASIN on each market's own Amazon (US, UK, CA, AU, DE for the eurozone) with the Creators
// API's searchItems, in the daily refresh (refresh-prices.yml, after the import). A result counts only when the store
// matcher (lib/import/match.ts matchSealed) reads its title as THIS product: ten results, no match, no ASIN; a wrong
// merge is worse than a missing price, as with the stores. Found ASINs and misses go in data/amazon/asins-<MARKET>.json
// (keyed by product id; ASINs may be stored, prices never are) and ride the data commit; a miss is retried after 30
// days. Without credentials it does nothing; a store whose account has no API access yet (403) ends that market quietly
// and the next still runs. data/amazon/status-<MARKET>.json says what the last run did (the ops monitor reads it).
//   npx tsx scripts/amazon-asins.ts            AMAZON_SEARCH_BUDGET=400 a market by default
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { AMAZON_STORES } from "@/lib/affiliate";
import { AmazonRefused, credentialsFor, creatorsClient, MARKETS as API } from "@/lib/amazon-creators";
import type { AsinFile } from "@/lib/amazon-live";
import { products, sets } from "@/lib/data";
import { buildIndex, matchSealed, type MatchIndex } from "@/lib/import/match";
import type { Market, Product } from "@/lib/site-types";
import { SITE } from "@/site.config";
import { API_MARKETS, marketSealed } from "./amazon-shared";

const DIR = path.join(process.cwd(), "data", "amazon");
const RECHECK_MISS_DAYS = 30;

/** Whether an Amazon title is this product and no other: the store matcher lands on it. */
export const amazonTitleMatches = (p: Pick<Product, "id">, title: string, idx: MatchIndex): boolean => matchSealed(title, idx)?.product.id === p.id;

async function market(m: Market, idx: MatchIndex) {
  const store = AMAZON_STORES[m];
  if (!store || !API[m]) return;
  const FILE = path.join(DIR, `asins-${m}.json`);
  const status = (o: object) => writeFileSync(path.join(DIR, `status-${m}.json`), JSON.stringify({ at: new Date().toISOString(), ...o }) + "\n");
  mkdirSync(DIR, { recursive: true });
  const creds = credentialsFor(m);
  if (!creds) {
    status({ state: "off" });
    return console.log(`Amazon ASINs ${m}: no AMAZON_CREATORS_* credentials yet, skipped.`);
  }
  const budget = Number(process.env.AMAZON_SEARCH_BUDGET || 400);
  const today = new Date().toISOString().slice(0, 10);
  const known: AsinFile = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};
  const list = marketSealed(m);
  const live = new Set(list.map((x) => String(x.p.id)));
  const todo = list.filter(({ p }) => {
    const k = known[String(p.id)];
    if (k?.asin) return false;
    return !k || (Date.parse(today) - Date.parse(k.checked)) / 864e5 >= RECHECK_MISS_DAYS;
  });
  const api = await creatorsClient(m, store.tag, creds).catch((e) => {
    console.log(`Amazon ASINs ${m}: ${(e as Error).message} (no Creators API access yet?), skipped.`);
    status({ state: "refused", note: (e as Error).message.slice(0, 120) });
    return null;
  });
  if (!api) return;
  let found = 0, searched = 0, refused = "";
  for (const { p } of todo.slice(0, budget)) {
    try {
      const items = await api.call("searchItems", { keywords: `${SITE.game} ${p.name}`.replace(/\s+/g, " ").trim(), resources: ["itemInfo.title"], itemCount: 10 });
      searched++;
      const hit = items.find((it) => amazonTitleMatches(p, it.itemInfo?.title?.displayValue ?? "", idx));
      known[String(p.id)] = { asin: hit?.asin ?? null, checked: today };
      if (hit) found++;
    } catch (e) {
      console.log(`Amazon ASINs ${m}: stopped at ${p.slug}: ${(e as Error).message}`);
      if (e instanceof AmazonRefused) {
        refused = (e as Error).message.slice(0, 120);
        break;
      }
    }
  }
  // Products gone from the market drop out, so the file stays the size of the catalogue.
  const out = Object.fromEntries(Object.entries(known).filter(([k]) => live.has(k)).sort(([a], [b]) => Number(a) - Number(b)));
  writeFileSync(FILE, JSON.stringify(out, null, 0).replace(/},"/g, '},\n"') + "\n");
  const asins = Object.values(out).filter((e) => e.asin).length;
  status({ state: refused && !searched ? "refused" : "ok", searched, found, known: asins, waiting: Math.max(0, todo.length - searched), ...(refused ? { note: refused } : {}) });
  console.log(`Amazon ASINs ${m}: ${searched} searched, ${found} found, ${asins} known, ${Math.max(0, todo.length - searched)} waiting.`);
}

async function main() {
  const idx = buildIndex(products(), sets(), SITE.numberStyle, { rarityMustAgree: SITE.rarityMustAgree, rarityAliases: SITE.rarityAliases, setEditions: SITE.setEditions });
  for (const m of API_MARKETS) await market(m, idx).catch((e) => console.log(`Amazon ASINs ${m} skipped: ${(e as Error).message}`));
}

if (process.argv[1] && /amazon-asins\.ts$/.test(process.argv[1])) main().catch((e) => console.log(`Amazon ASINs skipped: ${(e as Error).message}`));

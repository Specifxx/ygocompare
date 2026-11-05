// Runs first in every Vercel build: today's Amazon prices, in every market with its own Amazon (US, UK, CA, AU, EU), for the
// ASINs scripts/amazon-asins.ts found, written to data/amazon-live/<MARKET>.json (git-ignored). Amazon's licence lets a
// price be kept for 24 hours and shown with its time, so prices are fetched by each build and never committed; the product
// page shows one only while under 24 hours old (lib/amazon-live.ts) and the browser hides it after that. Most-compared
// products first, AMAZON_BUILD_CALLS getItems calls a market (ten ASINs each, one a second; 30 by default, about 35
// seconds of build each). A price under 60% or over 160% of the product's in-stock store median is dropped (a different
// count, a marketplace seller's fantasy). Without credentials, or on any error, it writes nothing and never fails the
// build; a store whose account has no API access yet (403) is skipped and the next market still runs.
//   npx tsx scripts/fetch-amazon-prices.ts
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { AMAZON_STORES } from "@/lib/affiliate";
import { AmazonRefused, credentialsFor, creatorsClient, MARKETS as API, pickListing, PRICE_RESOURCES } from "@/lib/amazon-creators";
import type { AsinFile, LiveFile } from "@/lib/amazon-live";
import type { Market } from "@/lib/site-types";
import { API_MARKETS, marketSealed, median } from "./amazon-shared";

const asinsFile = (m: Market) => path.join(process.cwd(), "data", "amazon", `asins-${m}.json`);
const OUT_DIR = path.join(process.cwd(), "data", "amazon-live");

async function market(m: Market) {
  const store = AMAZON_STORES[m];
  const api = API[m];
  if (!store || !api) return;
  const creds = credentialsFor(m);
  if (!creds || !existsSync(asinsFile(m))) return console.log(`Amazon prices ${m}: no credentials or no ASINs yet, skipped.`);
  const known = JSON.parse(readFileSync(asinsFile(m), "utf8")) as AsinFile;
  const wanted = marketSealed(m).filter((x) => known[String(x.p.id)]?.asin);
  const todo = wanted.slice(0, Number(process.env.AMAZON_BUILD_CALLS || 30) * 10);
  if (!todo.length) return console.log(`Amazon prices ${m}: no ASINs for in-stock products yet.`);
  const client = await creatorsClient(m, store.tag, creds);
  const fetchedAt = new Date().toISOString();
  const prices: LiveFile["prices"] = {};
  for (let i = 0; i < todo.length; i += 10) {
    const batch = todo.slice(i, i + 10);
    const ids = [...new Set(batch.map((x) => known[String(x.p.id)].asin!))];
    let items;
    try {
      items = await client.call("getItems", { itemIds: ids, itemIdType: "ASIN", resources: PRICE_RESOURCES });
    } catch (e) {
      console.log(`Amazon prices ${m}: ${(e as Error).message}`);
      if (e instanceof AmazonRefused) break;
      continue;
    }
    for (const x of batch) {
      const asin = known[String(x.p.id)].asin!;
      const it = items.find((it) => it.asin === asin);
      const pick = it && pickListing(it, api.currency);
      if (!pick) continue;
      const cents = Math.round(pick.amount * 100);
      const ref = median(x.prices);
      if (ref && (cents < ref * 0.6 || cents > ref * 1.6)) continue;
      prices[String(x.p.id)] = { asin, cents };
    }
  }
  if (!Object.keys(prices).length) return console.log(`Amazon prices ${m}: none (${client.calls()} calls).`);
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, `${m}.json`), JSON.stringify({ fetchedAt, prices } satisfies LiveFile) + "\n");
  console.log(`Amazon prices ${m}: ${Object.keys(prices).length} of ${todo.length} ASINs priced in ${client.calls()} calls.`);
}

async function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  for (const m of API_MARKETS) await market(m).catch((e) => console.log(`Amazon prices ${m} skipped: ${(e as Error).message}`));
}

main().catch((e) => console.log(`Amazon prices skipped: ${(e as Error).message}`));

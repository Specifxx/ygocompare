// Pings IndexNow (Bing, Yandex, Seznam…) with the pages that change daily.
// Bing Webmaster Tools also reads the sitemap; this just gets fresh prices
// recrawled sooner.
import fs from "node:fs";
import path from "node:path";
import { SITE } from "@/site.config";
import type { Catalog } from "@/lib/site-types";

async function main() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return console.log("[indexnow] INDEXNOW_KEY not set — skipped");
  const site = (process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE.domain}`).replace(/\/$/, "");
  const cat = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/public/catalog.json"), "utf8")) as Catalog;
  const recent = cat.sets.slice(0, 4).map((s) => `${site}/sets/${s.slug}`);
  const urls = [site, `${site}/movers`, `${site}/deals`, `${site}/preorders`, `${site}/sealed`, ...recent];
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/indexnow-key.txt`, urlList: urls }),
  });
  console.log(`[indexnow] ${res.status} for ${urls.length} URLs`);
}
main();

// Finds which candidate stores sell English Yu-Gi-Oh! TCG product through
// Shopify, and in which collections. Run by .github/workflows/probe-stores.yml
// (GitHub's runners can reach the stores); prints a ready-to-review
// src/content/stores.ts listing and writes research/ygo-stores-probe.json.
// It never changes the site: a person reads the result and copies stores in.
//
//   npx tsx scripts/probe-stores.ts [--tcgcsv]
//
// Candidates: research/candidate-hosts.txt (every store the sister sites
// track, plus the CompareEmpire ygocompare prototype's list).
import fs from "node:fs";
import path from "node:path";
import { fetchJson, sleep } from "@/lib/import/http";
import { numbersInTitle } from "@/lib/import/match";
import { SITE } from "@/site.config";
import { TCGCSV_INIT } from "@/lib/import/tcgcsv";

const MARKET: Record<string, string> = { USD: "US", GBP: "UK", CAD: "CA", AUD: "AU", EUR: "EU", SGD: "SG" };
const YGO_HANDLE = /yu-?gi-?oh|yugioh|\bygo\b|ygo-/i;
const NOT_TCG = /japan|\bjp\b|korean|\bkr\b|\bocg\b|rush|asian|chinese|sleeve|accessor|playmat|binder|deck-?box|graded|psa|bgs|cgc|figure|plush|manga|anime|video|game-?boy|nintendo|switch|ps[45]|pre-?owned|bulk|lot/i;
const YGO_TITLE = /yu-?gi-?oh|yugioh|structure deck|booster box|\bmega tin\b/i;

interface Collection { handle: string; title: string; products_count?: number }
interface Found {
  key: string;
  name: string;
  base: string;
  market: string;
  collections: { handle: string; count: number | null; ygo: number; sample: number; sealed: number; singles: number }[];
  sampleTitles: string[];
}

async function probe(host: string): Promise<Found | { host: string; skip: string }> {
  const base = host.replace(/\/$/, "");
  let meta: { name?: string; currency?: string; myshopify_domain?: string };
  try {
    meta = await fetchJson(`${base}/meta.json`, {}, 1);
  } catch (e) {
    return { host, skip: `not Shopify (${(e as Error).message.slice(-60)})` };
  }
  const market = MARKET[meta.currency ?? ""];
  if (!market) return { host, skip: `currency ${meta.currency}` };
  const cols: Collection[] = [];
  for (let page = 1; page <= 10; page++) {
    try {
      const d = await fetchJson<{ collections: Collection[] }>(`${base}/collections.json?limit=250&page=${page}`, {}, 1);
      cols.push(...d.collections);
      if (d.collections.length < 250) break;
    } catch {
      break;
    }
  }
  const cands = cols
    .filter((c) => YGO_HANDLE.test(`${c.handle} ${c.title}`) && !NOT_TCG.test(`${c.handle} ${c.title}`))
    .sort((a, b) => (b.products_count ?? 0) - (a.products_count ?? 0))
    .slice(0, 8);
  const found: Found["collections"] = [];
  const samples: string[] = [];
  for (const c of cands) {
    try {
      const d = await fetchJson<{ products: { title: string; product_type: string }[] }>(`${base}/collections/${c.handle}/products.json?limit=40`, {}, 1);
      const titles = d.products.map((p) => `${p.title} ${p.product_type}`);
      if (!titles.length) continue;
      const singles = d.products.filter((p) => numbersInTitle(p.title, "ygo").length).length;
      const foreign = d.products.filter((p) => /\b[A-Z0-9]{2,5}-(DE|FR|IT|PT|SP|JP|KR|AE)\d/.test(p.title) || /japanese|korean|asian english/i.test(p.title)).length;
      const ygo = titles.filter((t) => YGO_TITLE.test(t)).length + singles;
      const sealed = d.products.filter((p) => /booster|structure deck|\btin\b|box|pack|special edition|deck/i.test(p.title) && !numbersInTitle(p.title, "ygo").length).length;
      if (ygo / titles.length < 0.5 || foreign / titles.length > 0.3) continue;
      found.push({ handle: c.handle, count: c.products_count ?? null, ygo, sample: titles.length, sealed, singles });
      samples.push(...d.products.slice(0, 4).map((p) => p.title));
    } catch {}
    await sleep(300);
  }
  if (!found.length) return { host, skip: `no Yu-Gi-Oh! collection (${cands.length} candidates)` };
  const name = meta.name ?? host;
  const key = (new URL(base).hostname.replace(/^www\.|^store\.|^shop\./, "").split(".")[0] || name).replace(/[^a-z0-9]/gi, "").toLowerCase();
  return { key, name, base, market, collections: found, sampleTitles: samples.slice(0, 12) };
}

/** The largest collection, plus a sealed or singles one when the largest is
 *  clearly only the other kind. Overlap costs pages, not accuracy (the import
 *  dedupes products). */
function pick(f: Found): { handles: string[]; kind: "singles" | "sealed" | "both" } {
  const byCount = f.collections.slice().sort((a, b) => (b.count ?? b.sample) - (a.count ?? a.sample));
  const top = byCount[0];
  const handles = [top.handle];
  const topSingles = top.singles / top.sample > 0.5;
  const topSealed = top.sealed / top.sample > 0.5;
  if (topSingles) {
    const s = byCount.find((c) => c !== top && c.sealed / c.sample > 0.5);
    if (s) handles.push(s.handle);
  } else if (topSealed) {
    const s = byCount.find((c) => c !== top && c.singles / c.sample > 0.5);
    if (s) handles.push(s.handle);
  }
  const all = f.collections.filter((c) => handles.includes(c.handle));
  const singles = all.some((c) => c.singles > 0);
  const sealed = all.some((c) => c.sealed > 0);
  return { handles, kind: singles && sealed ? "both" : singles ? "singles" : "sealed" };
}

async function tcgcsvSize() {
  const BASE = "https://tcgcsv.com/tcgplayer";
  const cat = SITE.tcgcsvCategoryId;
  const groups = (await fetchJson<{ results: { groupId: number; name: string; publishedOn: string }[] }>(`${BASE}/${cat}/groups`, TCGCSV_INIT)).results;
  let cards = 0, sealed = 0, overFloor = 0, over10 = 0, over20 = 0;
  const rarities = new Map<string, number>();
  const printings = new Map<string, number>();
  const numbers: string[] = [];
  for (const g of groups) {
    const [prods, prices] = await Promise.all([
      fetchJson<{ results: { productId: number; name: string; extendedData: { name: string; value: string }[] }[] }>(`${BASE}/${cat}/${g.groupId}/products`, TCGCSV_INIT),
      fetchJson<{ results: { productId: number; marketPrice: number | null; midPrice: number | null; lowPrice: number | null; subTypeName: string }[] }>(`${BASE}/${cat}/${g.groupId}/prices`, TCGCSV_INIT),
    ]);
    const best = new Map<number, number>();
    for (const p of prices.results) {
      printings.set(p.subTypeName, (printings.get(p.subTypeName) ?? 0) + 1);
      const v = p.marketPrice ?? p.midPrice ?? p.lowPrice ?? 0;
      best.set(p.productId, Math.max(best.get(p.productId) ?? 0, v));
    }
    for (const p of prods.results) {
      const ext = Object.fromEntries(p.extendedData.map((e) => [e.name, e.value]));
      if (!ext.Number) { sealed++; continue; }
      cards++;
      if (numbers.length < 40 && Math.random() < 0.01) numbers.push(`${ext.Number} | ${p.name} | ${ext.Rarity}`);
      if (ext.Rarity) rarities.set(ext.Rarity, (rarities.get(ext.Rarity) ?? 0) + 1);
      const v = best.get(p.productId) ?? 0;
      if (v >= 1) overFloor++;
      if (v >= 10) over10++;
      if (v >= 20) over20++;
    }
    await sleep(100);
  }
  const ext = (await fetchJson<{ results: { extendedData: { name: string }[] }[] }>(`${BASE}/${cat}/${groups[0].groupId}/products`, TCGCSV_INIT)).results.flatMap((p) => p.extendedData.map((e) => e.name));
  console.log(JSON.stringify({ groups: groups.length, cards, sealed, cardsAtLeast1usd: overFloor, cardsAtLeast10usd: over10, cardsAtLeast20usd: over20, rarities: Object.fromEntries([...rarities].sort((a, b) => b[1] - a[1])), printings: Object.fromEntries(printings), extendedFields: [...new Set(ext)], sampleNumbers: numbers }, null, 1));
}

async function main() {
  if (process.argv.includes("--tcgcsv")) {
    await tcgcsvSize().catch((e) => console.error(`[tcgcsv] ${(e as Error).message}`));
  }
  const hosts = fs.readFileSync(path.join(process.cwd(), "research/candidate-hosts.txt"), "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
  const queue = hosts.slice();
  const results: (Found | { host: string; skip: string })[] = [];
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (queue.length) {
      const h = queue.shift()!;
      const r = await probe(h).catch((e) => ({ host: h, skip: (e as Error).message }));
      results.push(r);
      console.log("key" in r ? `[ok] ${r.base} ${r.market} ${r.collections.map((c) => `${c.handle}(${c.count ?? "?"})`).join(" ")}` : `[--] ${r.host}: ${r.skip}`);
    }
  }));
  const ok = results.filter((r): r is Found => "key" in r).sort((a, b) => a.market.localeCompare(b.market) || a.key.localeCompare(b.key));
  fs.writeFileSync(path.join(process.cwd(), "research/ygo-stores-probe.json"), JSON.stringify({ probedOn: new Date().toISOString().slice(0, 10), stores: ok }, null, 1) + "\n");
  const used = new Set<string>();
  console.log("\n===== STORES.TS =====");
  for (const f of ok) {
    let key = f.key;
    while (used.has(key)) key += "x";
    used.add(key);
    const { handles, kind } = pick(f);
    console.log(`  { key: ${JSON.stringify(key)}, name: ${JSON.stringify(f.name)}, base: ${JSON.stringify(f.base)}, market: "${f.market}", collections: ${JSON.stringify(handles)}, kind: "${kind}" },`);
  }
  console.log("===== END =====\n");
  console.log("===== SAMPLE TITLES =====");
  for (const f of ok) console.log(`${f.key}: ${f.sampleTitles.join(" || ")}`);
  console.log(`\n${ok.length} of ${hosts.length} candidates sell Yu-Gi-Oh! through Shopify.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

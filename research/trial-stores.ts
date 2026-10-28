// TEMP research script (2026-10-28 store audit; not engine code, removed before
// merge): which candidate stores sell this site's game in a form the REAL
// matcher prices. For each host: Shopify meta.json (currency -> market), its
// collections whose handle or title names the game, page 1 of each run through
// matchCard/matchSealed against data/public/catalog.json, then the fewest
// collections that cover what matched.
//
//   npx tsx research/trial-stores.ts --game gundam --in probe-in/US.json --out probe-out/US.json
import fs from "node:fs";
import path from "node:path";
import { fetchJson, sleep } from "@/lib/import/http";
import { storeCurrency } from "@/lib/import/shopify";
import { buildIndex, isUnfitListing, looksSealed, matchCard, matchSealed } from "@/lib/import/match";
import { SITE } from "@/site.config";
import type { Catalog, StoreConfig } from "@/lib/site-types";

const arg = (f: string) => {
  const i = process.argv.indexOf(f);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const GAMES: Record<string, { re: RegExp; not?: RegExp }> = {
  gundam: { re: /gundam/i, not: /gunpla|model[- ]?kit|plamo|figure|\bhg\b|\bmg\b|\brg\b|\bpg\b|high-?grade|master-?grade|real-?grade|perfect-?grade|\bsd\b|bandai-?spirits|hobby-?kit/i },
  lorcana: { re: /lorcana/i },
  ygo: { re: /yu-?gi-?oh|yugioh|\bygo\b|ygo-/i },
};
const game = GAMES[arg("--game") ?? ""];
if (!game) throw new Error("--game gundam|lorcana|ygo");
const NOT_TCG = /japan|\bjp\b|korean|\bkr\b|chinese|\bocg\b|rush-?duel|sleeve|accessor|playmat|binder|deck-?box|graded|\bpsa\b|\bbgs\b|\bcgc\b|plush|manga|video-?game|pre-?owned|bulk|\blots?\b|\bvintage\b/i;
const CUR_MARKET: Record<string, StoreConfig["market"]> = { USD: "US", GBP: "UK", CAD: "CA", AUD: "AU", EUR: "EU", SGD: "SG" };
const ISO: Record<string, string> = { US: "US", UK: "GB", CA: "CA", AU: "AU", SG: "SG", EU: "ES" };

interface Cand { key?: string; name: string; base: string; market: string }
interface Product { id: number; title: string; handle: string; product_type: string; tags: string[] | string; variants: { available: boolean; price: string }[] }

const catalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/public/catalog.json"), "utf8")) as Catalog;
const idx = buildIndex(catalog.products, catalog.sets, SITE.numberStyle, { rarityMustAgree: SITE.rarityMustAgree, rarityAliases: SITE.rarityAliases });

function matchOne(p: Product): { id: number; sealed: boolean } | null {
  if (isUnfitListing(p.title)) return null;
  const tags = Array.isArray(p.tags) ? p.tags : String(p.tags || "").split(",");
  const sealed = looksSealed(p.title, p.product_type || "");
  const m = sealed ? matchSealed(p.title, idx) : matchCard(p.title, idx, `${p.product_type} | ${tags.join(" | ")}`);
  return m ? { id: m.product.id, sealed: m.product.kind !== "card" } : null;
}

async function probe(c: Cand) {
  const base = c.base.replace(/\/+$/, "");
  const host = new URL(base).hostname.replace(/^www\./, "");
  let meta: { name?: string; currency?: string };
  try {
    meta = await fetchJson(`${base}/meta.json`, {}, 2);
  } catch (e) {
    return { host, base, ok: false, reason: `not Shopify or unreachable (${(e as Error).message.slice(-80)})` };
  }
  const market = (c.market && CUR_MARKET[meta.currency ?? ""] === c.market ? c.market : CUR_MARKET[meta.currency ?? ""]) as StoreConfig["market"] | undefined;
  if (!market) return { host, base, ok: false, reason: `currency ${meta.currency}` };
  const cols: { handle: string; title: string; products_count?: number }[] = [];
  for (let page = 1; page <= 8; page++) {
    try {
      const d = await fetchJson<{ collections: typeof cols }>(`${base}/collections.json?limit=250&page=${page}`, {}, 2);
      cols.push(...d.collections);
      if (d.collections.length < 250) break;
    } catch {
      break;
    }
  }
  const cands = cols
    .filter((x) => game.re.test(`${x.handle} ${x.title}`) && !(game.not?.test(`${x.handle} ${x.title}`)) && !NOT_TCG.test(`${x.handle} ${x.title}`))
    .sort((a, b) => (b.products_count ?? 0) - (a.products_count ?? 0))
    .slice(0, 10);
  if (!cands.length) return { host, base, market, ok: false, reason: `no ${arg("--game")} collection (${cols.length} collections)` };
  const per: { handle: string; count: number | null; read: number; matched: Set<number>; inStock: Set<number>; sealed: number; singles: number }[] = [];
  const samples: string[] = [];
  for (const col of cands) {
    try {
      const d = await fetchJson<{ products: Product[] }>(`${base}/collections/${col.handle}/products.json?limit=250&country=${ISO[market]}`, {}, 2);
      const r = { handle: col.handle, count: col.products_count ?? null, read: d.products.length, matched: new Set<number>(), inStock: new Set<number>(), sealed: 0, singles: 0 };
      for (const p of d.products) {
        const m = matchOne(p);
        if (!m) continue;
        r.matched.add(p.id);
        if (p.variants.some((v) => v.available)) r.inStock.add(p.id);
        if (m.sealed) r.sealed++;
        else r.singles++;
        if (samples.length < 6) samples.push(p.title);
      }
      per.push(r);
    } catch {}
    await sleep(250);
  }
  // Fewest collections: biggest matched first, then any that adds 20%+ new products.
  per.sort((a, b) => b.matched.size - a.matched.size);
  const chosen: typeof per = [];
  const covered = new Set<number>();
  for (const r of per) {
    if (r.matched.size < 2 || r.matched.size / Math.max(1, r.read) < 0.2) continue;
    const fresh = [...r.matched].filter((id) => !covered.has(id)).length;
    if (chosen.length && fresh < Math.max(3, r.matched.size * 0.2)) continue;
    chosen.push(r);
    r.matched.forEach((id) => covered.add(id));
    if (chosen.length >= 4) break;
  }
  const inStock = new Set(chosen.flatMap((r) => [...r.inStock])).size;
  const singles = chosen.reduce((a, r) => a + r.singles, 0);
  const sealed = chosen.reduce((a, r) => a + r.sealed, 0);
  let currency: string | null = null;
  try {
    currency = await storeCurrency({ key: "probe", name: host, base, market, collections: [], kind: "both" });
  } catch {}
  const currencyOk = !currency || currency === ({ US: "USD", UK: "GBP", CA: "CAD", AU: "AUD", EU: "EUR", SG: "SGD" } as const)[market];
  const ok = covered.size >= 5 && inStock >= 3 && currencyOk;
  return {
    host, base, market, ok, name: meta.name ?? c.name, existingKey: c.key ?? null,
    collections: chosen.map((r) => r.handle),
    kind: singles && sealed ? "both" : singles ? "singles" : "sealed",
    matched: covered.size, inStock, currency,
    reason: ok ? null : !currencyOk ? `charges ${currency}` : `matched ${covered.size}, in stock ${inStock}`,
    tried: per.map((r) => `${r.handle}(${r.count ?? "?"}):${r.matched.size}/${r.read}`),
    samples,
  };
}

async function main() {
  const input = JSON.parse(fs.readFileSync(arg("--in")!, "utf8")) as Cand[];
  const out = arg("--out")!;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const queue = input.slice();
  const results: unknown[] = [];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (queue.length) {
        const c = queue.shift()!;
        const r = await probe(c).catch((e) => ({ host: c.base, ok: false, reason: (e as Error).message.slice(0, 200) }));
        results.push(r);
        console.log(JSON.stringify(r));
        fs.writeFileSync(out, JSON.stringify(results, null, 1));
      }
    }),
  );
  fs.writeFileSync(out, JSON.stringify(results, null, 1));
  console.log(`${(results as { ok: boolean }[]).filter((r) => r.ok).length} of ${results.length} pass.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

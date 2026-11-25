// Copies DexCompare's and MTG Compare's measured store shipping onto YGO Compare's stores (src/lib/borrowed-shipping.ts), for Best
// Basket. Run by refresh-prices.yml before its data commit; never fatal: a sister that cannot be read leaves the previous file as it
// is. Reads the sisters' PUBLIC main branches from raw.githubusercontent.com (or SISTER_SHIPPING_DIR, a folder holding
// <from>/shipping-rates.json and <from>/stores.json, for tests and local runs). Writes data/shipping/borrowed.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { SITE } from "../src/site.config";
import { CURRENCY } from "../src/lib/site-types";
import { borrow, validBorrowed } from "../src/lib/borrowed-shipping";

const SISTERS = [
  { from: "dexcompare", raw: "https://raw.githubusercontent.com/Specifxx/CompareEmpire/main/apps/dexcompare-sealed/src/data" },
  { from: "mtgcompare", raw: "https://raw.githubusercontent.com/Specifxx/mtgcompare/main/src/data" },
];
const OUT = path.join(process.cwd(), "data/shipping/borrowed.json");

async function read(base: string, from: string, file: string): Promise<unknown> {
  const dir = process.env.SISTER_SHIPPING_DIR;
  if (dir) return JSON.parse(readFileSync(path.join(dir, from, file), "utf8"));
  const r = await fetch(`${base}/${file}`, { signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`${from}/${file}: HTTP ${r.status}`);
  return r.json();
}

async function main() {
  const sisters = [];
  for (const s of SISTERS) {
    try {
      const [snapshot, stores] = await Promise.all([read(s.raw, s.from, "shipping-rates.json"), read(s.raw, s.from, "stores.json")]);
      const list = (Array.isArray(stores) ? stores : (stores as { stores?: unknown[] }).stores ?? []) as { key: string; base: string; market: string }[];
      sisters.push({ from: s.from, stores: list, snapshot: snapshot as never });
    } catch (e) {
      console.warn(`[borrow-shipping] ${s.from} skipped:`, (e as Error).message);
    }
  }
  if (!sisters.length) {
    console.warn("[borrow-shipping] no sister could be read; keeping the previous file");
    return;
  }
  const ours = SITE.stores.map((s) => ({ key: s.key, base: s.base, market: s.market }));
  const out = borrow(ours, sisters, (m) => (CURRENCY as Record<string, string>)[m] ?? null, new Date());
  // One sister unread: keep its stores from the previous file rather than drop them for a day.
  if (sisters.length < SISTERS.length && existsSync(OUT)) {
    const prev = validBorrowed(JSON.parse(readFileSync(OUT, "utf8")));
    for (const [k, v] of Object.entries(prev.stores)) if (!out.stores[k]) out.stores[k] = v;
  }
  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out) + "\n");
  console.log(`[borrow-shipping] ${Object.keys(out.stores).length} of ${ours.length} stores have a measured rate`);
}

main().catch((e) => {
  console.warn("[borrow-shipping] failed:", e);
});

// The loader behind the Black Friday / Cyber Monday pages' one deal list (lib/sale-deals.ts). Candidates are the products the old
// lists drew on: deals() (US stores under TCGplayer's market price) and storeDealsIn() (each market's stores under their own
// middle price). Each candidate's ONE row uses the cheapest in-stock store price in its market, and both discounts are measured
// against that price. Server only (reads the data files).
import { SITE } from "@/site.config";
import { deals, historyThrough, meta, priceOf, setById, storeDealsIn, storeLowsOf } from "@/lib/data";
import { ebaySearchUrl, goHref } from "@/lib/affiliate";
import { ebayQueryOf, lineOfSet } from "@/lib/lines";
import { imageAt } from "@/lib/image";
import { shortName } from "@/lib/names";
import { sourceNameServer } from "@/lib/sources";
import { CURRENCY, MARKETS, type Market, type Offer, type Product } from "@/lib/site-types";
import type { SaleDealRow } from "@/lib/sale-deals";

const SPARK_DAYS = 30;
// Per country and basis, the list keeps the strongest this many (DexCompare's list reads 48 + 36): every row ships to the browser
// for the filters, so the page stays light (LCP under 2.5 s).
const TAKE = 48;
const EBAY_MARKETS = new Set(["US", "UK", "AU", "CA"]);

function cheapestStoreOffer(p: Product, m: Market): Offer | null {
  let best: Offer | null = null;
  for (const o of priceOf(p.id).offers) {
    if (o.market !== m || o.currency !== CURRENCY[m] || !o.inStock) continue;
    if (o.source === "ebay" || o.source === "amazon" || o.source === "tcgplayer") continue;
    if (!best || o.cents < best.cents) best = o;
  }
  return best;
}

export function saleDealRows(page: string): SaleDealRow[] {
  const kind = SITE.sealedOnly ? "sealed" : undefined;
  const tcgBy = new Map<number, { p: Product; market: number }>();
  for (const d of deals(400)) if (d.offer.source !== "ebay" && d.offer.source !== "amazon" && !tcgBy.has(d.p.id)) tcgBy.set(d.p.id, { p: d.p, market: d.market });
  const have = new Set(SITE.stores.map((s) => s.market));
  const medBy = new Map<string, { p: Product; median: number; stores: number }>();
  for (const m of MARKETS) {
    if (!have.has(m)) continue;
    for (const d of storeDealsIn(m, 400, kind)) medBy.set(`${m}:${d.p.id}`, { p: d.p, median: d.median, stores: d.stores });
  }
  const keys = new Set<string>([...[...tcgBy.keys()].map((id) => `US:${id}`), ...medBy.keys()]);
  const stores = meta()?.stores ?? {};
  const updated = meta()?.updatedAt ?? null;
  const through = historyThrough();
  const out: SaleDealRow[] = [];
  for (const key of keys) {
    const [m, idText] = key.split(":") as [Market, string];
    const id = Number(idText);
    const p = tcgBy.get(id)?.p ?? medBy.get(key)?.p;
    if (!p) continue;
    const offer = cheapestStoreOffer(p, m);
    if (!offer) continue;
    const price = offer.cents;
    const t = m === "US" ? tcgBy.get(id) : undefined;
    const tPct = t ? Math.round((1 - price / t.market) * 100) : null;
    const tcg = t && tPct != null && tPct >= 8 && tPct <= 60 ? { pct: tPct, cents: t.market } : null;
    const md = medBy.get(key);
    const mPct = md ? Math.round((1 - price / md.median) * 100) : null;
    const median = md && mPct != null && mPct >= 10 && mPct <= 45 ? { pct: mPct, cents: md.median, stores: md.stores } : null;
    if (!tcg && !median) continue;
    const set = setById(p.setId);
    const line = lineOfSet(set);
    const name = shortName(p.name);
    const lows = storeLowsOf(p)[m] ?? [];
    const byDay = new Map(lows.map(([d, c]) => [d, c]));
    const spark: (number | null)[] = [];
    for (let d = through - SPARK_DAYS + 1; d <= through; d++) spark.push(byDay.get(d) ?? null);
    const ebayHref = EBAY_MARKETS.has(m)
      ? goHref({ url: ebaySearchUrl(`${ebayQueryOf(set)} ${name}`.trim(), m as "US" | "UK" | "AU" | "CA"), source: "ebay", market: m }, p.id, `${page}_list_ebay`)
      : null;
    out.push({
      key,
      id: p.id,
      slug: p.slug,
      name,
      game: line ? line.short : null,
      productType: p.sealedType ?? (p.kind === "card" ? "Card" : "Sealed"),
      imageUrl: imageAt(p.image, "200w"),
      market: m,
      currency: offer.currency,
      preorder: !!offer.preorder,
      priceCents: price,
      storeName: sourceNameServer(offer),
      buyHref: goHref(offer, p.id, `${page}_list`),
      ebayHref,
      checkedAt: stores[offer.source]?.at ?? updated,
      shipCents: typeof offer.shippingCents === "number" ? offer.shippingCents : null,
      tcg,
      median,
      spark,
    });
  }
  const keep = new Set<string>();
  for (const m of new Set(out.map((r) => r.market))) {
    for (const b of ["tcg", "median"] as const) {
      out
        .filter((r) => r.market === m && r[b])
        .sort((x, y) => y[b]!.pct - x[b]!.pct || x.priceCents - y.priceCents)
        .slice(0, TAKE)
        .forEach((r) => keep.add(r.key));
    }
  }
  return out.filter((r) => keep.has(r.key));
}

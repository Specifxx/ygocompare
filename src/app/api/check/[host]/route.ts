import { meta, priceOf, products } from "@/lib/data";
import { linkPath, medianCents, normaliseHost, variantOf, type CheckOffer, type CheckProduct, type StoreCheck } from "@/lib/link-check";
import { CURRENCY, type Market, type Offer, type StoreConfig } from "@/lib/site-types";
import { SITE } from "@/site.config";

// GET /api/check/<host>: one store's listings, for the "Is this a good price?" checker (components/LinkChecker.tsx). The visitor
// pastes a product link; the browser asks for that store's listings here, with each product's cheapest and median in-stock store
// price in the store's market, and finds the pasted one. Only a store in SITE.stores answers; any other host is a 404. Never fetches
// the store: these are the committed price files (lib/data.ts), eBay and TCGplayer never count as a store.
//
// A plain function cached by Vercel's CDN for a day (data only changes with a release, which empties it), never ISR. The first miss
// on an instance reads every price shard once and keeps the per-store lists. /api/ is disallowed in robots.txt.
export const dynamic = "force-dynamic";

const CDN = "public, s-maxage=86400, stale-while-revalidate=86400";
const headers = { "Cache-Control": "public, max-age=3600", "CDN-Cache-Control": CDN, "Vercel-CDN-Cache-Control": CDN };

const BY_HOST = new Map<string, StoreConfig>(SITE.stores.map((s) => [normaliseHost(new URL(s.base).hostname), s]));
const STORE_KEYS = new Set(SITE.stores.map((s) => s.key));

/** A product's key in the check: its slug, and its printing when it is not the normal one (a foil is its own price). */
const keyOf = (slug: string, printing?: string) => (printing && printing !== "Normal" ? `${slug}|${printing}` : slug);

interface StoreRows {
  offers: CheckOffer[];
  products: Record<string, CheckProduct>;
}

let built: Map<string, StoreRows> | null = null;

function build(): Map<string, StoreRows> {
  const out = new Map<string, StoreRows>();
  for (const p of products()) {
    const offers = priceOf(p.id).offers.filter((o) => STORE_KEYS.has(o.source));
    if (!offers.length) continue;
    const stats = new Map<string, CheckProduct>();
    const statFor = (o: Offer): CheckProduct => {
      const k = `${o.market}|${keyOf(p.slug, o.printing)}`;
      let st = stats.get(k);
      if (!st) {
        const same = offers.filter((x) => x.market === o.market && keyOf(p.slug, x.printing) === keyOf(p.slug, o.printing));
        const open = same.filter((x) => x.inStock).map((x) => x.cents);
        st = {
          name: o.printing && o.printing !== "Normal" ? `${p.name} (${o.printing})` : p.name,
          href: `/card/${p.slug}`,
          cheapestCents: open.length ? Math.min(...open) : null,
          medianCents: open.length >= 2 ? medianCents(open) : null,
          inStockStores: new Set(same.filter((x) => x.inStock).map((x) => x.source)).size,
          listedStores: new Set(same.map((x) => x.source)).size,
        };
        stats.set(k, st);
      }
      return st;
    };
    for (const o of offers) {
      let path = "";
      try {
        path = linkPath(new URL(o.url).pathname);
      } catch {
        continue;
      }
      let rows = out.get(o.source);
      if (!rows) out.set(o.source, (rows = { offers: [], products: {} }));
      const key = keyOf(p.slug, o.printing);
      rows.offers.push([path, key, o.cents, o.inStock ? 1 : 0, variantOf(o.url)]);
      rows.products[key] ??= statFor(o);
    }
  }
  return out;
}

export function GET(_req: Request, { params }: { params: { host: string } }) {
  const store = BY_HOST.get(normaliseHost(decodeURIComponent(params.host)));
  if (!store) return Response.json({ error: "not a store we read" }, { status: 404, headers });
  const rows = (built ??= build()).get(store.key) ?? { offers: [], products: {} };
  const body: StoreCheck = {
    v: 1,
    store: store.key,
    name: store.name,
    region: store.market,
    currency: CURRENCY[store.market as Market],
    checkedAt: meta()?.stores?.[store.key]?.at ?? null,
    offers: rows.offers,
    products: rows.products,
  };
  return Response.json(body, { headers });
}

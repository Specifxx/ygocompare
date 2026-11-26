import { NextResponse } from "next/server";
import { products, refCents, setById, summaryOf } from "@/lib/data";
import { money } from "@/lib/format";
import { shortName } from "@/lib/names";
import { tokens } from "@/lib/slug";
import { kitBestByMarket, kitImage, kits } from "@/lib/kits";
import { correctWords, expandSynonyms } from "@/lib/search-fuzzy";

// A plain function on Vercel caches only through its CDN header (Rift Compare,
// "Cached pages refresh every 6 to 24 hours"): six hours at the edge.
export const dynamic = "force-dynamic";

// Each product's search tokens, built once per server instance: tokenising all
// ~17,000 names on every query cost ~40 ms of CPU per keystroke.
let index: { hay: string[]; set: Set<string> }[] | null = null;
function haystacks() {
  return (index ??= products().map((p) => {
    const hay = tokens(`${p.name} ${setById(p.setId)?.name ?? ""} ${setById(p.setId)?.code ?? ""} ${p.number ?? ""}`);
    return { hay, set: new Set(hay) };
  }));
}

// Every catalogue word and how many products carry it: what a misspelt word is corrected to (lib/search-fuzzy.ts).
let vocab: Map<string, number> | null = null;
function words() {
  if (vocab) return vocab;
  vocab = new Map();
  for (const { set } of haystacks()) for (const w of set) if (w.length >= 3 && !/^\d+$/.test(w)) vocab.set(w, (vocab.get(w) ?? 0) + 1);
  return vocab;
}

let kitIndex: Set<string>[] | null = null;
/** Model kits (SITE.kits) whose name, grade, scale or JAN hold every word. */
function kitHits(want: string[], limit: number) {
  if (!want.length) return [];
  const all = kits();
  const idx = (kitIndex ??= all.map((k) => new Set(tokens(`${k.name} ${k.grade ?? ""} ${k.scale ?? ""} ${k.jan}`))));
  const out = [];
  for (let i = 0; i < all.length && out.length < limit; i++) {
    const set = idx[i];
    if (!want.every((w) => set.has(w) || [...set].some((h) => h.startsWith(w)))) continue;
    const k = all[i];
    const best = kitBestByMarket(k.jan)[0];
    out.push({ slug: k.slug, href: `/kit/${k.slug}`, name: k.name, set: "Model kit", image: k.image ? kitImage(k.image, 120) : null, price: best ? money(best.cents, best.currency) : "—", kind: "kit", number: null, rarity: null });
  }
  return out;
}

// A case, display or "set of N" holds several of the product; its price outranked the box itself, so "booster box" listed
// cases first (owner, 2026-11-26: sealed search must find the product). Multiples rank under the single unit unless the
// words ask for them ("booster box case", "display").
// "Booster Display" is the box itself on Bandai's and Lorcana's shelves, so only a display of decks, tins or packs counts.
const isBulk = (name: string) => /\b(case|set of \d+)\b|\(\d+\s*(boxes|packs|decks)\)|(?<!booster )\bdisplay\b/i.test(name);
const asksBulk = (q: string) => /\b(case|cases|display|displays|set of)\b/i.test(q);

export function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").slice(0, 80);
  const bulkUnwanted = !asksBulk(q);
  // /sealed's keyword box (SealedSearch.tsx) asks for sealed product only.
  const onlySealed = u.searchParams.get("kind") === "sealed";
  const limit = Math.min(60, Number(u.searchParams.get("limit") ?? 8) || 8);
  const want = tokens(q);
  if (u.searchParams.get("kind") === "kit")
    return NextResponse.json({ hits: kitHits(want, limit) }, { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } });
  const numQ = q.match(/\d+\s*\/\s*\d+|[A-Z]{1,4}\d{0,2}-\d{2,3}/i)?.[0]?.replace(/\s/g, "").toUpperCase();
  const idQ = /^\s*\d{5,14}\s*$/.test(q) ? q.trim() : null;
  const all = products();
  const run = (want: string[]) => {
    const scored: { s: number; i: number }[] = [];
    const idx = want.length ? haystacks() : [];
    if (want.length) {
      all.forEach((p, i) => {
        if (onlySealed && p.kind !== "sealed") return;
        const { hay, set } = idx[i];
        let hit = 0;
        for (const w of want) if (set.has(w) || hay.some((h) => h.startsWith(w))) hit++;
        if (numQ && p.number?.toUpperCase() === numQ) hit += want.length;
        // A barcode or TCGplayer id typed whole finds its product (lib/gtin.ts): exact only, so "2025" matches no id.
        if (idQ && (p.upc === idQ || (p.upc && p.upc.replace(/^0/, "") === idQ.replace(/^0/, "")) || String(p.id) === idQ)) hit = want.length + 2;
        if (hit < want.length) return;
        const ref = refCents(p.id) ?? 0;
        scored.push({ s: hit * 10 + Math.log10(1 + ref) + (p.kind === "card" ? 0.5 : 0) - (bulkUnwanted && isBulk(p.name) ? 3 : 0), i });
      });
    }
    return scored.sort((a, b) => b.s - a.s);
  };
  const hitOf = (i: number) => {
    const p = all[i];
    return { slug: p.slug, href: `/card/${p.slug}`, name: shortName(p.name), set: setById(p.setId)?.name ?? "", image: p.image, price: money(refCents(p.id)), kind: p.kind, number: p.number, rarity: p.rarity };
  };
  // Synonyms first ("bb" → booster box), then, if nothing matched, the nearest catalogue word for each word that matched nothing.
  const syn = expandSynonyms(want);
  let scored = run(syn);
  let fixed: string | null = null;
  if (!scored.length && syn.length && !idQ) {
    const known = (w: string) => haystacks().some(({ set, hay }) => set.has(w) || hay.some((h) => h.startsWith(w)));
    const better = correctWords(syn, known, words());
    if (better) {
      const again = run(better);
      if (again.length) {
        scored = again;
        fixed = better.join(" ");
      }
    }
  }
  // Still nothing: the most widely stocked products, labelled "popular" by the box, never a dead end.
  let popular = false;
  if (!scored.length && want.length) {
    popular = true;
    scored = all
      .map((p, i) => ({ s: summaryOf(p.id).inStockSources * 10 + Math.log10(1 + (refCents(p.id) ?? 0)), i }))
      .filter((x) => x.s >= 10)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6);
  }
  const hits = scored.slice(0, limit).map(({ i }) => hitOf(i));
  // Kits fill what the cards leave: "hg aerial" finds the kit, "aerial" the card first.
  const all2 = popular ? hits : [...hits, ...kitHits(want, Math.max(0, limit - hits.length))];
  return NextResponse.json({ hits: all2, ...(fixed ? { fixed } : {}), ...(popular ? { popular: true } : {}) }, { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } });
}

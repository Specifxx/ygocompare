// Matches a store's product title to a catalogue product. Pure (no I/O), so
// tests/match.test.ts can pin it against real store titles.
//
// The rule that matters most is the same one Rift Compare learned the hard way:
// a WRONG match is worse than no match. A wrong match puts a $3 common's price
// on a $300 Enchanted card's page with a buy button on it. So every match needs
// the card number AND the name, and a tie between two products is no match.
import type { Product, SetInfo } from "@/lib/site-types";
import { tokens } from "@/lib/slug";
import { sealedTypeOf } from "./tcgcsv";

const STOP = new Set([
  "the", "a", "of", "and", "disney", "lorcana", "tcg", "card", "game", "gundam", "single", "singles",
  "english", "en", "nm", "near", "mint", "foil", "holo", "holofoil", "cold", "normal", "non",
  "booster", "set", "chapter", "yu", "gi", "oh", "yugioh", "konami", "cyberpunk",
]);

// Words that mark a variant printing on the product name itself. A title that
// lacks the product's marker (or carries one the product lacks) is a different
// product — "Elsa (Enchanted)" vs "Elsa", "Gundam (LR+)" vs "Gundam".
const VARIANT_MARKERS = [
  "enchanted", "iconic", "epic", "promo", "alternate", "alt", "parallel", "lr+", "lr++", "r+", "u+",
  "c+", "c++", "oversized", "jumbo", "serialized", "signature", "showcase",
];

export interface MatchIndex {
  byNumber: Map<string, Product[]>;
  /** "setId|n" → products, for titles that give "(0017)" and name the set elsewhere. */
  bySetNumber: Map<string, Product[]>;
  /** "setId|full normalised name" → products, for titles with no number at all. */
  bySetName: Map<string, Product[]>;
  /** set code ("13", "Q1") and name initials ("TFC") → set ids */
  setByCode: Map<string, number[]>;
  sealed: Product[];
  setName: Map<number, string[]>;
  style: NumberStyle;
  /** Every rarity in the catalogue plus aliases, longest first (rarityMustAgree only). */
  rarities: { name: string; re: RegExp }[] | null;
  /** SITE.setEditions, or null when the game has none. */
  editions: SetEdition[] | null;
  /** set id → the edition word its name carries ("beta"), or null. */
  setEdition: Map<number, string | null>;
}

/** A game that prints one set in several editions with the same card and
 *  product names (Cyberpunk TCG's "Welcome to Night City - Beta" and
 *  "- Retail"). The edition word is taken out of the set's and the sealed
 *  product's names for matching, and a title must be read as the product's
 *  own edition: it names the word, or matches `implied` ("36 packs" is the
 *  Beta box), or names none and the product's edition is the `default` one.
 *  A title that points at two editions matches neither. */
export interface SetEdition {
  word: string;
  implied?: RegExp;
  default?: boolean;
}

export type NumberStyle = "fraction" | "code" | "ygo" | "plain" | "series";

// "series": the "code" numbers ("FB11-084", "BT25-104 SEC") plus series
// numbers, a title code, a print version and the number: "UE24BT/REZ-1-053",
// written "REZ-1-053" by stores, keyed without the set prefix ("REZ-1-053";
// action points "REZ-1-AP05"). The version stays in the key: "-1-" and "-2-"
// are different sets of one series.
const SERIES_NUM = /(?<![A-Z0-9])([A-Z]{2,4}\d?)-(\d)-(\d{3}|AP\d{2})(?![A-Z0-9])/g;
const CODE_NUM = /\b([A-Z]{1,4}\d{0,2}[A-Z]?)-(\d{2,3}[A-Z]?)\b/g;

// Yu-Gi-Oh! numbers: set code, an optional language, the number —
// "LOB-EN005", "RA01-EN008", "YGLD-ENA01", old "LOB-005" and European
// "LOB-E005". The language stays in the key: an "EN" card and an "E" or
// unmarked one are different printings, and any other language ("LOB-DE005",
// "RA01-AE008") never produces a key, so it can never match.
const YGO_NUM = /(?<![A-Z0-9])((?=[A-Z0-9]*[A-Z])[A-Z0-9]{2,5})-(EN|E)?([A-Z]?)(\d{2,3})(?![A-Z0-9])/g;
const ygoKey = (m: RegExpMatchArray) => `${m[1]}-${m[2] ?? ""}${m[3]}${m[4].padStart(3, "0")}`;

// Plain numbers (Cyberpunk TCG): "001" in the Retail print, "B001" in the
// Beta one, with no set code or total. The letter stays in the key; three
// digits only, so "24 packs", "ST01" and years never read as a number.
const PLAIN_NUM = /(?<![A-Z0-9/])([A-Z]?)(\d{3})(?![A-Z0-9/])/g;

export function numberKey(n: string, style: NumberStyle): string | null {
  if (style === "plain") {
    const m = n.trim().toUpperCase().match(/^([A-Z]?)(\d{1,3})$/);
    return m ? `${m[1]}${m[2].padStart(3, "0")}` : null;
  }
  if (style === "ygo") {
    const m = [...n.toUpperCase().matchAll(YGO_NUM)][0];
    return m ? ygoKey(m) : null;
  }
  if (style === "series") {
    const u = n.toUpperCase();
    const s = [...u.matchAll(SERIES_NUM)][0];
    if (s) return `${s[1]}-${s[2]}-${s[3]}`;
    const c = [...u.matchAll(CODE_NUM)][0];
    return c ? `${c[1]}-${c[2].padStart(3, "0")}` : null;
  }
  if (style === "code") {
    const m = n.toUpperCase().match(/\b([A-Z]{1,4}\d{0,2}[A-Z]?)-(\d{2,3}[A-Z]?)\b/);
    return m ? `${m[1]}-${m[2].padStart(3, "0")}` : null;
  }
  const m = n.match(/(\d{1,3})[a-z]?\s*\/\s*(P?\d{1,3})/i);
  if (m) return `${parseInt(m[1], 10)}/${m[2].toUpperCase().replace(/^0+/, "")}`;
  return null;
}

/** Every number-looking token in a store title. */
export function numbersInTitle(title: string, style: NumberStyle): string[] {
  const out = new Set<string>();
  if (style === "plain") {
    for (const m of title.toUpperCase().matchAll(PLAIN_NUM)) out.add(`${m[1]}${m[2]}`);
  } else if (style === "ygo") {
    for (const m of title.toUpperCase().matchAll(YGO_NUM)) out.add(ygoKey(m));
  } else if (style === "series") {
    const u = title.toUpperCase();
    for (const m of u.matchAll(SERIES_NUM)) out.add(`${m[1]}-${m[2]}-${m[3]}`);
    for (const m of u.matchAll(CODE_NUM)) out.add(`${m[1]}-${m[2].padStart(3, "0")}`);
  } else if (style === "code") {
    for (const m of title.toUpperCase().matchAll(/\b([A-Z]{1,4}\d{0,2}[A-Z]?)-(\d{2,3}[A-Z]?)\b/g))
      out.add(`${m[1]}-${m[2].padStart(3, "0")}`);
  } else {
    for (const m of title.matchAll(/(\d{1,3})[a-z]?\s*\/+\s*(P?\d{1,3}|[A-Z]{1,3}\d{0,3})(?![A-Za-z])/gi))
      out.add(`${parseInt(m[1], 10)}/${m[2].toUpperCase().replace(/^0+/, "")}`);
  }
  return [...out];
}

function baseName(name: string): string[] {
  const all = tokens(name.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " "));
  const kept = all.filter((t) => !STOP.has(t));
  // "Gundam" alone is a real card name: never let the stop list empty it.
  return kept.length ? kept : all;
}

function markers(s: string): Set<string> {
  const lower = s.toLowerCase();
  const out = new Set<string>();
  for (const m of VARIANT_MARKERS) {
    const re = m.includes("+")
      ? new RegExp(`(^|[^a-z+])${m.replace(/\+/g, "\\+")}(?!\\+)`)
      : new RegExp(`\\b${m}\\b`);
    if (re.test(lower)) out.add(m);
  }
  return out;
}

const GENERIC_ALT = ["parallel", "alt", "alternate"];

/** Do the title's variant words describe this product's variant? A generic
 *  "parallel" / "alt art" in the title stands for whichever "+" rarity the
 *  product carries (Gundam's LR+, R+…). */
export function markersAgree(productName: string, rarity: string | null, title: string): boolean {
  const pm = markers(productName);
  const tm = markers(title);
  const rarityWord = (rarity ?? "").toLowerCase();
  const generic = GENERIC_ALT.some((g) => tm.has(g));
  for (const g of GENERIC_ALT) tm.delete(g);
  const productPlus = [...pm].filter((m) => m.includes("+"));
  const productAlt = GENERIC_ALT.some((g) => pm.has(g));
  for (const g of GENERIC_ALT) pm.delete(g);
  if (generic) {
    if (!productPlus.length && !productAlt) return false;
    if (![...tm].some((m) => m.includes("+"))) for (const m of productPlus) tm.add(m);
  } else if (productAlt) {
    return false;
  }
  for (const m of pm) if (!tm.has(m)) return false;
  for (const m of tm) if (!pm.has(m) && m !== rarityWord && !rarityWord.split(" ").includes(m)) return false;
  return true;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Rarity names (and aliases) as whole-phrase patterns, longest first, so
 *  "Quarter Century Secret Rare" wins over "Secret Rare" and "Rare". Full
 *  names and multi-word aliases match in any case; one-word aliases ("QCSR",
 *  "UR") only as written. */
export function rarityPatterns(names: string[], aliases: Record<string, string[]> = {}): { name: string; re: RegExp }[] {
  const out: { name: string; text: string; re: RegExp }[] = [];
  for (const n of new Set(names)) out.push({ name: n, text: n, re: new RegExp(`(^|[^A-Za-z0-9])${esc(n)}(?![A-Za-z0-9])`, "i") });
  for (const [n, list] of Object.entries(aliases))
    for (const a of list) out.push({ name: n, text: a, re: new RegExp(`(^|[^A-Za-z0-9])${esc(a)}(?![A-Za-z0-9])`, /\s/.test(a) ? "i" : "") });
  return out.sort((a, b) => b.text.length - a.text.length).map(({ name, re }) => ({ name, re }));
}

/** The rarity a title names, with the card's own name taken out first (so
 *  "Rare Metal Dragon" names no rarity), or null. */
export function rarityInTitle(title: string, productName: string, rarities: { name: string; re: RegExp }[]): string | null {
  let t = ` ${title} `;
  const base = productName.replace(/\([^)]*\)/g, " ").trim();
  if (base) t = t.replace(new RegExp(esc(base), "ig"), " ");
  for (const r of rarities) if (r.re.test(t)) return r.name;
  return null;
}

/** For rarityMustAgree games: a title that names a rarity must name this one. */
export function rarityAgrees(p: Product, title: string, rarities: { name: string; re: RegExp }[] | null): boolean {
  if (!rarities || !p.rarity) return true;
  const named = rarityInTitle(title, p.name, rarities);
  return named == null || named.toLowerCase() === p.rarity.toLowerCase();
}

export interface IndexOptions {
  rarityMustAgree?: boolean;
  rarityAliases?: Record<string, string[]>;
  setEditions?: SetEdition[];
}

/** The edition a title points at: a word, null (none, and no default), or
 *  false when it points at more than one. */
export function titleEdition(title: string, editions: SetEdition[]): string | null | false {
  const have = new Set(tokens(title));
  const named = editions.filter((e) => have.has(e.word) || e.implied?.test(title)).map((e) => e.word);
  if (named.length > 1) return false;
  if (named.length === 1) return named[0];
  return editions.find((e) => e.default)?.word ?? null;
}

/** Is this product in the edition the title points at? Products of a set
 *  with no edition word always are. */
export function editionAgrees(p: Product, title: string, idx: MatchIndex): boolean {
  if (!idx.editions) return true;
  const own = idx.setEdition.get(p.setId) ?? null;
  if (own == null) return true;
  return titleEdition(title, idx.editions) === own;
}

export function buildIndex(products: Product[], sets: SetInfo[], style: NumberStyle, opts: IndexOptions = {}): MatchIndex {
  const byNumber = new Map<string, Product[]>();
  const bySetNumber = new Map<string, Product[]>();
  const bySetName = new Map<string, Product[]>();
  const sealed: Product[] = [];
  for (const p of products) {
    if (p.kind === "sealed") {
      sealed.push(p);
      continue;
    }
    const nk = `${p.setId}|${tokens(p.name).join(" ")}`;
    if (!bySetName.has(nk)) bySetName.set(nk, []);
    bySetName.get(nk)!.push(p);
    const k = p.number ? numberKey(p.number, style) : null;
    if (!k) continue;
    if (!byNumber.has(k)) byNumber.set(k, []);
    byNumber.get(k)!.push(p);
    const bare = parseInt(k, 10);
    if (style === "fraction" && bare) {
      const sk = `${p.setId}|${bare}`;
      if (!bySetNumber.has(sk)) bySetNumber.set(sk, []);
      bySetNumber.get(sk)!.push(p);
    }
  }
  const editions = opts.setEditions?.length ? opts.setEditions : null;
  const editionWords = new Set((editions ?? []).map((e) => e.word));
  const setEdition = new Map<number, string | null>(
    sets.map((s) => [s.id, tokens(s.name).find((t) => editionWords.has(t)) ?? null]),
  );
  const setName = new Map(sets.map((s) => [s.id, tokens(s.name).filter((t) => !STOP.has(t) && !editionWords.has(t))]));
  const setByCode = new Map<string, number[]>();
  const addCode = (c: string, id: number) => {
    const k = c.toUpperCase();
    if (!k) return;
    if (!setByCode.has(k)) setByCode.set(k, []);
    if (!setByCode.get(k)!.includes(id)) setByCode.get(k)!.push(id);
  };
  for (const st of sets) {
    addCode(st.code, st.id);
    const words = st.name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
    if (words.length >= 2) addCode(words.map((w) => w[0]).join(""), st.id);
  }
  const rarities = opts.rarityMustAgree
    ? rarityPatterns(products.map((p) => p.rarity).filter((r): r is string => !!r), opts.rarityAliases)
    : null;
  return { byNumber, bySetNumber, bySetName, setByCode, sealed, setName, style, rarities, editions, setEdition };
}

function overlap(need: string[], have: Set<string>): number {
  if (!need.length) return 0;
  return need.filter((t) => have.has(t)).length / need.length;
}

export interface MatchResult {
  product: Product;
  score: number;
}

// Non-English product. The catalogue (TCGplayer) is English; a Japanese box
// at a third of the price on an English box's page is the classic bad match.
// "JPN" was missing until 2026-11-08 (Gundam Compare: a store's "... [GD06]
// JPN" box at a third of the price sat on the English box's page). Japanese,
// Chinese and Korean script count too.
// Live 2026-11-27 (YGO): a German shop's "...structure-deck-r-onslaught-of-the-fire-kings-koreanisch" (EUR 10.12) sat on
// the English deck's page (US$29.61 market): German shops name the language in German ("koreanisch", "japanisch").
// Never "englisch", which is how they mark English product.
const FOREIGN = /\b(japanese|japan|jpn|jap|jp|chinese|simplified|traditional|chn|french|fran[cç]ais|german|deutsch(?:e[nrs]?)?|italian|italiano|spanish|espa[nñ]ol|korean|kor|portuguese|thai|indonesian|koreanisch|japanisch|chinesisch|italienisch|spanisch|franz(?:ö|oe|o)sisch|portugiesisch|\(fr\)|\(de\)|\(it\)|\(jp\)|\(cn\)|\(kr\))\b/i;
const CJK = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;
// Live 2026-11-20 (YGO): an Italian "Bustina 3 carte ... Star Pack VRAINS 1a Edizione ITA" at US$1.00 and a German
// "Lord of the Tachyon Galaxy Booster Pack LTGY-DE 1. Auflage" sat on the English packs' pages. The language lives in
// "ITA" or the set code's language part ("LTGY-DE"), which only an upper-case code can show safely. Never "1a
// Edizione" alone: Italian shops write it on English boxes ("... 1a Edizione ENG").
const FOREIGN_MORE = /\b(ita|deu)\b|\bde[\s-]+1\.?[\s-]+auflage\b/i;
const FOREIGN_CODE = /\b[A-Z]{2,4}\d{0,2}-(DE|FR|IT|PT|KR|JP)\b/;
export const isForeign = (title: string) => FOREIGN.test(title) || FOREIGN_MORE.test(title) || FOREIGN_CODE.test(title) || CJK.test(title);
// Live 2026-11-26 (YGO, after the EU store sweep): German, French and Italian shops end a listing's handle with its
// language ("yugioh-magnificent-monsters-box-de", "ygo-2025-mega-pack-tin-fr", "...-box-3-buste-it"): five in-stock
// German Magnificent Monsters boxes and a French Retro Pack 2 reprint blister sat on the English products' pages. A
// handle's last word is read as a language only there (the title is never read this way: "EN/DE" is a two-language
// listing).
// Only the codes seen live (de, fr, it), also before Shopify's duplicate suffix ("-de-1", "-de-copy"); "-en-de" sells
// both languages and stays.
const HANDLE_LANG = /(?<!\s(?:en|eng))\s(de|fr|it)(\s+(\d{1,2}|copy))?\s*$/i;
/** `isForeign` for a listing's handle (`handleOf`), which may also end in its language code. */
export const isForeignHandle = (handle: string) => isForeign(handle) || HANDLE_LANG.test(handle);

/** The listing's own URL slug ("...-gd06-jpn"): a store that keeps the
 *  language only in the handle is still a foreign product. Read for the
 *  language only, never for the set: stores duplicate a listing and retitle
 *  it, so "freedom-ascension-booster-box-gd05-copy" can be a real GD06 box. */
export const handleOf = (url: string) => {
  const m = url.match(/\/products\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]).replace(/-/g, " ") : "";
};

// A store listing for a used, damaged or graded copy is not the card's
// near-mint price ("... - Used Super Rare card", "... PSA 9").
const UNFIT = /\b(used|damaged|heavily played|poor condition|psa\s?\d|bgs\s?\d|cgc\s?\d|beckett|graded|slab(bed)?)\b/i;
export const isUnfitListing = (title: string) => UNFIT.test(title);

// Multiples: "(Pair)", "Bundle of 2", "Set of 4", "x2". A title and a product
// must agree on whether they are a multiple.
const MULTI = /\b(pair|bundle of \d+|set of \d+|\d+\s*x|x\s*\d+|\d+[- ]pack bundle|lot of)\b/i;
// A set's sequel number in its other spelling ("Rarity Collection 2" -> "ii", "Legendary Decks II" -> "2"), read only
// right after a word and never as a count ("2 Players", "2 Pack").
const SEQUEL = new Map([["2", "ii"], ["3", "iii"], ["4", "iv"], ["ii", "2"], ["iii", "3"], ["iv", "4"]]);
function sequelAliases(words: string[]): string[] {
  const out: string[] = [];
  words.forEach((w, i) => {
    const alt = SEQUEL.get(w);
    if (alt && i > 0 && /^[a-z]+$/.test(words[i - 1]) && !/^(players?|packs?|boxes|decks?|tins?)$/.test(words[i + 1] ?? "")) out.push(alt);
  });
  return out;
}
// A pack product sold as several packs, by its own name ("Retro Pack Box (4-Pack)", "Blister (3-Pack)").
const MULTI_PACK_NAME = /\b(box|blister|tuck|display|bundle|bags?)\b|\d+-pack|\bpacks\b/i;
// A title counting several packs: a tuckbox, a mini box, "4 Packs", "24 Bags", "2-Pack Blister", "Pack of 3", and (live
// 2026-11-27: a French shop's "pack de 3 boosters", EUR 15.90 on the US$4.86 2025 Mega-Pack pack) "3 Boosters", "Pack de 3 Boosters"
// (never "1 of 24 Boosters", a pack from a display, nor "Pack de 9 cartes", a card count).
const MULTI_PACK_TITLE =
  /\btuck\s*box(es)?\b|\bmini[\s-]*box\b|\b([2-9]|[1-9]\d)\s*(booster\s+)?packs\b|\b\d+\s*(bags|buste|bustine|sobres)\b|\b([2-9]|[1-9]\d)[\s-]*packs?\s+(box|blister|tuck)|\bpack\s+of\s+([2-9]|[1-9]\d)\b|(?<!\b(?:of|from|de)\s+)\b([2-9]|[1-9]\d)\s*boosters\b|\bpack\s+de\s+([2-9]|[1-9]\d)\s+(boosters?|packs?)\b/i;
// "(3-Pack)", "4 Packs", "24 Bags", "Pack of 3": how many packs a name or title counts, or 0. Never the number after
// "Pack" ("Retro Pack 2 Booster Pack").
function packCount(s: string): number {
  const m = s.match(/(?<!\bpack\s?)\b(\d{1,2})[\s-]*(?:booster\s+)?(?:packs?|boosters|bags|buste|bustine|sobres)\b|\bpack\s+of\s+(\d{1,2})\b/i);
  const n = m ? Number(m[1] ?? m[2]) : 0;
  return n >= 2 ? n : 0;
}
// "free mini box", "bonus mini box" or "with mini box" is an extra, not what the listing sells.
const MINI_BOX = /(?<!\b(?:free|bonus|promo|with|plus)\s+)\bmini[\s-]*(booster\s+)?box(es)?\b/i;
const SINGLE_PACK = /\b(booster|loose|mega)\s+pack\b(?!s)/i;
const isMulti = (s: string) => MULTI.test(s.replace(/\b\d+\s*packs?\)/i, ""));

/** Titles that give the card's number in the set but not "n/total":
 *    "99 Puppies (3-024)"            set code - number
 *    "Ariel - On Human Legs [TFC-1]" set initials - number
 *    "1TFC-059, L, Ursula" / "[14HPC-132]"  code + initials - number
 *    "Elsa - The Fifth Spirit (48)"  bare number; the set comes from the
 *                                    tags / product type (its name or code)
 *  The name check in matchCard still has to pass. */
function fractionFallback(title: string, context: string, idx: MatchIndex): Product[] {
  const out: Product[] = [];
  const add = (setIds: number[] | undefined, n: number) => {
    for (const id of setIds ?? []) for (const p of idx.bySetNumber.get(`${id}|${n}`) ?? []) if (!out.includes(p)) out.push(p);
  };
  const coded = title.match(/(?:^|[\s(\[])(\d{1,2})?([A-Z]{2,5})?-(\d{1,3})(?=[\s)\],]|$)/);
  if (coded && (coded[1] || coded[2])) {
    const n = parseInt(coded[3], 10);
    if (coded[1]) add(idx.setByCode.get(coded[1]), n);
    if (!out.length && coded[2]) add(idx.setByCode.get(coded[2]), n);
    if (out.length) return out;
  }
  const bare = title.match(/\((\d{1,4})\)|#(\d{1,4})\b/);
  const n = bare ? parseInt(bare[1] ?? bare[2], 10) : 0;
  if (!n) return out;
  const ctxText = `${title} ${context}`;
  const ctx = new Set(tokens(ctxText));
  for (const [setId, setTokens] of idx.setName)
    if (setTokens.length && setTokens.every((t) => ctx.has(t))) add([setId], n);
  if (!out.length) {
    // A tag that is exactly a set code ("12"), as some stores tag the set.
    for (const tag of context.split(/\s{2,}|,|\|/).map((t) => t.trim())) add(idx.setByCode.get(tag.toUpperCase()), n);
    for (const t of context.split(/\s+/)) if (/^(\d{1,2}|Q\d)$/i.test(t)) add(idx.setByCode.get(t.toUpperCase()), n);
  }
  return out;
}

/** `context` is extra text that may name the set (Shopify product_type / tags). */
export function matchCard(title: string, idx: MatchIndex, context = ""): MatchResult | null {
  if (isForeign(title)) return null;
  const have = new Set(tokens(title));
  const scored: MatchResult[] = [];
  let candidates = [...new Set(numbersInTitle(title, idx.style).flatMap((n) => idx.byNumber.get(n) ?? []))];
  if (!candidates.length && idx.style === "fraction") candidates = fractionFallback(title, context, idx);
  if (!candidates.length && !numbersInTitle(title, idx.style).length) {
    // No number anywhere: only an EXACT full-name match inside a set the
    // tags / product type name, and only when exactly one product fits.
    const ctx = new Set(tokens(context));
    const want = tokens(title).join(" ");
    const hits: Product[] = [];
    for (const [setId, setTokens] of idx.setName)
      if (setTokens.length && setTokens.every((t) => ctx.has(t))) hits.push(...(idx.bySetName.get(`${setId}|${want}`) ?? []));
    const fit = hits.filter((p) => editionAgrees(p, title, idx));
    return fit.length === 1 ? { product: fit[0], score: 1 } : null;
  }
  {
    for (const p of candidates) {
      const nameScore = overlap(baseName(p.name), have);
      if (nameScore < 0.6) continue;
      if (!markersAgree(p.name, p.rarity, title)) continue;
      if (!rarityAgrees(p, title, idx.rarities)) continue;
      if (!editionAgrees(p, title, idx)) continue;
      const setScore = overlap(idx.setName.get(p.setId) ?? [], have);
      scored.push({ product: p, score: nameScore + 0.5 * setScore });
    }
  }
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  if (scored.length > 1 && Math.abs(scored[0].score - scored[1].score) < 0.01) return null;
  return scored[0];
}

// Set codes a sealed title names ("[GD06]", "GD-05", "eb01"), as set ids.
// Only codes shaped like a release code (letters + two digits) that the
// catalogue knows; a bare number is never read as a set.
const TITLE_CODE = /(?<![A-Za-z0-9])([A-Za-z]{2,4})[\s-]?(\d{2})(?![A-Za-z0-9])/g;
export function setCodesInTitle(title: string, idx: MatchIndex): Set<number> {
  const out = new Set<number>();
  for (const m of title.matchAll(TITLE_CODE)) {
    const code = `${m[1]}${m[2]}`.toUpperCase();
    if (!/^[A-Z]{2,4}\d{2}$/.test(code)) continue;
    for (const id of idx.setByCode.get(code) ?? []) out.add(id);
  }
  return out;
}

/** A title that names a set code must name the product's own set, or a set
 *  whose name the product's set carries (the GD05 code on "Deck Build Box
 *  Freedom Ascension", SC01). "Stardust Trails Booster Box [GD05]" is no match. */
function codesAgree(p: Product, codes: Set<number>, idx: MatchIndex): boolean {
  if (!codes.size || codes.has(p.setId)) return true;
  const own = new Set(idx.setName.get(p.setId) ?? []);
  for (const id of codes) {
    const t = idx.setName.get(id) ?? [];
    if (t.length && t.every((w) => own.has(w))) return true;
  }
  return false;
}

/** `handle` is the listing's URL handle (`handleOf`). It can only refuse: a handle naming a longer set than the title
 *  ("yu-gi-oh-soulburning-volcano-booster-pack" titled as a plain Legendary Duelists pack) is that set's listing. */
export function matchSealed(title: string, idx: MatchIndex, handle = ""): MatchResult | null {
  if (isForeign(title)) return null;
  const have = new Set(tokens(title).filter((t) => !STOP.has(t) || t === "booster"));
  // Live 2026-11-22: 31 stores' "25th Anniversary Rarity Collection 2" boxes and packs sat on the first Rarity
  // Collection's pages: the set is "... Rarity Collection II", and "2" never met "ii". A sequel number reads in either
  // spelling, so the title scores on its own product and the shorter set refuses it below.
  for (const w of sequelAliases(tokens(title))) have.add(w);
  const type = sealedTypeOf(title);
  const codes = setCodesInTitle(title, idx);
  // Sets whose whole name the title carries. Live 2026-11-20 (YGO): "Legendary Duelists 10: Soulburning Volcano Booster
  // Box" without "1st Edition" missed its own product and fell to the plain "Legendary Duelists Booster Box" (US$213
  // market) at US$47; five stores' Synchro Storm, Soulburning Volcano and Duels From the Deep boxes and packs did the
  // same. A title that names a longer set built on a product's set name is that set's, never the shorter one's.
  // Live 2026-11-21: Urban Empire's "yu-gi-oh-soulburning-volcano-booster-pack" was still on the plain Legendary
  // Duelists pack (US$6.46 market): the handle names the longer set when the title doesn't, so it counts here (and
  // only here, where it can only refuse).
  const seen = new Set([...have, ...tokens(handle)]);
  for (const w of sequelAliases(tokens(handle.replace(/-/g, " ")))) seen.add(w);
  // Live 2026-11-22: "Realm of Light Structure Deck Reprint" (US$6.40) and "Light of Destruction Booster Reprint
  // Unlimited Edition" packs (US$3.99) sat on the original printings (US$21, US$20). TCGplayer files every reprint run
  // ("2024 reprint", "July 2025 reprint") under a "(2020 Date Reprint)" set; a title that says reprint names that set.
  // Live 2026-11-22: "yugioh-retro-pack-2-blister-2025-rerelease" sat on the 2009 Retro Pack 2 pack. A re-release is a
  // reprint by another word.
  if (seen.has("rerelease") || /\bre-release/i.test(`${title} ${handle}`)) seen.add("reprint");
  // Live 2026-11-25: "yugioh-retro-pack-2-blister-2025" and "yugioh-retro-pack-2-2025-booster-pack" (the 2025 run) still
  // sat on the 2009 Retro Pack 2 pack: they name the year, not the word. Every set TCGplayer gives a "(2020 Date Reprint)"
  // printing is older than 2020, so a title naming a year from 2020 on is a reprint run of it (it can only refuse: the
  // reprint set's own products still need their words in the title).
  if ([...seen].some((w) => /^20[2-3]\d$/.test(w))) seen.add("reprint");
  if (seen.has("reprint")) for (const w of ["2020", "date"]) seen.add(w);
  const named = [...idx.setName].filter(([, t]) => t.length && t.every((w) => seen.has(w)));
  // The product's own name may carry the longer set's words: TCGplayer files "Raging Tempest Special Edition Box" under
  // Raging Tempest while a "Raging Tempest: Special Edition" set exists too.
  const narrower = (p: Product) => {
    const own = idx.setName.get(p.setId) ?? [];
    const name = new Set(tokens(p.name));
    return named.some(([id, t]) => id !== p.setId && t.length > own.length && own.every((w) => t.includes(w)) && !t.every((w) => own.includes(w) || name.has(w)));
  };
  const scored: MatchResult[] = [];
  for (const p of idx.sealed) {
    if (sealedTypeOf(p.name) !== type) continue;
    if (!editionAgrees(p, title, idx)) continue;
    if (isMulti(p.name) !== isMulti(title)) continue;
    // "Pack Bundle Magnificent Maestros" is several packs, not one.
    if (/\bbundle\b/i.test(title) && !/\bbundle\b/i.test(p.name)) continue;
    // Live 2026-11-21: 47 stores' single "Structure Deck: Legend of the Crystal Beasts" (US$8-15, no edition named)
    // sat on the Structure Deck Display (US$29 market): five of its six words is "near-complete". A deck display is
    // a box of decks, and the title must say so.
    if (/\bdeck/i.test(p.name) && /\bdisplay\b/i.test(p.name) && !/\bdisplay\b/i.test(title)) continue;
    // Live 2026-11-25: "...mini-box-display-kon-85733-1p-single-pack" (US$9.99) sat on the Midterm Paradox Mini Box
    // Display (US$34 market). A display is several boxes; a listing that says it sells one, in its title or its handle
    // (which can only refuse), is not the display.
    if (/\bdisplay\b/i.test(p.name) && /\bsingle\b|\b1\s?p\b/i.test(`${title} ${handle.replace(/-/g, " ")}`)) continue;
    // Live 2026-11-27: "yugioh-rarity-coll-5-mini-box-5-packs" (US$34.99, in stock) sat on the Rarity Collection 5 Booster
    // Box (US$125 market), and a Supreme Darkness "booster-box-1st-edition-mini-box" on its full box: the title lacked the
    // mini box product's "Retail Exclusive", so the full box was the only fit. A full booster box refuses a listing that
    // says mini box, in its title or its handle (which can only refuse); the mini box products keep it.
    if (/\bbooster\s+box\b/i.test(p.name) && !/\bmini\b/i.test(p.name) && MINI_BOX.test(`${title} ${handle.replace(/-/g, " ")}`)) continue;
    // Live 2026-11-21: one loose pack from a tin ("yugioh-2022-tin-of-the-pharaohs-gods-booster-pack", US$5.95) sat on
    // the whole 2022 Tin (US$12 market). A tin's own name has no "pack"; a listing that names one booster pack, in its
    // title or its handle, is the pack (the handle can only refuse here).
    // Live 2026-11-22: 3-pack tuckboxes (US$19-69), 2-pack tuckboxes, a "Mini Box 4 Packs", a "Box 24 Bags" and 2-pack
    // blisters sat on single booster packs' pages (US$2-14 market). A single pack refuses a title that counts several
    // packs; "9-pack" alone is a card count ("Booster Pack 1st Edition 9-pack"), so a bare N-pack still matches.
    if (type === "Booster Pack" && !MULTI_PACK_NAME.test(p.name) && MULTI_PACK_TITLE.test(title)) continue;
    // A product that counts its packs ("Retro Pack 2 Box (3-Pack)") refuses a title counting others ("Mini Box 4 Packs",
    // "Box 24 Bags").
    if (type === "Booster Pack" && packCount(p.name) && packCount(title) && packCount(p.name) !== packCount(title)) continue;
    if (type === "Tin" && !/\bpacks?\b/i.test(p.name) && SINGLE_PACK.test(`${title} ${handle.replace(/-/g, " ")}`)) continue;
    const setTokens = idx.setName.get(p.setId) ?? [];
    if (setTokens.length && overlap(setTokens, have) < 1) continue;
    if (!codesAgree(p, codes, idx)) continue;
    if (narrower(p)) continue;
    const own = idx.editions ? idx.setEdition.get(p.setId) : null;
    const need = tokens(p.name).filter((t) => !STOP.has(t) && t !== own);
    const s = overlap(need, have);
    // Near-complete: "Collector Booster Display" must not take a plain
    // "Booster Display" (one missing word of four is 0.75).
    if (s < (need.length >= 6 ? 0.8 : 0.99)) continue;
    // Penalise title words the product name lacks (e.g. "case", "bundle of 4").
    const extra = [...have].filter((t) => !need.includes(t) && !/^\d+$/.test(t) && !STOP.has(t) && t !== own).length;
    scored.push({ product: p, score: s - 0.05 * extra });
  }
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  if (scored.length > 1 && Math.abs(scored[0].score - scored[1].score) < 0.01) return null;
  return scored[0];
}

// TCGplayer's edition printings (Yu-Gi-Oh!). When a product is sold in these,
// the title must say which; an unstated edition stays unknown, never guessed,
// unless the product exists in only one.
const EDITIONS: [string, RegExp][] = [
  ["1st Edition", /\b1st\b|first\s+edition/],
  ["Unlimited", /\bunlimited\b/],
  ["Limited", /\blimited\b/],
];

export const hasEditions = (printings: string[]) => printings.some((p) => EDITIONS.some(([e]) => e === p));

export function editionOf(text: string): string | null {
  const s = text.toLowerCase();
  for (const [name, re] of EDITIONS) if (re.test(s)) return name;
  return null;
}

export function printingOf(title: string, variantTitle = "", printings: string[] = []): string | undefined {
  if (hasEditions(printings)) {
    const named = editionOf(`${variantTitle} ${title}`);
    if (named) return printings.includes(named) ? named : undefined;
    return printings.length === 1 ? printings[0] : undefined;
  }
  const s = `${title} ${variantTitle}`.toLowerCase();
  if (/cold\s*foil/.test(s)) return "Cold Foil";
  if (/non[-\s]?foil/.test(s)) return "Normal";
  if (/\bfoil\b|holo/.test(s)) return "Foil";
  return "Normal";
}

export function isPreorder(title: string, tags: string[] = []): boolean {
  return /pre[-\s]?order|presale|pre[-\s]?sale/i.test(`${title} ${tags.join(" ")}`);
}

// "Card Name [Set Name]" is how TCGplayer-synced stores title a single; a
// starter-deck card ("MT0D12 Flathead [The Heist - Beta Starter Deck]") names
// a sealed product only inside the brackets, so the brackets don't count.
const SEALED_WORD = /booster|display|\bbox\b|\bcase\b|\bpack\b|starter|deck|trove|gift set|collection|bundle|prerelease|\btin\b|\bkit\b/i;

export function looksSealed(title: string, productType = "", style?: NumberStyle): boolean {
  const single = title.match(/^([^[\]]+)\[[^\]]+\]\s*$/);
  if (single && !SEALED_WORD.test(single[1])) return false;
  // A "plain" card number is a single, whatever set it came in:
  // "MT0D12 Flathead [B015 - Uncommon] - The Heist - Beta Starter Deck".
  if (style === "plain" && numbersInTitle(title, "plain").length) return false;
  return /booster|display|\bbox\b|\bcase\b|\bpack\b|starter|deck|trove|gift set|collection|bundle|prerelease|\btin\b/i.test(
    `${title} ${productType}`,
  ) && !numbersInTitle(title, "fraction").length && !numbersInTitle(title, "code").length && !numbersInTitle(title, "ygo").length && !numbersInTitle(title, "series").length;
}

// A single card filed under a sealed product's name. Live 2026-11-17: 92 store
// offers on the summary came from singles stores, and most were cards, not
// product: "Axe of Fools (V.1 - Common) [Battle Pack 2: War of the Giants]" at
// US$0.02 on the pack's page, a "Portable Battery Pack: Light of Destruction"
// at US$0.60 beside a US$132 first-edition pack, a Kaiba Evolution Starter Deck
// at US$0.18. A sealed product's own title has no rarity and no card code.
const CARD_RARITY = /\b(common|short print|super rare|ultra rare|secret rare|ultimate rare|ghost rare|starfoil( rare)?|shatterfoil( rare)?|mosaic rare|collector'?s rare|platinum rare|prismatic secret rare|quarter century secret rare|starlight rare|parallel rare)\b/i;
// "MVP1-ENSV5" (Live 2026-11-20: Obelisk the Tormentor on the Dark Side of Dimensions Movie Pack at US$4) is a card
// code too, and so is "1st Edition Rare" ("Raigeki 1st Edition Rare Battle Pack Epic Dawn" at US$3 on the pack).
// Live 2026-11-22: "...-dueling-mirrors-en073-triple-tactics-thrust-1st-edition" (US$10, one card) and a PSA 10
// "...-en058-harpies-fthr-duster" on the US$35 Dueling Mirrors tin: a card's "EN073" alone, or run into the next word
// ("mp24-en073mp24-en073"), is a card code too. A sealed product never carries one.
const CARD_CODE = /\b[a-z0-9]{2,5}[- ]?(en|ae|sp|ju|fc|jp)(\d{3}|[a-z]{1,2}\d{1,3})\b|(?<![a-z])en\d{3}(?!\d)|\bpsa[- ]?\d{1,2}\b/i;
const EDITION_RARE = /\b(1st edition|unlimited( edition)?|limited edition) rare\b/i;
const CARD_VERSION = /\bv\.?\s?\d\b/i;
const EXTRA_OK = new Set([
  "yu", "gi", "oh", "yugioh", "tcg", "konami", "sealed", "new", "pre", "order", "preorder", "north", "american", "english",
  "unlimited", "1st", "first", "edition", "blister", "sleeved", "display", "of", "the", "a", "and", "official", "ocg", "box",
]);

/** True when a store title (and its URL slug, hyphens as spaces) names a single card, not a sealed product. */
export function looksLikeCard(title: string, handle = ""): boolean {
  const t = `${title} ${handle}`;
  return CARD_RARITY.test(t) || CARD_CODE.test(t) || EDITION_RARE.test(t) || CARD_VERSION.test(title);
}

/** Title words the matched product's name lacks. A singles store's "Vylon Stella - Battle Pack 2: War of the Giants"
 *  carries a card name the pack does not. */
export function strangerWords(title: string, productName: string): number {
  const own = new Set(tokens(productName));
  return tokens(title).filter((w) => !own.has(w) && !EXTRA_OK.has(w) && !/^\d+$/.test(w)).length;
}

// Live 2026-11-18, after the first import with `strangerWords`: a singles store's card with a ONE-word name still
// passed ("Yubel" on the Ra Yellow Mega-Pack at US$4.80, "Steamroid" on Syrus Truesdale's starter deck at US$0.20,
// "The Tricky" on Legendary Collection 3 at US$0.60). A real product's title opens with the product's own name (or
// "Yu-Gi-Oh!", "Sealed", "Pre-order"); a card listed under its set opens with the card's name.
const LEAD_OK = new Set([...EXTRA_OK, "brand", "factory"]);

/** Title words before the first word of the matched product's own name that are neither its words nor filler. */
export function leadingStrangerWords(title: string, productName: string): number {
  const own = new Set(tokens(productName));
  let n = 0;
  for (const w of tokens(title)) {
    if (own.has(w)) return n;
    if (!LEAD_OK.has(w) && !/^\d+$/.test(w)) n++;
  }
  return n;
}

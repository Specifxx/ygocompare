// Typo-tolerant search (owner's UX review, 2026-11-23, P0 5: "charizard" found 15 results but "charizrd" none; add fuzzy
// matching, synonyms and a "did you mean" fallback instead of a dead end). Pure, shared by /api/search and the tests.
//   1. Synonyms: shorthand a buyer types becomes the words product names use ("bb" → booster box, "sd" → structure deck).
//   2. A word that matches nothing is replaced by the nearest word the catalogue knows: one edit for 4 to 6 letters, two for 7 or
//      more, a swap of two letters counts once, words of 3 letters or fewer are never changed. The caller says "Showing results
//      for …" with the corrected words.
//   3. Nothing at all: the caller shows the most widely stocked products, labelled as such, never an empty panel.

/** Whole-word shorthand → the words in product names. Only expansions; a word that is not here passes through unchanged. */
export const SYNONYMS: Record<string, string[]> = {
  bb: ["booster", "box"],
  bbox: ["booster", "box"],
  boxes: ["box"],
  bp: ["booster", "pack"],
  packs: ["pack"],
  sd: ["structure", "deck"],
  sds: ["structure", "deck"],
  decks: ["deck"],
  tins: ["tin"],
  "1st": ["1st"],
  first: ["1st"],
  unl: ["unlimited"],
  unlim: ["unlimited"],
  se: ["special", "edition"],
  ra: ["rarity", "collection"],
  collections: ["collection"],
  displays: ["display"],
  cases: ["case"],
};

export function expandSynonyms(words: readonly string[]): string[] {
  return words.flatMap((w) => SYNONYMS[w] ?? [w]);
}

/** Damerau–Levenshtein (adjacent swap counts once), stopping early once over `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let best = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      best = Math.min(best, d[i][j]);
    }
    if (best > max) return max + 1;
  }
  return d[a.length][b.length];
}

/** How many edits a word of this length may take. 0: never corrected. */
export const allowedEdits = (len: number): number => (len <= 3 ? 0 : len <= 6 ? 1 : 2);

/** The nearest catalogue word to `w` (whole word, or a word it is the start of), or null. Ties go to the more common word. */
export function nearestWord(w: string, vocab: ReadonlyMap<string, number>): string | null {
  const max = allowedEdits(w.length);
  if (!max) return null;
  let best: string | null = null;
  let bestD = max + 1;
  let bestN = 0;
  for (const [t, n] of vocab) {
    if (Math.abs(t.length - w.length) > max && t.length < w.length) continue;
    const whole = editDistance(w, t, max);
    const head = t.length > w.length ? editDistance(w, t.slice(0, w.length), max) : max + 1;
    const d = Math.min(whole, head);
    if (d < bestD || (d === bestD && d <= max && n > bestN)) {
      best = t;
      bestD = d;
      bestN = n;
    }
  }
  return bestD <= max ? best : null;
}

/** The words with each one that matches nothing (`known` says) replaced by its nearest catalogue word; null when no word changed. */
export function correctWords(words: readonly string[], known: (w: string) => boolean, vocab: ReadonlyMap<string, number>): string[] | null {
  let changed = false;
  const out = words.map((w) => {
    if (known(w) || /\d/.test(w)) return w;
    const n = nearestWord(w, vocab);
    if (!n) return w;
    changed = true;
    return n;
  });
  return changed ? out : null;
}

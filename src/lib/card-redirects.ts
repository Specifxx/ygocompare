// Sealed only (owner, 2026-11-06): YGO Compare dropped single cards. Every card URL it had that day is in
// data/redirects/cards.json (frozen, by set), so an old /card/<slug> link, bookmark or search result lands on the
// card's set (its booster boxes and packs) or, for a set with no sealed product, on /sealed. Never a 404.
import fs from "node:fs";
import path from "node:path";

let bySlug: Map<string, string> | null = null;

function load(): Map<string, string> {
  if (bySlug) return bySlug;
  bySlug = new Map();
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "redirects", "cards.json"), "utf8")) as { bySet: Record<string, string[]> };
    for (const [set, slugs] of Object.entries(raw.bySet)) for (const s of slugs) bySlug.set(s, set);
  } catch {
    /* no file: nothing redirects */
  }
  return bySlug;
}

/** Where a retired card URL goes: its set's page when that set still has a page, else the sealed hub; null when the
 *  slug was never a card. `setHasPage` is the set's own check (data.ts), passed in to keep this file data-free. */
export function retiredCardTarget(slug: string, setHasPage: (setSlug: string) => boolean): string | null {
  const set = load().get(slug);
  if (set === undefined) return null;
  return set && setHasPage(set) ? `/sets/${set}` : "/sealed";
}

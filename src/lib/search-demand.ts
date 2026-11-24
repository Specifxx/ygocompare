// Which pages Search Console shows people finding (2026-11-19, the core-update quality pass). The daily refresh copies the
// `demand` branch's gsc-pages.json (RiftCompare's sister-demand job: path -> [clicks, impressions, position], 56 days) to
// data/public/search-demand.json; a page with a click, or 10+ impressions at an average position of 30 or better, keeps
// asking to be indexed even when the stricter rules in lib/indexing.ts would leave it out. A missing or unreadable file
// means "none found" (the rules alone decide).
//
// Past page 3 is not "found" (page scorecard, 2026-11-23): a page Google shows only at position 31+ and nobody clicks is
// one Google already judged weak. Holding it in the index on those impressions kept thin set pages (one starter deck,
// a lone tin) asking against the data rules; it now falls back to them like any other page. A click always counts.
import fs from "node:fs";
import path from "node:path";

export const FOUND_MIN_IMPRESSIONS = 10;
/** Worst average position at which impressions alone count as "found" (past page 3 never does). */
export const FOUND_MAX_POSITION = 30;
let found: Set<string> | null = null;

/** Paths with a click, or FOUND_MIN_IMPRESSIONS+ impressions at an average position of FOUND_MAX_POSITION or better, in a
 * gsc-pages.json `pages` map ([clicks, impressions, position]; a missing position counts as unknown, so impressions alone
 * still count). Pure. */
export function foundPaths(pages: Record<string, number[]>): Set<string> {
  const out = new Set<string>();
  for (const [p, [clicks = 0, impressions = 0, position]] of Object.entries(pages)) {
    const ranked = !(typeof position === "number" && position > FOUND_MAX_POSITION);
    if (clicks > 0 || (impressions >= FOUND_MIN_IMPRESSIONS && ranked)) out.add(p);
  }
  return out;
}

export function searchFound(pathname: string): boolean {
  if (!found) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/public/search-demand.json"), "utf8")) as { pages?: Record<string, number[]> };
      found = foundPaths(raw.pages ?? {});
    } catch {
      found = new Set();
    }
  }
  return found.has(pathname);
}

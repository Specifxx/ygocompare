// Which pages Search Console shows people finding (2026-11-19, the core-update quality pass). The daily refresh copies the
// `demand` branch's gsc-pages.json (RiftCompare's sister-demand job: path -> [clicks, impressions, position], 56 days) to
// data/public/search-demand.json; a page with a click or 10+ impressions keeps asking to be indexed even when the stricter
// rules in lib/indexing.ts would leave it out. A missing or unreadable file means "none found" (the rules alone decide).
import fs from "node:fs";
import path from "node:path";

export const FOUND_MIN_IMPRESSIONS = 10;
let found: Set<string> | null = null;

/** Paths with a click or FOUND_MIN_IMPRESSIONS+ impressions in a gsc-pages.json `pages` map. Pure. */
export function foundPaths(pages: Record<string, number[]>): Set<string> {
  const out = new Set<string>();
  for (const [p, [clicks = 0, impressions = 0]] of Object.entries(pages)) if (clicks > 0 || impressions >= FOUND_MIN_IMPRESSIONS) out.add(p);
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

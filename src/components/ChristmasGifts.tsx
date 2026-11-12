import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { CHRISTMAS_FESTIVE_LAYER, seasonMarkupLive } from "@/lib/season";

// Christmas (until Boxing Day): one festive line at the top of the hero, in
// each game's own words (SITE.christmas), to the sealed prices. In the HTML
// only around the season, shown only while <html> carries
// data-season="christmas" (globals.css .xmas-pill-row).
export function ChristmasGifts() {
  if (!seasonMarkupLive("christmas")) return null;
  // The festive layer (owner, 2026-11-12; lib/season.ts CHRISTMAS_FESTIVE_LAYER, the one off switch): a one-line gift-guide card
  // to the existing page, server HTML, not a heading. Off, the quiet pill below is what is left.
  if (CHRISTMAS_FESTIVE_LAYER)
    return (
      <div className="xmas-pill-row mb-4">
        <Link href="/blog/yu-gi-oh-gift-guide" className="xmas-guide">
          <svg className="xmas-guide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8c-2.5 0-4-1-4-2.5S9.5 3 12 8c2.5-5 4-3.5 4-2.5S14.5 8 12 8z" /></svg>
          <span className="xmas-guide-text">
            <b>Christmas gift guide</b>
            <span className="xmas-guide-more hidden sm:inline"> · Yu-Gi-Oh! gifts at every budget, cheapest store first</span>
          </span>
          <span className="xmas-guide-go" aria-hidden="true">→</span>
        </Link>
      </div>
    );
  return (
    <div className="xmas-pill-row mb-4">
      <Link href="/sealed" className="xmas-pill">
        <b>{SITE.christmas.headline}</b>
        <span className="xmas-pill-more hidden sm:inline">· {SITE.christmas.blurb} →</span>
      </Link>
    </div>
  );
}

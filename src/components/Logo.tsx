import { SITE } from "@/site.config";

// The site's mark (public/icon.svg, drawn by scripts/og) and the wordmark. At Christmas Santa's hat sits on the mark
// (globals.css .xmas-logo-hat, hidden outside the season), hence the host span.
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className="xmas-hat-host">
      <img src="/icon.svg" alt={`${SITE.name} logo`} width={32} height={32} className={`shrink-0 rounded-lg ${className}`} />
      <span aria-hidden="true" className="xmas-logo-hat" />
    </span>
  );
}

/**
 * The mark and the wordmark. `wordmark` sets when the word shows: the header passes "hidden sm:inline", so a phone's one row keeps
 * its width for the search box (the mark alone is the home link there, named by the link's aria-label).
 */
export function Logo({ wordmark = "" }: { wordmark?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className="h-8 w-8" />
      <span className={`whitespace-nowrap font-display text-[19px] font-extrabold tracking-tight ${wordmark}`}>
        <span className="wordmark">{SITE.wordmark[0]}</span> <span className="text-ink">{SITE.wordmark[1]}</span>
      </span>
      <span className="season-only ml-0.5 inline" aria-hidden>🎃</span>
    </span>
  );
}

import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { SearchBox } from "./SearchBox";
import { MarketPicker, ThemeToggle } from "./ClientPrefs";
import { phoneNav } from "@/lib/nav";
import { historyOn } from "@/lib/data";

// The top bar: the search, the region and the theme. From lg up the logo and
// the navigation live in the left rail (SideNav.tsx), and this bar sits to the
// right of it; below lg it carries the logo, a search row and a scrolling row
// of the main sections (lib/nav.ts).
export function Header() {
  const nav = phoneNav({ history: historyOn() });
  return (
    <header className="sticky top-0 z-30 border-b border-ink-800/70 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-4">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2 overflow-x-clip whitespace-nowrap font-display text-base font-black leading-none sm:shrink-0 sm:overflow-visible sm:text-lg lg:hidden" aria-label={`${SITE.name} home`}>
          {/* In a host span so the Christmas Santa hat (globals.css .xmas-logo-hat) can sit on the icon. */}
          <span className="xmas-hat-host">
            <img src="/icon.svg" alt={`${SITE.name} logo`} width={34} height={34} className="h-[30px] w-[30px] shrink-0 rounded-xl sm:h-[34px] sm:w-[34px]" />
            <span aria-hidden="true" className="xmas-logo-hat" />
          </span>
          <span className="wordmark">{SITE.wordmark[0]}</span> <span className="text-fg">{SITE.wordmark[1]}</span>
          <span className="season-only ml-1 inline" aria-hidden>🎃</span>
        </Link>
        <div className="hidden min-w-0 flex-1 md:block lg:max-w-xl">
          <SearchBox />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link href="/sealed" className="hidden rounded-full px-3 py-1.5 text-sm text-fg/85 hover:bg-ink-800 lg:inline-block">Sealed</Link>
          <Link href="/blog" className="hidden rounded-full px-3 py-1.5 text-sm text-fg/85 hover:bg-ink-800 lg:inline-block">Guides</Link>
          <Link href="/tools" className="hidden rounded-full px-3 py-1.5 text-sm text-fg/85 hover:bg-ink-800 lg:inline-block">Tools</Link>
          <MarketPicker />
          <ThemeToggle />
        </div>
      </div>
      {/* Phones search too: on RiftCompare search is the most-used control. */}
      <div className="px-4 pb-2 md:hidden">
        <SearchBox />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden" aria-label="Main">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 rounded-full px-3 py-1 text-sm text-fg/85 hover:bg-ink-800">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

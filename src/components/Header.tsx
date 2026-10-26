import Link from "next/link";
import { SITE } from "@/site.config";
import { SearchBox } from "./SearchBox";
import { MarketPicker, ThemeToggle } from "./ClientPrefs";

export const NAV = [
  { href: "/cards", label: "Cards" },
  { href: "/sets", label: "Sets" },
  { href: "/sealed", label: "Sealed" },
  { href: "/movers", label: "Movers" },
  { href: "/tools/deal-finder", label: "Deals" },
  { href: "/tools", label: "Tools" },
  { href: "/preorders", label: "Pre-orders" },
  { href: "/blog", label: "Guides" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-black leading-none" aria-label={`${SITE.name} home`}>
          <img src="/icon.svg" alt="" width={34} height={34} className="h-[34px] w-[34px] rounded-lg" />
          <span className="wordmark">{SITE.wordmark[0]}</span>{" "}
          <span className="text-fg">{SITE.wordmark[1]}</span>
          <span className="season-only ml-1 inline" aria-hidden>🎃</span>
        </Link>
        <nav className="hidden gap-1 whitespace-nowrap xl:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-md px-2.5 py-1.5 text-sm hover:bg-ink-800 text-fg/85`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden w-56 md:block">
          <SearchBox />
        </div>
        <MarketPicker />
        <ThemeToggle />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 xl:hidden" aria-label="Main mobile">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 rounded-md px-2.5 py-1 text-sm text-fg/85 hover:bg-ink-800">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

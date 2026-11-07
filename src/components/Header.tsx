import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { ebaySearchUrl, goHref } from "@/lib/affiliate";
import { navGroups, type NavGroup } from "@/lib/nav";
import { historyOn } from "@/lib/data";
import { holidayNav } from "@/lib/holiday-nav";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { MarketPicker } from "./ClientPrefs";
import { HeaderNavItems, type HeaderNavItem } from "./HeaderNav";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBox } from "./SearchBox";
import { CartHeaderLink } from "@/components/cart/CartHeaderLink";

/**
 * The desktop nav (lg and up), in order: Cards, Sealed, Kits (SITE.kits), Deals, Browse (the dropdown: every section of the site,
 * lib/nav.ts groups), Guides. `also`: other paths that count as the section, for its current state.
 */
export function headerNavItems(groups: NavGroup[], sale: { href: string; label: string } | null = null): HeaderNavItem[] {
  return [
    ...(sale ? [{ href: sale.href, label: sale.label, also: [] as string[] }] : []),
    { href: "/sealed", label: "Sealed", also: ["/card"] },
    { href: "/sets", label: "Sets" },
    { href: "/preorders", label: "Pre-orders" },
    ...(SITE.kits ? [{ href: "/kits", label: SITE.kits.label, also: ["/kit"] }] : []),
    { href: "/tools/deal-finder", label: "Deals", also: ["/black-friday", "/cyber-monday", "/boxing-day", "/january-sales", "/lunar-new-year", "/movers"] },
    { href: "/tools", label: "Browse", also: ["/stores", "/price-report", "/forum"], menu: groups },
    { href: "/blog", label: "Guides", xl: true },
  ];
}

/**
 * The site header (the Dex / MTG Compare engine's): ONE row, var(--hdr) tall (60px; 64px from lg), sticky. Everything a page needs
 * to go somewhere else is in it at every width, so nothing below it has to repeat it. From xl it spans the shell (the sidebar's
 * column and the page's). No cookie, header or session is read: one CDN copy per URL; the visitor's market is a browser preference
 * (ClientPrefs.tsx).
 *
 * - Below lg: the logo mark (the word from sm), the search box filling the row, the market button and the menu button
 *   (components/MobileMenu.tsx: every section, then the markets).
 * - lg and up: logo, the sections (NavLink marks the current one), eBay's labelled search link (xl), search, market, theme.
 */
export function Header() {
  const sale = holidayNav();
  const groups = navGroups({ history: historyOn(), sale });
  const items = headerNavItems(groups, sale);
  return (
    <header className="sticky top-0 z-40 h-[var(--hdr)] border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="page flex h-full items-center gap-2 sm:gap-3 lg:gap-4 xl:max-w-shell">
        <Link href="/" className="flex h-11 shrink-0 items-center rounded-lg" aria-label={`${SITE.name} home`}>
          <Logo wordmark="hidden sm:inline" />
        </Link>
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          <HeaderNavItems items={items} />
          {/* A discreet, labelled sponsored item (xl and up only): eBay's search for the game, tagged. Not a section of the site. */}
          <a
            href={goHref({ url: ebaySearchUrl(SITE.ebay.query, "US"), source: "ebay", market: "US" }, undefined, "header-ebay")}
            rel="sponsored nofollow noopener"
            target="_blank"
            className="hidden items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-ink xl:inline-flex"
          >
            <span className="ad-pill">Ad</span> eBay
          </a>
        </nav>
        <div className="hdr-search min-w-0 flex-1 lg:ml-auto lg:w-56 lg:flex-none xl:w-64">
          <SearchBox size="sm" />
        </div>
        <ThemeToggle className="hidden sm:inline-flex" />
        <MarketPicker />
        {/* The cart list (components/cart, owner 2026-11-06): every width, with its count. */}
        <CartHeaderLink />
        <MobileMenu groups={groups} className="lg:hidden" />
      </div>
    </header>
  );
}

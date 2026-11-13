import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { navGroups, type NavGroup } from "@/lib/nav";
import { shopNav, type ShopMenus } from "@/lib/shop-nav";
import { historyOn } from "@/lib/data";
import { holidayNav } from "@/lib/holiday-nav";
import { preorderNav } from "@/lib/preorder-nav";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { MarketPicker } from "./ClientPrefs";
import { HeaderNavItems, type HeaderNavItem } from "./HeaderNav";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBox } from "./SearchBox";
import { CartHeaderLink } from "@/components/cart/CartHeaderLink";

/**
 * The desktop nav (lg and up), in order: Sealed, Sets, Deals, More (five sections at most; a site with kits has the fifth). Sealed
 * (by product type) and Sets (newest first) open a dropdown (lib/shop-nav.ts); Deals opens the sale in season, the release on
 * pre-order, the pre-order hub, the deals, the movers and the stores; More opens the rest of the site (tools, guides). `also`: other
 * paths that count as the section, for its current state.
 *
 * Four sections and no more (the minimal look, 2026-11-13): the row had six entries with the seasonal "Black Friday" link and eBay's
 * sponsored link. The sale page leads the Deals menu in season (lib/nav.ts `sale`) and keeps its strip under the header; eBay's link
 * is gone from the navigation (ads are in the page, labelled, never in the menu row).
 */
export function headerNavItems(all: NavGroup[], shop: ShopMenus): HeaderNavItem[] {
  // Deals & stock gets its own dropdown (owner, 2026-11-09), pre-orders and the stores with it; "More" keeps the tools, the guides and the rest.
  const deals = all.filter((g) => g.title === "Deals & stock");
  const more = all.filter((g) => g.title !== "Deals & stock");
  return [
    { href: "/sealed", label: "Sealed", also: ["/card"], menu: shop.sealed.length ? shop.sealed : undefined },
    { href: "/sets", label: "Sets", menu: shop.sets },
    ...(SITE.kits ? [{ href: "/kits", label: SITE.kits.label, also: ["/kit"] }] : []),
    { href: "/tools/deal-finder", label: "Deals", also: ["/black-friday", "/cyber-monday", "/boxing-day", "/january-sales", "/lunar-new-year", "/movers", "/preorders", "/stores"], menu: deals.length ? deals : undefined },
    { href: "/tools", label: "More", also: ["/price-report", "/forum", "/blog"], menu: more },
  ];
}

/**
 * The site header (the Dex / MTG Compare engine's): ONE row, var(--hdr) tall (60px; 64px from lg), sticky, in the page's own
 * 1200px column. Everything a page needs to go somewhere else is in it at every width, so nothing below it has to repeat it: it is
 * the site's only navigation (the desktop sidebar is gone, 2026-11-13). It sits on the page's own ground and takes its line once the
 * page scrolls under it (globals.css .hdr). No cookie, header or session is read: one CDN copy per URL; the visitor's market is a
 * browser preference (ClientPrefs.tsx).
 *
 * - Below lg: the logo mark (the word from sm), the search box filling the row, the market button, the cart and the menu button
 *   (components/MobileMenu.tsx: every product type, set and section, then the markets).
 * - lg and up: logo, the sections (NavLink marks the current one; each opens its menu), search, theme, market, cart.
 */
export function Header() {
  const sale = holidayNav();
  const preorder = preorderNav();
  const history = historyOn();
  const shop = shopNav();
  const groups = navGroups({ history, sale, preorder, shop: shop.groups });
  // "Deals" and "More" are everything the shopping dropdowns do not already list.
  const items = headerNavItems(navGroups({ history, sale, preorder, shop: [] }), shop.menus);
  return (
    <header className="hdr sticky top-0 z-40 h-[var(--hdr)] border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="page flex h-full items-center gap-2 sm:gap-3 xl:gap-4">
        <Link href="/" className="flex h-11 shrink-0 items-center rounded-lg" aria-label={`${SITE.name} home`}>
          <Logo wordmark="hidden sm:inline" />
        </Link>
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          <HeaderNavItems items={items} />
        </nav>
        {/* The search has the row's spare room (it was a 224px box beside six nav entries): finding a product is the header's main job. */}
        <div className="hdr-search min-w-0 flex-1 lg:ml-auto lg:max-w-sm">
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

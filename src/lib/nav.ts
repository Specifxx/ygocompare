// The site's navigation, once: the header's dropdowns (components/Header.tsx)
// and the phone menu's sheet (components/MobileMenu.tsx) read these groups.
// They were also the left rail's (owner, 2026-11-03), until the header became
// the ONE navigation (owner, 2026-11-13: "we're making things too complicated";
// DECISIONS.md): every link the rail had is in a dropdown, so still a real <a>
// in every page's server HTML. Prices first, tools next, guides and news last.
// Game-specific entries come from src/site.config.ts (kits, lines, creators),
// never from here.
import { SITE } from "@/site.config";
import { TOOLS } from "@/lib/tool-list";
import { creatorsOn } from "@/lib/creators";

// Pages that are empty until a week of daily prices exists. The caller (a server
// component) passes `history` from lib/data.ts historyOn(); this file is also read
// by the client menu, so it never touches the data files itself.
const NEEDS_HISTORY = new Set(["/movers", "/price-report"]);
export interface NavOptions {
  /** False on a site younger than a week: the history pages are left out. */
  history?: boolean;
  /** In season, the Black Friday or Cyber Monday page (lib/black-friday.ts saleStrip): first in Prices. */
  sale?: NavLink | null;
  /** The release on pre-order right now (lib/preorder-nav.ts), before the pre-order hub: its page keeps a link on every page while the sale has the strip. */
  preorder?: NavLink | null;
  /** The shopping groups (lib/shop-nav.ts: sealed by type, sets); the header passes them. Without them there is one flat "Prices" list. */
  shop?: NavGroup[];
}
const readyFor = (o: NavOptions) => (l: NavLink) => o.history !== false || !NEEDS_HISTORY.has(l.href);

export interface NavLink {
  href: string;
  label: string;
}
export interface NavGroup {
  title: string;
  links: NavLink[];
}

export function navGroups(o: NavOptions = {}): NavGroup[] {
  const ready = readyFor(o);
  const prices: NavLink[] = [
    ...(o.sale ? [o.sale] : []),
    ...(SITE.lines ?? []).map((l) => ({ href: `/games/${l.slug}`, label: l.short })),
    { href: "/sealed", label: "Sealed products" },
    { href: "/sealed/booster-box", label: "Booster boxes" },
    { href: "/sets", label: "Sets" },
    ...(SITE.kits ? [{ href: "/kits", label: `${SITE.kits.label} kits` }] : []),
    ...(o.preorder ? [o.preorder] : []),
    { href: "/preorders", label: "Pre-orders" },
    { href: "/tools/deal-finder", label: "Today's deals" },
    { href: "/movers", label: "Price movers" },
    { href: "/stores", label: "Stores we track" },
  ];
  const tools: NavLink[] = TOOLS.filter((t) => t.href !== "/tools/deal-finder").map((t) => ({ href: t.href, label: t.name }));
  const guides: NavLink[] = [
    { href: "/blog", label: "Guides" },
    { href: "/price-report", label: "Monthly price report" },
    { href: "/forum", label: "Community forum" },
    ...(creatorsOn() ? [{ href: "/creators", label: `${SITE.gameShort} creators` }] : []),
    { href: "/about", label: "About" },
  ];
  if (o.shop) {
    // The product types and sets come first (owner, 2026-11-09), so the flat list keeps only what they do not cover.
    const covered = new Set(["/sealed", "/sealed/booster-box", "/sets"]);
    const rest = prices.filter((l) => !covered.has(l.href));
    return [...o.shop, { title: "Deals & stock", links: rest.filter(ready) }, { title: "Free tools", links: tools.filter(ready) }, { title: "Guides & news", links: guides.filter(ready) }];
  }
  return [
    { title: "Prices", links: prices.filter(ready) },
    { title: "Free tools", links: tools.filter(ready) },
    { title: "Guides & news", links: guides.filter(ready) },
  ];
}

/** The short row for the phone header: the pages most visitors want, in order. */
export function phoneNav(o: NavOptions = {}): NavLink[] {
  const ready = readyFor(o);
  return [
    ...(SITE.lines ?? []).map((l) => ({ href: `/games/${l.slug}`, label: l.short })),
    { href: "/sealed", label: "Sealed" },
    { href: "/sets", label: "Sets" },
    ...(SITE.kits ? [{ href: "/kits", label: SITE.kits.label }] : []),
    { href: "/tools/deal-finder", label: "Deals" },
    { href: "/movers", label: "Movers" },
    { href: "/tools", label: "Tools" },
    { href: "/blog", label: "Guides" },
    { href: "/forum", label: "Forum" },
  ].filter(ready);
}

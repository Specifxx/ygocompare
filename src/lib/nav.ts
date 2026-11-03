// The site's navigation, once: the left rail (components/SideNav.tsx, from lg
// up), the phone menu row in the header and the footer columns all read these
// groups, like RiftCompare's and OP Compare's rails (owner, 2026-11-03: "on the
// very, very left we need a side navigation bar, just like Rift Compare, Dex
// Compare, OP Compare"). Prices first, tools next, guides and news last; every
// link a real <a> in the server HTML. Game-specific entries come from
// src/site.config.ts (kits, lines, creators), never from here.
import { SITE } from "@/site.config";
import { TOOLS } from "@/lib/tool-list";
import { creatorsOn } from "@/lib/creators";

export interface NavLink {
  href: string;
  label: string;
}
export interface NavGroup {
  title: string;
  links: NavLink[];
}

export function navGroups(): NavGroup[] {
  const prices: NavLink[] = [
    ...(SITE.lines ?? []).map((l) => ({ href: `/games/${l.slug}`, label: l.short })),
    { href: "/cards", label: "Card prices" },
    { href: "/sets", label: "Set price guides" },
    { href: "/sealed", label: "Sealed products" },
    ...(SITE.kits ? [{ href: "/kits", label: `${SITE.kits.label} kits` }] : []),
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
  return [
    { title: "Prices", links: prices },
    { title: "Free tools", links: tools },
    { title: "Guides & news", links: guides },
  ];
}

/** The short row for the phone header: the pages most visitors want, in order. */
export function phoneNav(): NavLink[] {
  return [
    ...(SITE.lines ?? []).map((l) => ({ href: `/games/${l.slug}`, label: l.short })),
    { href: "/cards", label: "Cards" },
    { href: "/sets", label: "Sets" },
    { href: "/sealed", label: "Sealed" },
    ...(SITE.kits ? [{ href: "/kits", label: SITE.kits.label }] : []),
    { href: "/tools/deal-finder", label: "Deals" },
    { href: "/movers", label: "Movers" },
    { href: "/tools", label: "Tools" },
    { href: "/blog", label: "Guides" },
    { href: "/forum", label: "Forum" },
  ];
}

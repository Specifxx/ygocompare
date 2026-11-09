import Link from "@/components/Link";
import type { NavGroup } from "@/lib/nav";
import { NavLink } from "./NavLink";

/** One desktop nav item; `also`: other paths that count as the section; `menu`: its dropdown's columns (lib/shop-nav.ts, lib/nav.ts groups). */
export interface HeaderNavItem {
  href: string;
  label: string;
  also?: string[];
  xl?: boolean;
  menu?: NavGroup[];
}

// Panel width by column count (static class names, so Tailwind sees them): one to four columns of about 11rem.
const PANEL_W = ["", "w-[14rem] grid-cols-1", "w-[28rem] grid-cols-2", "w-[40rem] grid-cols-3", "w-[52rem] grid-cols-4"];

/**
 * The panel under a dropdown item in the desktop header (the engine's category dropdown, from MTG Compare's "All sealed"): Cards,
 * Sealed, Gunpla and More each open one (owner, 2026-11-09). CSS only (no client state): it opens on hover and while focus is inside
 * it (keyboard: tab to the item and on into the links), so the links are plain <a> in the HTML. Below lg the header has no nav; the
 * phone menu lists the same places.
 */
export function BrowseMenuPanel({ columns, name = "browse" }: { columns: NavGroup[]; name?: string }) {
  return (
    <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
      <div className={`grid max-w-[calc(100vw-2rem)] gap-6 rounded-2xl border border-line bg-surface p-5 shadow-lift ${PANEL_W[Math.min(columns.length, 4)] ?? PANEL_W[3]}`} data-menu={name}>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="eyebrow mb-2">{col.title}</p>
            <ul className="space-y-0.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-raised">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The desktop nav's items (lg and up). NavLink marks the current one; "Browse" carries its dropdown. */
export function HeaderNavItems({ items }: { items: HeaderNavItem[] }) {
  return (
    <>
      {items.map((n) => {
        const link = (
          <NavLink key={n.label} href={n.href} also={n.also} className={`${n.xl ? "hidden xl:inline-flex" : "inline-flex"} whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors`}>
            {n.label}
          </NavLink>
        );
        return n.menu ? (
          <div key={n.label} className="group relative">
            {link}
            <BrowseMenuPanel columns={n.menu} name={n.label.toLowerCase()} />
          </div>
        ) : (
          link
        );
      })}
    </>
  );
}

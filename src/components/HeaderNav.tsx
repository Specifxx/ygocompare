import Link from "@/components/Link";
import type { NavGroup } from "@/lib/nav";
import { NavLink } from "./NavLink";

/** One desktop nav item; `also`: other paths that count as the section; `menu`: the "Browse" dropdown's columns (lib/nav.ts groups). */
export interface HeaderNavItem {
  href: string;
  label: string;
  also?: string[];
  xl?: boolean;
  menu?: NavGroup[];
}

/**
 * The panel under "Browse" in the desktop header (the engine's category dropdown, from MTG Compare's "All sealed"). CSS only (no
 * client state): it opens on hover and while focus is inside it (keyboard: tab to "Browse" and on into the links), so the links are
 * plain <a> in the HTML. Below lg the header has no nav; the phone menu lists the same places.
 */
export function BrowseMenuPanel({ columns }: { columns: NavGroup[] }) {
  return (
    <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
      <div className="grid w-[44rem] grid-cols-3 gap-6 rounded-2xl border border-line bg-surface p-5 shadow-lift" data-menu="browse">
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
            <BrowseMenuPanel columns={n.menu} />
          </div>
        ) : (
          link
        );
      })}
    </>
  );
}

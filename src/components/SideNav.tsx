"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";
import { SITE } from "@/site.config";
import { ebaySearchUrl, goHref } from "@/lib/affiliate";
import { navGroups, type NavGroup } from "@/lib/nav";
import { isActivePath } from "./NavLink";

/**
 * The desktop sidebar (xl and up; the engine's, from MTG Compare and DexCompare): every section of the site in groups (lib/nav.ts
 * navGroups), in the page's flow beside <main>, sticky under the header and scrolling on its own. Plain links in the server's HTML,
 * the current page marked. Below xl the header and the phone menu carry the same places. The eBay search at the bottom is a
 * labelled ad (placement menu-ebay), never a section of the site.
 */
export function SideNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname() || "/";
  return (
    <aside className="hidden w-60 shrink-0 xl:block" data-sidenav="">
      <nav aria-label="Browse" className="sticky top-[var(--hdr)] max-h-[calc(100dvh-var(--hdr))] overflow-y-auto overscroll-contain py-6 pl-6 pr-3">
        {groups.map((g) => (
          <div key={g.title} className="mb-5">
            <p className="eyebrow mb-1 px-2">{g.title}</p>
            <ul>
              {g.links.map((l) => {
                const active = isActivePath(pathname, l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-lg px-2 py-1.5 text-sm leading-5 transition-colors ${active ? "bg-raised font-semibold text-ink ring-1 ring-inset ring-line" : "text-muted hover:bg-raised hover:text-ink"}`}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="ad-box mx-2 mb-6 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold">
            <span className="ad-pill">Ad</span> New on eBay
          </p>
          <a href={goHref({ url: ebaySearchUrl(SITE.ebay.query, "US"), source: "ebay", market: "US" }, undefined, "menu-ebay")} rel="sponsored nofollow noopener" target="_blank" className="mt-2 block text-sm font-semibold text-brand-strong">
            Search eBay →
          </a>
        </div>
      </nav>
    </aside>
  );
}

export { navGroups };

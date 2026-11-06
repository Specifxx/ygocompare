"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { SITE } from "@/site.config";
import { ebaySearchUrl, goHref } from "@/lib/affiliate";
import type { NavGroup } from "@/lib/nav";
import { Icon } from "./Icon";
import { LogoMark } from "./Logo";
import { isActivePath } from "./NavLink";
import { MarketChooser } from "./ClientPrefs";
import { ThemeToggle } from "./ThemeToggle";

/**
 * The menu button and its sheet (the engine's phone menu, from MTG Compare): a native modal <dialog> (showModal: the page behind is
 * inert, focus stays inside, Escape closes it, and focus returns to the button), drawn as a full-width sheet from the top of the
 * screen. It closes on any link (the pathname effect catches back/forward too). The sheet's contents are rendered on the first open,
 * not in the server's HTML: every link in it is in the sidebar, the header or the footer already. Never opens by itself (pop-up
 * policy). `groups`: lib/nav.ts navGroups, built on the server.
 */
export function MobileMenu({ groups, className = "" }: { groups: NavGroup[]; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const close = () => ref.current?.close();

  useEffect(() => {
    ref.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => {
          // The contents first (synchronously), so showModal() finds the close button to focus.
          if (!ready) flushSync(() => setReady(true));
          ref.current?.showModal();
          setOpen(true);
        }}
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-ink/30 ${className}`}
      >
        <Icon name="menu" size={20} />
      </button>
      <dialog
        ref={ref}
        id="site-menu"
        data-menu="mobile"
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === ref.current && close()}
        className="menu-sheet fixed inset-x-0 bottom-auto top-0 m-0 h-auto max-h-[100dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-b-2xl border-0 bg-surface p-0 text-ink shadow-lift"
      >
        {ready && <MenuSheet groups={groups} pathname={pathname} onClose={close} />}
      </dialog>
    </>
  );
}

/** The sheet: everything the site has, grouped as the desktop sidebar is (lib/nav.ts), the markets, the eBay search (a labelled ad), About and Contact. */
export function MenuSheet({ groups, pathname, onClose: close }: { groups: NavGroup[]; pathname: string; onClose: () => void }) {
  return (
    <div className="page pb-5">
      <div className="flex h-[var(--hdr)] items-center gap-3 border-b border-line">
        <LogoMark className="h-8 w-8" />
        <span className="min-w-0 flex-1 truncate font-display text-lg font-bold tracking-tight">{SITE.name}</span>
        <ThemeToggle />
        <button type="button" onClick={close} aria-label="Close menu" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-ink/30">
          <Icon name="close" size={20} />
        </button>
      </div>

      <nav aria-label="Sections" className="mt-1">
        {groups.map((g) => (
          <section key={g.title} className="border-b border-line py-3">
            <p className="eyebrow mb-1.5 px-2">{g.title}</p>
            <ul className="grid grid-cols-2 gap-x-2 sm:grid-cols-3">
              {g.links.map((l) => {
                const active = isActivePath(pathname, l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center rounded-xl px-2 py-1.5 text-[15px] font-medium leading-5 transition-colors hover:bg-raised ${active ? "bg-raised text-brand-strong" : ""}`}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <div className="mt-4">
        <p className="eyebrow mb-2.5 px-2">Prices for</p>
        <MarketChooser bare className="px-2" />
      </div>

      <a href={goHref({ url: ebaySearchUrl(SITE.ebay.query, "US"), source: "ebay", market: "US" }, undefined, "menu-ebay")} rel="sponsored nofollow noopener" target="_blank" className="btn-ad mt-4 w-full">
        <span className="ad-pill">Ad</span> Search eBay
      </a>

      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 px-2 text-sm">
        <Link href="/about" onClick={close} className="inline-flex min-h-10 items-center text-muted hover:text-ink">
          About &amp; how it works
        </Link>
        <Link href="/contact" onClick={close} className="inline-flex min-h-10 items-center text-muted hover:text-ink">
          Contact
        </Link>
      </p>
    </div>
  );
}

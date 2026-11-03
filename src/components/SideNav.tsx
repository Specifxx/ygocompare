"use client";
// The left navigation rail (owner, 2026-11-03), from lg up: the logo, a
// feature search and every section of the site in groups, like RiftCompare's.
// Fixed to the left edge; the page keeps `--sidenav-w` of room for it
// (globals.css). Every link is a real <a> in the server HTML; the only
// client-side parts are the current-page mark, the collapsible groups and the
// filter box. Below lg the header's own row carries the navigation.
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { navGroups, type NavGroup } from "@/lib/nav";

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname || href === "/") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`h-3 w-3 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function SideNav({ groups: given }: { groups?: NavGroup[] }) {
  const pathname = usePathname();
  const groups = useMemo(() => given ?? navGroups(), [given]);
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<Set<string>>(() => new Set());
  const needle = q.trim().toLowerCase();
  const shown: NavGroup[] = needle ? groups.map((g) => ({ ...g, links: g.links.filter((l) => l.label.toLowerCase().includes(needle)) })).filter((g) => g.links.length > 0) : groups;
  return (
    <nav aria-label="Site navigation" className="sidenav fixed inset-y-0 left-0 z-40 hidden w-[var(--sidenav-w)] flex-col border-r border-ink-800/80 bg-ink-950/95 backdrop-blur lg:flex">
      <Link href="/" className="flex items-center gap-2 px-4 py-3 font-display text-base font-black leading-none" aria-label={`${SITE.name} home`}>
        <span className="xmas-hat-host">
          <img src="/icon.svg" alt={`${SITE.name} logo`} width={32} height={32} className="h-8 w-8 shrink-0 rounded-xl" />
          <span aria-hidden="true" className="xmas-logo-hat" />
        </span>
        <span>
          <span className="wordmark">{SITE.wordmark[0]}</span> <span className="text-fg">{SITE.wordmark[1]}</span>
          <span className="block font-sans text-[11px] font-medium text-muted">{SITE.gameShort} prices</span>
        </span>
      </Link>
      <div className="px-3 pb-2">
        <label className="relative block">
          <span className="sr-only">Search features</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search features" className="w-full rounded-xl border border-ink-700/70 bg-ink-900 py-1.5 pl-8 pr-2 text-xs text-fg placeholder:text-muted focus:border-brand focus:outline-none" />
        </label>
      </div>
      <div className="sidenav-scroll flex-1 overflow-y-auto px-2 pb-6">
        {shown.map((g) => {
          const open = needle ? true : !closed.has(g.title);
          return (
            <div key={g.title} className="mb-2">
              <button
                type="button"
                aria-expanded={open}
                onClick={() =>
                  setClosed((prev) => {
                    const next = new Set(prev);
                    if (next.has(g.title)) next.delete(g.title);
                    else next.add(g.title);
                    return next;
                  })
                }
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-fg"
              >
                {g.title}
                <Chevron open={open} />
              </button>
              {open && (
                <ul>
                  {g.links.map((l) => {
                    const on = isActive(pathname, l.href);
                    return (
                      <li key={l.href}>
                        <Link href={l.href} aria-current={on ? "page" : undefined} className={`block rounded-lg px-2 py-1.5 text-[13px] transition-colors ${on ? "bg-brand/15 font-semibold text-fg" : "text-fg/80 hover:bg-ink-800 hover:text-fg"}`}>
                          {l.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
        {shown.length === 0 && <p className="px-2 text-xs text-muted">Nothing matches.</p>}
      </div>
    </nav>
  );
}

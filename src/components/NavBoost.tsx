"use client";
// Page-to-page clicks that feel instant, on the real URLs (owner, 2026-11-23: "very, very fast to use ... clicking all the
// tabs"). One delegated listener for the whole site, nothing per link, nothing in the server HTML:
//  1. Intent prefetch: the page a visitor is about to open starts loading on touch-down, on a 65 ms hover and on keyboard
//     focus, so its payload is usually here by the time the click lands. Only a link somebody is already pressing or
//     pointing at, once a visit: never the viewport prefetch components/Link.tsx turns off for cost.
//  2. The main tabs (NAV_WARM) are fetched once when the browser is idle, a few CDN-cached hubs, so the tabs switch at once.
//     Skipped on Save-Data and 2g.
//  3. Feedback inside the tap: `html[data-nav]` draws a line of light along the top edge (globals.css) from the click
//     until the new page is in, so a tap never looks ignored.
// Links out (/go, /out, /api), downloads, new-tab links and other hosts are left alone.
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const SKIP = /^\/(go|out|api|embed|_next)(\/|$)/;

/** The same-origin page path an anchor would open in this tab, or null (pure: tests/nav-boost.test.ts). */
export function boostTarget(a: { href: string; target?: string | null; download?: boolean; rel?: string | null }, here: { origin: string; pathname: string; search: string }): string | null {
  let u: URL;
  try { u = new URL(a.href, here.origin); } catch { return null; }
  if (u.origin !== here.origin) return null;
  if (a.download || (a.target && a.target !== "_self")) return null;
  if (/\bsponsored\b/.test(a.rel ?? "")) return null;
  if (SKIP.test(u.pathname)) return null;
  if (u.pathname === here.pathname && u.search === here.search) return null; // the same page, or a #hash on it
  return u.pathname + u.search;
}

export function NavBoost({ warm = [] }: { warm?: readonly string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const seen = useRef(new Set<string>());

  // The new page is in: the line goes away.
  useEffect(() => {
    delete document.documentElement.dataset.nav;
  }, [pathname]);

  useEffect(() => {
    const target = (e: Event): string | null => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return null;
      return boostTarget({ href: a.getAttribute("href") ?? "", target: a.target, download: a.hasAttribute("download"), rel: a.rel }, window.location);
    };
    const fetchIt = (to: string | null) => {
      if (!to || seen.current.has(to)) return;
      seen.current.add(to);
      try { router.prefetch(to); } catch { /* the click still navigates */ }
    };
    let hover: number | undefined;
    const down = (e: Event) => fetchIt(target(e));
    const over = (e: Event) => {
      const to = target(e);
      window.clearTimeout(hover);
      if (to) hover = window.setTimeout(() => fetchIt(to), 65);
    };
    const click = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a || a.hasAttribute("data-qv") || !target(e)) return; // a tile's tap can open the quick view instead
      document.documentElement.dataset.nav = "1";
      window.setTimeout(() => { delete document.documentElement.dataset.nav; }, 8000);
    };
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("mouseover", over, { passive: true });
    document.addEventListener("focusin", down, { passive: true });
    document.addEventListener("click", click);
    return () => {
      window.clearTimeout(hover);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("focusin", down);
      document.removeEventListener("click", click);
    };
  }, [router]);

  // The main tabs, once, when the browser has nothing else to do.
  useEffect(() => {
    if (!warm.length) return;
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (c?.saveData || /2g/.test(c?.effectiveType ?? "")) return;
    const run = () => warm.forEach((to) => {
      if (to === window.location.pathname || seen.current.has(to)) return;
      seen.current.add(to);
      try { router.prefetch(to); } catch { /* nothing lost */ }
    });
    const idle = "requestIdleCallback" in window;
    const id = idle ? window.requestIdleCallback(run, { timeout: 4000 }) : window.setTimeout(run, 2500);
    return () => { if (idle) window.cancelIdleCallback(id); else window.clearTimeout(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return <div className="nav-line bg-brand" aria-hidden="true" />;
}

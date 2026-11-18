"use client";
// The leave nudge: see lib/leave-nudge.ts for the rules. It watches for a buy click (any /go link) this session; on a product page with
// none, when the pointer leaves through the top of the window (desktop) or after a long read with a scroll (phone), the "on" arm sees a
// small dismissible card with the page's own eBay and TCGplayer links for that product.
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { SITE } from "@/site.config";
import {
  LEAVE_ARM_KEY, LEAVE_LAST_KEY, LEAVE_PHONE_DWELL_MS, LEAVE_SESSION_KEY, leaveEligible, leaveHref, leaveShows, pageProduct,
} from "@/lib/leave-nudge";
import { pickArm } from "@/lib/return-nudge";

interface View { e?: string; g?: string }

const ss = {
  get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch {} },
};
const arm = (): "on" | "off" => {
  try {
    const a = localStorage.getItem(LEAVE_ARM_KEY);
    if (a === "on" || a === "off") return a;
    const n = pickArm(Math.random());
    localStorage.setItem(LEAVE_ARM_KEY, n);
    return n;
  } catch {
    return "off";
  }
};
const lastShown = (): number => { try { return Number(localStorage.getItem(LEAVE_LAST_KEY) ?? 0) || 0; } catch { return 0; } };
// Something else on screen: the rating card, the return nudge or any open dialog (the cart drawer and the menu stay in the page while
// closed, so only one that is really on screen counts).
const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2 || r.right <= 0 || r.bottom <= 0 || r.left >= innerWidth || r.top >= innerHeight) return false;
  const vis = (el as HTMLElement).checkVisibility?.({ opacityProperty: true, visibilityProperty: true } as CheckVisibilityOptions);
  return vis ?? true;
};
const blocked = () =>
  [...document.querySelectorAll("[data-rate-card], [data-return-nudge], dialog[open], [role=dialog], [aria-modal=true]")].some(onScreen);

export function LeaveNudge() {
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    const start = Date.now();
    let scrolled = false;
    let done = false;
    const phone = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onBuy = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("a[href^='/go?']")) ss.set(LEAVE_SESSION_KEY, "bought");
    };
    const onScroll = () => { if (window.scrollY > window.innerHeight * 0.5) scrolled = true; };

    const attempt = (trigger: "exit" | "dwell") => {
      if (done) return;
      const hrefs = [...document.querySelectorAll<HTMLAnchorElement>("a[href^='/go?']")].map((x) => x.getAttribute("href") ?? "");
      const prod = pageProduct(hrefs, location.pathname);
      const sess = ss.get(LEAVE_SESSION_KEY);
      const state = {
        arm: arm(), trigger, dwellMs: Date.now() - start, scrolled,
        boughtThisSession: sess === "bought", shownThisSession: sess === "shown",
        lastShownAt: lastShown(), now: Date.now(), blocked: blocked(), hasLinks: !!(prod && (prod.ebay || prod.tcg)),
      };
      if (!leaveEligible(state) || !prod) return;
      done = true;
      ss.set(LEAVE_SESSION_KEY, "shown"); // once a session, whichever arm
      try { localStorage.setItem(LEAVE_LAST_KEY, String(Date.now())); } catch {}
      const props = { arm: state.arm, trigger, product: prod.p, site: SITE.key, dwell_s: Math.round(state.dwellMs / 1000) };
      track("leave_eligible", props);
      if (leaveShows(state)) {
        track("leave_shown", props);
        setView({ e: prod.ebay ? leaveHref(prod.ebay) : undefined, g: prod.tcg ? leaveHref(prod.tcg) : undefined });
      }
    };

    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget || e.clientY > 0) return; // only when the pointer leaves the window through the top (tabs, address bar)
      attempt("exit");
    };

    document.addEventListener("click", onBuy, true);
    document.addEventListener("auxclick", onBuy, true);
    if (phone) {
      window.addEventListener("scroll", onScroll, { passive: true });
      const tick = () => {
        attempt("dwell");
        if (!done) timer = setTimeout(tick, 5000);
      };
      timer = setTimeout(tick, LEAVE_PHONE_DWELL_MS);
    } else {
      document.documentElement.addEventListener("mouseout", onOut);
    }
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("click", onBuy, true);
      document.removeEventListener("auxclick", onBuy, true);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("mouseout", onOut);
    };
  }, []);

  useEffect(() => {
    if (!view) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setView(null);
    const t = setTimeout(() => setView(null), 25000);
    document.addEventListener("keydown", esc);
    return () => { clearTimeout(t); document.removeEventListener("keydown", esc); };
  }, [view]);

  if (!view) return null;
  const open = (which: string) => { track("leave_click", { which, site: SITE.key }); setView(null); };
  return (
    <div role="status" data-dock-yield data-leave-nudge className="fixed bottom-20 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border border-line bg-surface p-3 text-sm text-ink shadow-lg md:bottom-6">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">Before you go <span className="ml-1 rounded border border-line px-1 text-[10px] font-semibold uppercase text-muted">Ad</span></p>
        <button type="button" aria-label="Close" onClick={() => setView(null)} className="-mr-1 -mt-1 inline-flex min-h-8 min-w-8 items-center justify-center text-muted hover:text-ink">✕</button>
      </div>
      <p className="mt-0.5 text-xs text-muted">See this product&apos;s listings on eBay and TCGplayer too.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {view.e && <a href={view.e} target="_blank" rel="sponsored nofollow noopener" onClick={() => open("ebay")} className="btn-primary min-h-10 px-3 py-1.5">eBay <span aria-hidden="true">↗</span></a>}
        {view.g && <a href={view.g} target="_blank" rel="sponsored nofollow noopener" onClick={() => open("tcgplayer")} className="btn-tcg min-h-10 px-3 py-1.5">TCGplayer <span aria-hidden="true">↗</span></a>}
      </div>
    </div>
  );
}

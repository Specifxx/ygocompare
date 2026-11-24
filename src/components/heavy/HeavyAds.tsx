"use client";
// The heavy set of the ad-intensity test (lib/ad-heavy.ts has the rules): the TCGplayer "Recommended for you" pop-up, at most once a
// visit and never while the visitor types (the slide-in card and the top banner pair were removed 2026-11-24, owner's UX review).
// Browser only: nothing here is in the server HTML. Labelled "Ad", every link rel sponsored through /go under `heavy-popup`.
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";
import { SITE } from "@/site.config";
import type { AdTile } from "@/lib/card-ads";
import { goHref } from "@/lib/affiliate";
import { money } from "@/lib/format";
import { AD_HEAVY, countView, heavyBlocked, heavyPhone, notePopup, popupDue, popupsShown } from "@/lib/ad-heavy";
import { claimPromptSlot, promptSlotHolder } from "@/lib/prompt-slot";
import { visitorBusy, watchTyping } from "@/lib/visitor-busy";

function Pick({ t, page, big = false }: { t: AdTile; page: string; big?: boolean }) {
  return (
    <a
      href={goHref({ url: t.url, source: "tcgplayer", market: "US" }, t.id, page)}
      rel="sponsored nofollow noopener"
      target="_blank"
      title={`${t.name} · ${money(t.cents, t.currency)}`}
      className={`group flex flex-col rounded-xl border border-line bg-surface p-2 transition-colors hover:border-[#1f6fe5] ${big ? "" : "w-[112px] shrink-0"}`}
    >
      <span className="plate relative block aspect-square w-full overflow-hidden rounded-lg">
        {t.image && <img src={t.image} alt={t.name} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain p-1" />}
      </span>
      <span className="mt-1.5 line-clamp-2 h-8 text-[11px] font-semibold leading-4">{t.name}</span>
      <span className="tabular mt-1 text-sm font-bold">{money(t.cents, t.currency)}</span>
      <span className="mt-1.5 rounded-full bg-[#1f6fe5] px-2 py-1 text-center text-[11px] font-bold text-white">View deal</span>
    </a>
  );
}

const X = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

/** The pop-up (the slide-in card was removed 2026-11-24), mounted once in the root layout. `tiles`: TCGplayer's tiles from lib/card-ads.ts (the server's). */
export function HeavyPopups({ tiles, tcgplayerUrl }: { tiles: AdTile[]; tcgplayerUrl: string }) {
  const path = usePathname() || "";
  const [popup, setPopup] = useState(false);
  const picks = tiles.filter((t) => t.image).slice(0, 6);

  useEffect(() => {
    watchTyping();
    if (!AD_HEAVY || picks.length < 3 || heavyBlocked() || heavyPhone()) return;
    const view = countView();
    if (!popupDue(view, popupsShown()) || promptSlotHolder()) return;
    // A beat after the page draws, so the visitor sees where they are first. Never over a visitor who is typing or has a field
    // focused (owner, 2026-11-23): this page is skipped and a later one may try again.
    const t1 = window.setTimeout(() => {
      // Another open dialog (the quick view, an open cart) goes first; a closed drawer kept in the page is hidden or inert.
      const open = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some((d) => !d.closest('[aria-hidden="true"], [inert]'));
      if (open || visitorBusy() || !claimPromptSlot("heavy-popup")) return;
      notePopup();
      setPopup(true);
      track("heavy_ad", { kind: "popup", view });
    }, 2500);
    return () => window.clearTimeout(t1);
    // One count per page: the path is the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const close = useCallback(() => setPopup(false), []);
  useEffect(() => {
    if (!popup) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", key);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", key);
    };
  }, [popup, close]);

  if (!AD_HEAVY) return null;
  return (
    <>
      {popup && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Recommended for you" data-heavy-popup>
          <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={close} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-line bg-surface p-4 shadow-lift sm:rounded-2xl sm:p-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2">
                  <span className="ad-pill">Ad</span>
                  <span className="text-lg font-black leading-none tracking-tight" aria-label="TCGplayer">
                    TCG<span className="text-[#1f6fe5]">player</span>
                  </span>
                </p>
                <h2 className="mt-1.5 text-xl font-bold leading-tight text-ink">Recommended for you</h2>
                <p className="mt-0.5 text-sm text-muted">{SITE.gameShort} sealed in stock on TCGplayer today, prices in US$.</p>
              </div>
              <button type="button" onClick={close} autoFocus aria-label="Close" className="-mr-1 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink">
                {X}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {picks.map((t) => (
                <Pick key={t.id} t={t} page="heavy-popup" big />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <a href={goHref({ url: tcgplayerUrl, source: "tcgplayer", market: "US" }, undefined, "heavy-popup-all")} rel="sponsored nofollow noopener" target="_blank" className="rounded-full bg-[#1f6fe5] px-4 py-2 text-sm font-bold text-white hover:opacity-90">
                Shop all on TCGplayer →
              </a>
              <button type="button" onClick={close} className="text-sm font-semibold text-muted underline-offset-2 hover:text-ink hover:underline">
                No thanks, continue to the site
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-tight text-muted">Paid link: {SITE.name} may earn a commission from TCGplayer purchases, at no cost to you.</p>
          </div>
        </div>
      )}
    </>
  );
}

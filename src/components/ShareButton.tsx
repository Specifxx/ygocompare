"use client";
// Share (owner, 2026-11-02, word of mouth): the phone's own share sheet
// (navigator.share) where there is one, else the link copied to the clipboard
// with a short "Link copied" note. No pop-up, no account. The link is the
// page's canonical URL plus utm_source=share (lib/share.ts), and the message
// names the real price gap in the visitor's market when there is one.
//
// Share-for-a-deal (owner, 2026-11-18): in the "reward" arm the button says
// "Share · get a deal" and, once a share completes, opens a small card under
// itself with today's best store deal in the visitor's market and a link to
// Deal Finder, from the static /share-deal.json (fetched only then). It opens
// only on the visitor's own tap and closes with ✕. The "plain" arm is the
// control. Events: share { medium, arm }, share_unlock { medium }.
import Link from "@/components/Link";
import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { money } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { pickShareArm, priceGap, SHARE_ARM_KEY, shareText, shareUrl, type ShareArm, type ShareDeal, type ShareMedium } from "@/lib/share";
import type { Offer } from "@/lib/site-types";
import { useMarket } from "./ClientPrefs";

function useShareArm(): ShareArm {
  const [arm, setArm] = useState<ShareArm>("plain");
  useEffect(() => {
    try {
      const a = pickShareArm(localStorage.getItem(SHARE_ARM_KEY), Math.random());
      localStorage.setItem(SHARE_ARM_KEY, a);
      setArm(a);
    } catch {}
  }, []);
  return arm;
}

export function ShareButton({ path, name, medium, offers, text, label = "Share", compact = false, className = "" }: { path: string; name: string; medium: ShareMedium; offers?: Offer[]; /** overrides the price-gap message */ text?: string; label?: string; /** icon only on phones */ compact?: boolean; className?: string }) {
  const { market } = useMarket();
  const arm = useShareArm();
  const [note, setNote] = useState("");
  const [deal, setDeal] = useState<ShareDeal | null | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const say = (t: string) => {
    setNote(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(""), 2500);
  };

  async function unlock() {
    if (arm !== "reward") return;
    try {
      track("share_unlock", { medium });
    } catch {}
    try {
      const all = (await (await fetch("/share-deal.json")).json()) as Record<string, ShareDeal[]>;
      setDeal(all[market]?.[0] ?? all.US?.[0] ?? null);
    } catch {
      setDeal(null);
    }
  }

  async function share() {
    const url = shareUrl(SITE_URL, path, medium);
    const message = text ?? shareText(name, offers ? priceGap(offers, market) : null, (c, cur) => money(c, cur));
    try {
      track("share", { medium, arm });
    } catch {}
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: name, text: message, url });
        void unlock();
        return;
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${message} ${url}`);
      say("Link copied");
      void unlock();
    } catch {
      say("Couldn’t copy the link");
    }
  }

  const reward = arm === "reward";
  const shown = reward ? "Share · get a deal" : label;
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <button type="button" onClick={share} className="btn-ghost min-h-10 min-w-10 px-3 py-1.5" aria-label={`Share ${name}`} title="Share">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v13" />
        </svg>
        <span className={compact && !reward ? "hidden sm:inline" : reward ? "text-xs sm:text-sm" : undefined}>{shown}</span>
      </button>
      <span role="status" aria-live="polite" className={`pointer-events-none absolute right-0 top-full z-10 mt-1.5 whitespace-nowrap rounded-md bg-fg px-2.5 py-1 text-xs font-semibold text-ink-950 transition-opacity ${note && deal === undefined ? "opacity-100" : "opacity-0"}`}>
        {note}
      </span>
      {deal !== undefined && (
        <span className="card absolute right-0 top-full z-20 mt-2 flex w-72 max-w-[85vw] flex-col gap-1.5 p-3 text-left text-sm shadow-lg">
          <span className="flex items-start justify-between gap-2">
            <span className="font-semibold">Thanks for sharing. Today’s best deal:</span>
            <button type="button" onClick={() => setDeal(undefined)} className="text-muted" aria-label="Close">✕</button>
          </span>
          {deal ? (
            <>
              <Link href={`/card/${deal.slug}`} className="link font-semibold">{deal.name}</Link>
              <span className="text-muted">
                <span className="tabular font-semibold text-ink">{money(deal.cents, deal.currency)}</span> at {deal.store}, {deal.saving}% under market
              </span>
            </>
          ) : (
            <span className="text-muted">No store is under market in your region right now.</span>
          )}
          <Link href="/tools/deal-finder" className="link text-xs font-semibold">See every deal in Deal Finder →</Link>
        </span>
      )}
    </span>
  );
}

"use client";

// Lever 1 of the retention programme (owner, 2026-11-18; lib/watch-price.ts): a one-tap "Watch this price" button right under the
// product's price, opening the same shared alert form (components/PriceAlertForm.tsx, RiftCompare's alert service) in place. The
// usual alert link under the price table stays for everyone. Half of the visitors are the control arm (localStorage `watch-arm`)
// and see no button. Events: `watch_eligible` {arm} once a visitor-day on a product page (both arms), `watch_open` and
// `watch_signup` {arm, from: "top" | "page"} from either form. Never a pop-up, never on its own: it is a button in the page.
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { PriceAlert } from "./PriceAlert";
import type { Market } from "@/lib/site-types";
import { ALERT_EVENT, WATCH_ARM_KEY, WATCH_SEEN_KEY, pickWatchArm, seenToday, type WatchArm } from "@/lib/watch-price";

export function WatchPrice({ site, productId, prices }: { site: string; productId: number; prices: Partial<Record<Market, number>> }) {
  const [arm, setArm] = useState<WatchArm | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let a: WatchArm = "off";
    try {
      const ls = window.localStorage;
      const v = ls.getItem(WATCH_ARM_KEY);
      a = v === "on" || v === "off" ? v : pickWatchArm(Math.random());
      ls.setItem(WATCH_ARM_KEY, a);
      const day = new Date().toDateString();
      if (!seenToday(ls.getItem(WATCH_SEEN_KEY), day)) {
        ls.setItem(WATCH_SEEN_KEY, day);
        track("watch_eligible", { arm: a });
      }
    } catch {
      return; // no storage: no test, no button
    }
    setArm(a);
    const onAlert = (ev: Event) => {
      const d = (ev as CustomEvent<{ kind?: string; from?: string }>).detail ?? {};
      const props = { arm: a, from: d.from === "top" ? "top" : "page" };
      if (d.kind === "open") track("watch_open", props);
      if (d.kind === "saved") track("watch_signup", props);
    };
    window.addEventListener(ALERT_EVENT, onAlert);
    return () => window.removeEventListener(ALERT_EVENT, onAlert);
  }, []);

  if (arm !== "on") return null;
  if (open) return <PriceAlert site={site} productId={productId} prices={prices} defaultOpen from="top" />;
  return (
    <button
      type="button"
      onClick={() => {
        setOpen(true);
        window.dispatchEvent(new CustomEvent(ALERT_EVENT, { detail: { kind: "open", from: "top" } }));
      }}
      className="mt-3 inline-flex items-center gap-2"
      style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid currentColor", background: "transparent", color: "inherit", font: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      Watch this price
      <span style={{ fontWeight: 400, opacity: 0.75 }}>· free email when it drops</span>
    </button>
  );
}

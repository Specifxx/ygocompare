"use client";

// Lever 2 of the retention programme (owner, 2026-11-18; lib/since-visit.ts): on a returning visitor's first page of the
// day, one in-page line under the header when something they looked at on an earlier day is cheaper now in their market.
// Never on a first visit (there is nothing seen yet), never a pop-up or overlay, one ✕ hides it. Half of the visitors are
// the control arm and see nothing. `SeenPrice` (on the product page) notes what was seen.
import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { useMarket } from "./ClientPrefs";
import { money } from "@/lib/format";
import { CURRENCY, type Market } from "@/lib/site-types";
import {
  SEEN_KEY, SINCE_ARM_KEY, SINCE_DAY_KEY, checkedToday, findDrops, hasEarlier, localDay, noteSeen, parseSeen, pickSinceArm, rebase,
  type Drop, type FeedItem, type SinceArm,
} from "@/lib/since-visit";

export function SeenPrice({ productId, prices }: { productId: string | number; prices: Partial<Record<Market, number>> }) {
  useEffect(() => {
    // Wait a moment so the strip (which reads the list first on this same page) compares against the older prices.
    const t = window.setTimeout(() => {
      try {
        const ls = window.localStorage;
        ls.setItem(SEEN_KEY, JSON.stringify(noteSeen(parseSeen(ls.getItem(SEEN_KEY)), String(productId), localDay(new Date()), prices)));
      } catch {}
    }, 1500);
    return () => window.clearTimeout(t);
  }, [productId, prices]);
  return null;
}

/** `wrap`: the class of a box around the line, for a layout that mounts it outside the page column. */
export function SinceLastVisit({ wrap }: { wrap?: string } = {}) {
  const { market } = useMarket();
  const marketRef = useRef(market);
  marketRef.current = market;
  const [view, setView] = useState<{ drops: Drop[]; arm: SinceArm; cur: string } | null>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let ls: Storage;
    try {
      ls = window.localStorage;
    } catch {
      return;
    }
    const day = localDay(new Date());
    let list;
    try {
      if (checkedToday(ls.getItem(SINCE_DAY_KEY), day)) return;
      list = parseSeen(ls.getItem(SEEN_KEY));
      if (!hasEarlier(list, day)) return;
    } catch {
      return;
    }
    // The market is the one ClientPrefs settles on (saved choice, else the time zone's); give it a moment.
    const t = window.setTimeout(async () => {
      try {
        ls.setItem(SINCE_DAY_KEY, day);
        const res = await fetch("/alert-feed.json");
        if (!res.ok) return;
        const feed = (await res.json()) as { items?: Record<string, FeedItem> };
        const items = feed.items ?? {};
        const m: Market = marketRef.current;
        const drops = findDrops(list, items, m, day);
        ls.setItem(SEEN_KEY, JSON.stringify(rebase(parseSeen(ls.getItem(SEEN_KEY)), items, day)));
        if (!drops.length || cancelled) return;
        const v = ls.getItem(SINCE_ARM_KEY);
        const arm: SinceArm = v === "on" || v === "off" ? v : pickSinceArm(Math.random());
        ls.setItem(SINCE_ARM_KEY, arm);
        const props = { arm, drops: Math.min(drops.length, 9) };
        track("since_eligible", props);
        if (arm !== "on") return;
        track("since_shown", props);
        setView({ drops: drops.slice(0, 3), arm, cur: CURRENCY[m] ?? "USD" });
      } catch {}
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  if (!view || gone) return null;
  const { drops, cur } = view;
  const line = (
    <section
      aria-label="Since your last visit"
      className={`${wrap ? "mt-4" : "mb-4"} text-sm`}
      style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(127,127,127,.35)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <strong>Cheaper since your last visit</strong>
        <button
          type="button"
          aria-label="Hide"
          onClick={() => setGone(true)}
          style={{ background: "transparent", border: 0, color: "inherit", font: "inherit", cursor: "pointer", padding: "0 4px", opacity: 0.7 }}
        >
          ✕
        </button>
      </div>
      <ul className="mt-1">
        {drops.map((d, i) => (
          <li key={d.id} className="flex items-baseline justify-between gap-3 py-0.5">
            <a
              href={d.url}
              className="min-w-0 truncate underline underline-offset-2"
              onClick={() => track("since_click", { arm: "on", pos: i + 1 })}
            >
              {d.name}
            </a>
            <span className="shrink-0" style={{ whiteSpace: "nowrap" }}>
              <s style={{ opacity: 0.6 }}>{money(d.was, cur)}</s> <strong>{money(d.now, cur)}</strong>{" "}
              <span style={{ color: "#16a34a", fontWeight: 600 }}>−{d.pct}%</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
  return wrap ? <div className={wrap}>{line}</div> : line;
}

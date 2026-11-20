"use client";
// The card page's price alert (components/PriceAlertForm.tsx) in the
// visitor's market: the server passes every market's lowest in-stock store
// price (lib/alert-feed.ts lowestByMarket), the market is picked client-side
// like the rest of the page.
//
// One tap for anyone signed in (2026-11-20, as MTG Compare 2026-11-19; boardroom: one-tap restock and price-drop alerts, free for
// all). Signed in with any account (free or Premium): with a price today, one button sets an alert 10% under it (the form's own
// suggestion) with "Pick my price" beside it; sold out, one button watches for it back in stock. The account's token names the
// address, so there is no email field. Signed out: the ordinary form, unchanged. The server HTML is the ordinary form
// (usePremium starts "loading"); nothing saves or opens by itself. Event `alert_created` {oneTap}.
import Link from "./Link";
import { useState, type CSSProperties, type FormEvent } from "react";
import { track } from "@vercel/analytics";
import { useMarket } from "./ClientPrefs";
import { ALERT_SERVICE, PriceAlertForm, parseAmount, suggestTarget } from "./PriceAlertForm";
import { usePremium } from "./premium/usePremium";
import { readStored, setRestockWatch, writeStored } from "@/lib/premium-member";
import type { Market } from "@/lib/site-types";

type Props = { site: string; productId: number; prices: Partial<Record<Market, number>>; defaultOpen?: boolean; from?: string };

export function PriceAlert({ site, productId, prices, defaultOpen, from }: Props) {
  const { market } = useMarket();
  const v = usePremium();
  const signedIn = v.status === "member" || v.status === "free";
  if (signedIn) return <OneTapAlert key={market} site={site} productId={String(productId)} region={market} priceCents={prices[market] ?? null} from={from ?? "page"} member={v.status === "member"} />;
  return <PriceAlertForm key={market} defaultOpen={defaultOpen ?? false} from={from} site={site} productId={String(productId)} region={market} priceCents={prices[market] ?? null} className="mt-1 text-sm" />;
}

const SYMBOL: Record<string, string> = { US: "US$", CA: "CA$", AU: "A$", NZ: "NZ$", SG: "S$", UK: "£", EU: "€" };
const money = (cents: number, region: string) => `${SYMBOL[region] ?? ""}${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const pill: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, border: "1px solid currentColor", background: "transparent", color: "inherit", font: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const quiet: CSSProperties = { background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontSize: 14, textDecoration: "underline", cursor: "pointer" };
const field: CSSProperties = { width: 96, padding: "6px 8px", border: "1px solid rgba(127,127,127,.45)", borderRadius: 8, background: "transparent", color: "inherit", font: "inherit", fontSize: 16 };

/** Saves a price alert through the account's token (no email field). "active", or "confirm" when the address is not verified yet. */
async function setPriceWatch(site: string, token: string, productId: string, region: string, targetCents: number): Promise<{ ok: true; active: boolean } | { ok: false; message: string; signIn?: boolean }> {
  try {
    const r = await fetch(ALERT_SERVICE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site, productId, region, targetCents, token }),
      credentials: "omit",
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; status?: string; error?: string };
    if (r.ok && j.ok) return { ok: true, active: j.status === "active" };
    return { ok: false, message: j.error || "Couldn't save your alert. Please try again.", signIn: r.status === 401 };
  } catch {
    return { ok: false, message: "Couldn't save your alert. Check your connection and try again." };
  }
}

function Bell() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function OneTapAlert({ site, productId, region, priceCents, from, member }: { site: string; productId: string; region: string; priceCents: number | null; from: string; member: boolean }) {
  const [s, setS] = useState<{ t: "idle" | "busy" | "pick" } | { t: "done"; text: string } | { t: "error"; m: string }>({ t: "idle" });
  const suggested = priceCents == null ? null : suggestTarget(priceCents);

  function token(): string | null {
    const cur = readStored();
    if (!cur) setS({ t: "error", m: "Sign in again to set alerts with one tap." });
    return cur?.t ?? null;
  }

  async function save(cents: number) {
    const t = token();
    if (!t) return;
    setS({ t: "busy" });
    const r = await setPriceWatch(site, t, productId, region, cents);
    if (r.ok) {
      track("alert_created", { region, oneTap: true, weekly: false, from });
      window.dispatchEvent(new CustomEvent("price-alert", { detail: { kind: "saved", from } }));
      setS({ t: "done", text: r.active ? `Alert on. We'll email you when a ${region} store has it for ${money(cents, region)} or less.` : "Check your inbox: one click in the email we just sent turns it on." });
    } else {
      if (r.signIn) writeStored(null);
      setS({ t: "error", m: r.message });
    }
  }

  async function restock() {
    const t = token();
    if (!t) return;
    setS({ t: "busy" });
    const r = await setRestockWatch(t, productId, region);
    if (r.ok) {
      track("restock_signup", { member: member ? "yes" : "free", region });
      window.dispatchEvent(new CustomEvent("price-alert", { detail: { kind: "saved", from } }));
      setS({ t: "done", text: "Done. We'll email you when it's back in stock." });
    } else {
      if (/sign in again/i.test(r.message)) writeStored(null);
      setS({ t: "error", m: r.message });
    }
  }

  function pick(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cents = parseAmount(String(new FormData(e.currentTarget).get("target") ?? ""));
    if (!cents) return setS({ t: "error", m: "Enter the price you want, like 45 or 45.50." });
    void save(cents);
  }

  if (s.t === "done") {
    return (
      <p className="mt-3 text-sm" role="status">
        <strong>{s.text}</strong>{" "}
        <Link className="underline" href="/watches">My watches</Link>
      </p>
    );
  }

  return (
    <div className="mt-3 text-sm">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        {suggested == null ? (
          <button type="button" style={pill} disabled={s.t === "busy"} onClick={restock}>
            <Bell />
            {s.t === "busy" ? "Saving…" : "Tell me when it's back in stock"}
          </button>
        ) : (
          <>
            <button type="button" style={pill} disabled={s.t === "busy"} onClick={() => save(suggested)}>
              <Bell />
              {s.t === "busy" ? "Saving…" : `Alert me under ${money(suggested, region)}`}
            </button>
            {s.t !== "pick" && (
              <button type="button" style={quiet} onClick={() => setS({ t: "pick" })}>
                Pick my price
              </button>
            )}
          </>
        )}
      </div>
      {s.t === "pick" && suggested != null && (
        <form onSubmit={pick} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 8 }}>
          <label htmlFor={`pa1-${from}-${productId}`}>Email me at {SYMBOL[region] ?? ""}</label>
          <input id={`pa1-${from}-${productId}`} name="target" inputMode="decimal" required defaultValue={(suggested / 100).toFixed(0)} style={field} autoComplete="off" />
          <button type="submit" style={pill}>Set alert</button>
        </form>
      )}
      {s.t === "error" && <p className="mt-1 text-sm" role="alert">{s.m}</p>}
    </div>
  );
}

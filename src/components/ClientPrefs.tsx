"use client";
// The visitor's market (which stores' prices to show first) and theme.
// Pages are cached for everyone, so the choice is applied client-side.
import { createContext, useContext, useEffect, useState } from "react";
import { MARKETS, MARKET_LABEL, type Market } from "@/lib/site-types";
import { Flag } from "./Flag";

const Ctx = createContext<{ market: Market; setMarket: (m: Market) => void }>({ market: "US", setMarket: () => {} });
export const useMarket = () => useContext(Ctx);

function guessMarket(): Market {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.startsWith("Europe/London")) return "UK";
    if (tz.startsWith("Australia/")) return "AU";
    if (tz === "Asia/Singapore") return "SG";
    if (/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns)/.test(tz)) return "CA";
    if (tz.startsWith("Europe/")) return "EU";
  } catch {}
  return "US";
}

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [market, setM] = useState<Market>("US");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("market") as Market | null;
      setM(saved && MARKETS.includes(saved) ? saved : guessMarket());
    } catch {
      setM(guessMarket());
    }
  }, []);
  const setMarket = (m: Market) => {
    setM(m);
    try {
      localStorage.setItem("market", m);
    } catch {}
  };
  return <Ctx.Provider value={{ market, setMarket }}>{children}</Ctx.Provider>;
}

// The header's market button (the engine's chip): the flag and code of the market in use, with a native select laid
// invisibly over them (cheap, keyboard- and screen-reader-friendly; the open list names every market in full).
export function MarketPicker() {
  const { market, setMarket } = useMarket();
  return (
    <label title={`Prices for ${MARKET_LABEL[market]}: change region`} className="chip relative h-11 shrink-0 cursor-pointer px-2.5 focus-within:border-brand lg:h-10">
      <Flag code={market} />
      <span className="text-sm font-semibold">{market}</span>
      <span aria-hidden className="text-[10px] text-muted">▾</span>
      <select aria-label="Your region" value={market} onChange={(e) => setMarket(e.target.value as Market)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
        {MARKETS.map((m) => (
          <option key={m} value={m}>
            {MARKET_LABEL[m]}
          </option>
        ))}
      </select>
    </label>
  );
}

// The homepage hero's region row (owner, 2026-11-02: make the switcher prominent, with flags), and the phone menu's. Same choice
// as the header menu. The engine's chips: the chosen one is .chip-on.
export function MarketChooser({ className = "", bare = false }: { className?: string; bare?: boolean }) {
  const { market, setMarket } = useMarket();
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} role="group" aria-label="Choose your region">
      {!bare && <span className="text-sm text-muted">Prices for</span>}
      {MARKETS.map((m) => {
        const on = m === market;
        return (
          <button key={m} type="button" aria-pressed={on} onClick={() => setMarket(m)} title={MARKET_LABEL[m]} className={`chip ${on ? "chip-on" : ""}`}>
            <Flag code={m} />
            <span className="sm:hidden">{m}</span>
            <span className="hidden sm:inline">{MARKET_LABEL[m]}</span>
          </button>
        );
      })}
    </div>
  );
}

// The light/dark switch moved to its own file (components/ThemeToggle.tsx); re-exported for the pages that import it from here.
export { ThemeToggle } from "./ThemeToggle";

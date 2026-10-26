"use client";
// The visitor's market (which stores' prices to show first) and theme.
// Pages are cached for everyone, so the choice is applied client-side.
import { createContext, useContext, useEffect, useState } from "react";
import { MARKETS, MARKET_LABEL, type Market } from "@/lib/site-types";

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

export function MarketPicker() {
  const { market, setMarket } = useMarket();
  return (
    <select
      aria-label="Your market"
      value={market}
      onChange={(e) => setMarket(e.target.value as Market)}
      className="rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-xs text-fg"
    >
      {MARKETS.map((m) => (
        <option key={m} value={m}>
          {m} · {MARKET_LABEL[m]}
        </option>
      ))}
    </select>
  );
}

export function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => setLight(document.documentElement.getAttribute("data-theme") === "light"), []);
  return (
    <button
      type="button"
      aria-label="Toggle light and dark theme"
      className="rounded-md border border-ink-700 px-2 py-1 text-xs"
      onClick={() => {
        const next = light ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        try {
          localStorage.setItem("theme", next);
        } catch {}
        setLight(!light);
      }}
    >
      {light ? "☾ Dark" : "☀ Light"}
    </button>
  );
}

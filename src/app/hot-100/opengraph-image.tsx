// The Hot 100's share image: the chart's top five with their places and rises, text only like the other share
// images (the Vercel cost cap, 2026-11-08), kept a day. This is what a Reddit link post shows, so it states the
// week and the method. Before a week of history it says so instead of inventing a chart.
import { ImageResponse } from "next/og";
import { SITE } from "@/site.config";
import { hotInputs } from "@/lib/data";
import { money, pct } from "@/lib/format";
import { shortName } from "@/lib/names";
import { dayLabel, hotChart, hotName, latestDay, moveLabel } from "@/lib/hot100";

export const revalidate = 86400;
export const alt = `${SITE.gameShort} Hot 100: this week's biggest price risers on ${SITE.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export default function Image() {
  const t = SITE.theme;
  const inputs = hotInputs();
  const day = latestDay(inputs);
  const c = day == null ? null : hotChart(inputs, day);
  const rows = c?.rows.slice(0, 5) ?? [];
  const n = c?.rows.length ?? 0;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: t.pageDark, color: "#fff", padding: "40px 64px", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 28, color: t.brandLight, fontWeight: 700 }}>{SITE.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 6 }}>
          <span style={{ fontSize: 60, fontWeight: 800 }}>{`${SITE.gameShort} ${n ? hotName(n) : "Hot 100"}`}</span>
          {c && <span style={{ fontSize: 28, color: "#cfd6e6", marginLeft: 20 }}>{`week to ${dayLabel(c.day)}`}</span>}
        </div>
        {rows.length ? (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 14 }}>
            {rows.map((r) => (
              <div key={r.item.id} style={{ display: "flex", alignItems: "baseline", fontSize: 30, marginTop: 10 }}>
                <span style={{ width: 64, fontWeight: 800, color: "#f8fafc" }}>{`#${r.rank}`}</span>
                <span style={{ width: 90, fontSize: 22, color: "#a9b4cc" }}>{(moveLabel(r, c!.lastWeekSize) ?? "").replace("▲", "up").replace("▼", "down").replace("NEW", "new")}</span>
                <span style={{ flex: 1, color: "#f8fafc" }}>{clip(shortName(r.item.name), 34)}</span>
                <span style={{ width: 150, color: "#cfd6e6" }}>{money(r.cents)}</span>
                <span style={{ width: 130, textAlign: "right", fontWeight: 800, color: "#4ade80" }}>{pct(r.change)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 34, color: "#cfd6e6", marginTop: 40 }}>{`The ${SITE.gameShort} products whose price rose most this week, from daily TCGplayer market prices.`}</div>
        )}
        <div style={{ display: "flex", marginTop: "auto", fontSize: 24, color: "#a9b4cc" }}>7-day change in TCGplayer market price · products worth $3 or more</div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}

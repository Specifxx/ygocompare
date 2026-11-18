// The movers page's share image (owner, 2026-11-18: "we need more shareable artefacts"): this week's four biggest
// risers...  by TCGplayer market price, the list people post in finance threads. One image for
// the whole site, text only like the card image (the Vercel cost cap, 2026-11-08), kept a day. Before a week of
// history exists it says so instead of inventing a list.
import { ImageResponse } from "next/og";
import { SITE } from "@/site.config";
import { movers } from "@/lib/data";
import { money, pct } from "@/lib/format";
import { shortName } from "@/lib/names";

export const revalidate = 86400;
export const alt = `${SITE.gameShort} price movers this week on ${SITE.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export default function Image() {
  const t = SITE.theme;
  const w = movers(7, 300);
  const up = w.up.slice(0, 4);
  const down = w.down.slice(0, 3);
  const Row = ({ name, cents, change }: { name: string; cents: number; change: number }) => (
    <div style={{ display: "flex", alignItems: "baseline", fontSize: 28, marginTop: 8 }}>
      <span style={{ width: 150, fontWeight: 800, color: change >= 0 ? "#4ade80" : "#f87171" }}>{pct(change)}</span>
      <span style={{ flex: 1, color: "#f8fafc" }}>{clip(name, 38)}</span>
      <span style={{ color: "#cfd6e6" }}>{money(cents)}</span>
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: t.pageDark, color: "#fff", padding: "44px 64px", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 28, color: t.brandLight, fontWeight: 700 }}>{SITE.name}</div>
        <div style={{ fontSize: 56, fontWeight: 800, marginTop: 8 }}>Biggest price moves this week</div>
        {up.length || down.length ? (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
            {up.map((r) => <Row key={r.p.id} name={shortName(r.p.name)} cents={r.cents} change={r.change} />)}
            {down.length > 0 && <div style={{ height: 2, background: "rgba(255,255,255,0.12)", marginTop: 14, marginBottom: 4 }} />}
            {down.map((r) => <Row key={r.p.id} name={shortName(r.p.name)} cents={r.cents} change={r.change} />)}
          </div>
        ) : (
          <div style={{ fontSize: 34, color: "#cfd6e6", marginTop: 40 }}>{`Risers and fallers across every ${SITE.gameShort} product, from daily TCGplayer market prices.`}</div>
        )}
        <div style={{ display: "flex", marginTop: "auto", fontSize: 24, color: "#a9b4cc" }}>7-day change in TCGplayer market price · products worth $3 or more</div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}

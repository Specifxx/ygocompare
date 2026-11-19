// The Hot 100's share image: the chart itself, as a Reddit link post shows it. A link post is only a title and this
// picture (owner, 2026-11-20: the snapshot posts that work are carried by their thumbnail), so the #1 riser is drawn large
// with its TCGplayer photo and #2 to #6 beside it with theirs, each with its real 7-day rise and price, from the same
// hotChart the page lists. Photos are TCGplayer's 200-pixel images, fetched when the image is drawn (once a day: ISR, a
// day) with a timeout each, kept only as PNG or JPEG; a photo that fails is a plain tile, never a failed image. The other
// share images stay text only (the Vercel cost cap, 2026-11-08): this is the one a link post lives on.
import { ImageResponse } from "next/og";
import { SITE } from "@/site.config";
import { hotInputs } from "@/lib/data";
import { money, pct } from "@/lib/format";
import { shortName } from "@/lib/names";
import { dayLabel, hotChart, hotName, latestDay } from "@/lib/hot100";
import { ogPhoto as photo } from "@/lib/og-photo";

export const revalidate = 86400;
export const alt = `${SITE.gameShort} Hot 100: this week's biggest price risers on ${SITE.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function Tile({ src, w, h }: { src: string | null; w: number; h: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: w, height: h, borderRadius: 12, background: "#ffffff", flexShrink: 0, overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" width={w - 8} height={h - 8} style={{ width: w - 8, height: h - 8, objectFit: "contain" }} /> : <div style={{ display: "flex", width: w / 2, height: h / 2, borderRadius: 8, background: "#e5e7eb" }} />}
    </div>
  );
}

export default async function Image() {
  const t = SITE.theme;
  const inputs = hotInputs();
  const day = latestDay(inputs);
  const c = day == null ? null : hotChart(inputs, day);
  const rows = c?.rows.slice(0, 6) ?? [];
  const n = c?.rows.length ?? 0;
  const photos = await Promise.all(rows.map((r) => photo((r.item as { image?: string | null }).image)));
  const [top, ...rest] = rows;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: t.pageDark, color: "#fff", padding: "34px 52px 30px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 50, fontWeight: 800 }}>{`${SITE.gameShort} ${n ? hotName(n) : "Hot 100"}`}</span>
            {c && <span style={{ fontSize: 24, color: "#cfd6e6", marginLeft: 18 }}>{`week to ${dayLabel(c.day)}`}</span>}
          </div>
          <span style={{ fontSize: 26, color: t.brandLight, fontWeight: 700 }}>{SITE.name}</span>
        </div>
        {top ? (
          <div style={{ display: "flex", marginTop: 20, flexGrow: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", width: 260, marginRight: 26 }}>
              <div style={{ display: "flex", position: "relative" }}>
                <Tile src={photos[0]} w={260} h={300} />
                <div style={{ display: "flex", position: "absolute", top: 10, left: 10, padding: "2px 12px", borderRadius: 999, background: t.pageDark, color: "#fff", fontSize: 26, fontWeight: 800 }}>#1</div>
              </div>
              <div style={{ display: "flex", fontSize: 21, fontWeight: 700, marginTop: 10, color: "#f8fafc" }}>{clip(shortName(top.item.name), 40)}</div>
              <div style={{ display: "flex", alignItems: "baseline", marginTop: 4 }}>
                <span style={{ fontSize: 38, fontWeight: 800, color: "#4ade80" }}>{pct(top.change)}</span>
                <span style={{ fontSize: 22, color: "#cfd6e6", marginLeft: 12 }}>{money(top.cents)}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              {rest.map((r, i) => (
                <div key={r.item.id} style={{ display: "flex", alignItems: "center", padding: "6px 16px 6px 8px", borderRadius: 14, background: "rgba(255,255,255,0.07)", marginBottom: 9 }}>
                  <span style={{ display: "flex", width: 54, justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#a9b4cc" }}>{`#${r.rank}`}</span>
                  <Tile src={photos[i + 1]} w={52} h={64} />
                  <span style={{ display: "flex", flexGrow: 1, fontSize: 23, color: "#f8fafc", marginLeft: 14 }}>{clip(shortName(r.item.name), 30)}</span>
                  <span style={{ display: "flex", fontSize: 22, color: "#cfd6e6", marginRight: 16 }}>{money(r.cents)}</span>
                  <span style={{ display: "flex", fontSize: 26, fontWeight: 800, color: "#4ade80" }}>{pct(r.change)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 34, color: "#cfd6e6", marginTop: 40 }}>{`The ${SITE.gameShort} products whose price rose most this week, from daily TCGplayer market prices.`}</div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#a9b4cc", marginTop: 6 }}>
          <span>7-day change in TCGplayer market price · products worth $3 or more</span>
          <span style={{ color: "#f8fafc" }}>{`${SITE.domain}/hot-100`}</span>
        </div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}

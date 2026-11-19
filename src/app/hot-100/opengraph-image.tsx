// The Hot 100's share image: the chart itself, as a Reddit link post shows it. A link post is only a title and this
// picture (owner, 2026-11-20: the snapshot posts that work are carried by their thumbnail), so the week's three biggest
// rises are drawn beside its three biggest drops, each with its TCGplayer photo, real 7-day change and price, from the same
// hotChart / hotDrops the page lists. Photos are TCGplayer's 200-pixel images, fetched when the image is drawn (once a day: ISR, a
// day) with a timeout each, kept only as PNG or JPEG; a photo that fails is a plain tile, never a failed image. The other
// share images stay text only (the Vercel cost cap, 2026-11-08): this is the one a link post lives on.
import { ImageResponse } from "next/og";
import { SITE } from "@/site.config";
import { hotInputs } from "@/lib/data";
import { money, pct } from "@/lib/format";
import { shortName } from "@/lib/names";
import { dayLabel, hotChart, hotDrops, hotName, latestDay } from "@/lib/hot100";
import { ogPhoto as photo } from "@/lib/og-photo";

export const revalidate = 86400;
export const alt = `${SITE.gameShort} Hot 100: this week's biggest price rises and drops on ${SITE.name}`;
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

type Mover = { item: { id: string | number; name: string; image?: string | null }; cents: number; change: number };

function MoveRow({ r, photo, up }: { r: Mover; photo: string | null; up: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "8px 14px 8px 8px", borderRadius: 14, background: "rgba(255,255,255,0.07)", height: 124, marginBottom: 10 }}>
      <Tile src={photo} w={84} h={108} />
      <div style={{ display: "flex", flexDirection: "column", width: 400, marginLeft: 14 }}>
        <span style={{ display: "flex", width: 400, fontSize: 23, fontWeight: 700, color: "#f8fafc", lineHeight: 1.15 }}>{clip(shortName(r.item.name), 56)}</span>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 6 }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: up ? "#4ade80" : "#f87171" }}>{pct(r.change).replace("-", "−")}</span>
          <span style={{ fontSize: 22, color: "#cfd6e6", marginLeft: 12 }}>{`now ${money(r.cents)}`}</span>
        </div>
      </div>
    </div>
  );
}

function Column({ title, rows, photos, up }: { title: string; rows: Mover[]; photos: (string | null)[]; up: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 536 }}>
      <span style={{ display: "flex", fontSize: 28, fontWeight: 800, color: up ? "#4ade80" : "#f87171", marginBottom: 10 }}>{title}</span>
      {rows.length ? rows.map((r, i) => <MoveRow key={r.item.id} r={r} photo={photos[i]} up={up} />) : <span style={{ fontSize: 22, color: "#cfd6e6" }}>{up ? "No product rose this week." : "No product fell this week."}</span>}
    </div>
  );
}

// Since 2026-11-20 (owner, from a Reddit reply asking for "the biggest drops"): half the week's biggest rises, half its biggest
// drops, three each, from the same hotChart and hotDrops the page lists.
export default async function Image() {
  const t = SITE.theme;
  const inputs = hotInputs();
  const day = latestDay(inputs);
  const c = day == null ? null : hotChart(inputs, day);
  const ups: Mover[] = c?.rows.slice(0, 3) ?? [];
  const downs: Mover[] = day == null ? [] : hotDrops(inputs, day, { max: 3 });
  const n = c?.rows.length ?? 0;
  const photos = await Promise.all([...ups, ...downs].map((r) => photo(r.item.image)));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: t.pageDark, color: "#fff", padding: "32px 52px 28px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <span style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>{`${SITE.gameShort} ${n ? hotName(n) : "Hot 100"}: rises & drops`}</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ display: "flex", fontSize: 24, color: t.brandLight, fontWeight: 700 }}>{SITE.name}</span>
            {c && <span style={{ display: "flex", fontSize: 20, color: "#cfd6e6" }}>{`week to ${dayLabel(c.day)}`}</span>}
          </div>
        </div>
        {ups.length || downs.length ? (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, flexGrow: 1 }}>
            <Column title="Biggest rises" rows={ups} photos={photos.slice(0, ups.length)} up />
            <Column title="Biggest drops" rows={downs} photos={photos.slice(ups.length)} up={false} />
          </div>
        ) : (
          <div style={{ fontSize: 34, color: "#cfd6e6", marginTop: 40 }}>{`The ${SITE.gameShort} products whose price rose and fell most this week, from daily TCGplayer market prices.`}</div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#a9b4cc", marginTop: 4 }}>
          <span>7-day change in TCGplayer market price · products worth $3 or more</span>
          <span style={{ color: "#f8fafc" }}>{`${SITE.domain}/hot-100`}</span>
        </div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}

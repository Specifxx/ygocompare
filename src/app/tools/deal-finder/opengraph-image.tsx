// The Deal Finder's share image (owner, 2026-11-18: "we need more shareable artefacts"): today's five biggest US
// store deals below TCGplayer market, the same rows the share-for-a-deal card picks (lib/share.ts shareDeals: stores
// only, never eBay, Amazon or TCGplayer). Text only (the Vercel cost cap, 2026-11-08), kept a day.
import { ImageResponse } from "next/og";
import { SITE } from "@/site.config";
import { dealRows } from "@/lib/tools";
import { money } from "@/lib/format";
import { shortName } from "@/lib/names";
import { shareDeals, storeName } from "@/lib/share";

export const revalidate = 86400;
export const alt = `Today's ${SITE.gameShort} deals below market on ${SITE.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export default function Image() {
  const t = SITE.theme;
  const rows = dealRows();
  const us = (shareDeals(rows.map((r) => ({ ...r, name: shortName(r.name) })), (source, market) => storeName({ source, market: market as never }), 5).US ?? []).slice(0, 5);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: t.pageDark, color: "#fff", padding: "44px 64px", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 28, color: t.brandLight, fontWeight: 700 }}>{SITE.name}</div>
        <div style={{ fontSize: 56, fontWeight: 800, marginTop: 8 }}>{`Today's deals below market`}</div>
        {us.length ? (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
            {us.map((d) => (
              <div key={d.slug} style={{ display: "flex", alignItems: "baseline", fontSize: 30, marginTop: 12 }}>
                <span style={{ width: 130, fontWeight: 800, color: "#4ade80" }}>{`-${Math.round(d.saving)}%`}</span>
                <span style={{ flex: 1, color: "#f8fafc" }}>{clip(d.name, 34)}</span>
                <span style={{ fontWeight: 700, color: "#fff" }}>{money(d.cents, d.currency)}</span>
                <span style={{ width: 230, marginLeft: 16, color: "#a9b4cc", fontSize: 24 }}>{clip(d.store, 18)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 34, color: "#cfd6e6", marginTop: 40 }}>{`In-stock ${SITE.gameShort} sealed product below TCGplayer market, updated daily.`}</div>
        )}
        <div style={{ display: "flex", marginTop: "auto", fontSize: 24, color: "#a9b4cc" }}>{`${rows.length >= 1200 ? "1,200+" : rows.length.toLocaleString("en-US")} in-stock listings below TCGplayer market · US stores shown · free, updated daily`}</div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}

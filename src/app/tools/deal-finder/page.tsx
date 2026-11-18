import type { Metadata } from "next";
import { SITE } from "@/site.config";
import { dealRows } from "@/lib/tools";
import { shortName } from "@/lib/names";
import { DealFinder } from "./DealFinder";
import { ShareButton } from "@/components/ShareButton";

export const revalidate = 86400; // data only changes with a release (DECISIONS.md, "Vercel cost")
export const metadata: Metadata = {
  title: `${SITE.gameShort} Deal Finder — cards selling below market`,
  description: `Every in-stock ${SITE.game} card and sealed product listed below its TCGplayer market price at stores and on eBay, in the US, UK, Canada, Australia and Europe. Free, updated daily.`,
  // No `images` key: the sibling opengraph-image.tsx is the preview (more shareable artefacts, 2026-11-18).
  alternates: { canonical: "/tools/deal-finder" },
  openGraph: { type: "website", siteName: SITE.name, url: "/tools/deal-finder" },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  const rows = dealRows().map((r) => ({ ...r, name: shortName(r.name) }));
  return (
    <div>
      <h1 className="page-h1">{SITE.gameShort} Deal Finder</h1>
      <ShareButton path="/tools/deal-finder" name={`${SITE.gameShort} Deal Finder`} medium="tool" text={`${rows.length} listings in stock below TCGplayer market today, on ${SITE.name}`} className="mt-3" />
      <p className="page-sub">{rows.length} in-stock listings 8–60% below TCGplayer market right now. Prices converted to US$ for the comparison; the store charges its own currency.</p>
      <DealFinder rows={rows} />
    </div>
  );
}

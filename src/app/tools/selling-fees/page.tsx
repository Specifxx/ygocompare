import type { Metadata } from "next";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { Fees } from "./Fees";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: `${SITE.gameShort} selling fee calculator — TCGplayer and eBay`,
  description: `How much you keep when you sell a ${SITE.game} card on TCGplayer or eBay, after fees. Free calculator.`,
  ...canon("/tools/selling-fees"),
  // Noindex, follow (page scorecard, 2026-11-23): a card-selling calculator on a sealed-only site, shown by Google only past
  // page 3 (position 45) and never clicked. It stays live for the tools list and the card-value guide; it is not in the sitemap.
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="max-w-3xl">
      <h1 className="page-h1">Selling fee calculator</h1>
      <p className="page-sub">Estimates for a US seller using standard rates. Your actual fees depend on your seller level, store category and promotions, so check the marketplace&apos;s own fee page before relying on them.</p>
      <Fees />
    </div>
  );
}

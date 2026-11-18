import { dealRows } from "@/lib/tools";
import { shortName } from "@/lib/names";
import { shareDeals, storeName } from "@/lib/share";

// The share button's thank-you (lib/share.ts, "Share-for-a-deal"): up to three of
// today's Deal Finder rows per market. Built with the deploy and served as a
// file: no function runs, nothing about the visitor is read.
export const dynamic = "force-static";

export function GET() {
  const deals = shareDeals(
    dealRows().map((r) => ({ ...r, name: shortName(r.name) })),
    (source, market) => storeName({ source, market: market as never }),
  );
  return new Response(JSON.stringify(deals), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, s-maxage=86400" } });
}

// The quick view's prices for one card or sealed product (components/QuickView.tsx):
// the offers the card page's table draws, plus the day's exchange rates and the
// sealed Amazon search. A function response kept by Vercel's CDN for six hours,
// like the pages (DECISIONS.md "Vercel cost"); the data only changes with a release.
import { NextResponse } from "next/server";
import { SITE } from "@/site.config";
import { meta, priceOf, productBySlug } from "@/lib/data";
import { amazonSearchUrl } from "@/lib/affiliate";
import { shortName } from "@/lib/names";

export const dynamic = "force-dynamic";

export function GET(_req: Request, { params }: { params: { slug: string } }) {
  const p = productBySlug(params.slug);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404, headers: { "Cache-Control": "public, s-maxage=21600" } });
  const amazon = p.kind === "sealed" ? amazonSearchUrl(`${SITE.game} ${shortName(p.name)}`) : null;
  return NextResponse.json(
    { id: p.id, offers: priceOf(p.id).offers, fx: meta()?.fx ?? { USD: 1 }, amazon },
    { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
  );
}

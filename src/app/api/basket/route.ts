// Best Basket: price a pasted list for one market.
import { NextResponse } from "next/server";
import { bestMatch, parseLine } from "@/lib/lookup";
import { priceBasket } from "@/lib/tools";
import { MARKETS, type Market } from "@/lib/site-types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { text, market } = (await req.json().catch(() => ({}))) as { text?: string; market?: string };
  const m: Market = MARKETS.includes(market as Market) ? (market as Market) : "US";
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .slice(0, 100)
    .map(parseLine)
    .filter((x): x is { qty: number; query: string } => !!x)
    .map((l) => ({ ...l, id: bestMatch(l.query)?.id ?? null }));
  return NextResponse.json(priceBasket(lines, m));
}

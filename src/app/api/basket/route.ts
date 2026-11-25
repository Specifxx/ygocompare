import { basketSummary, cleanLines, loadBasket } from "@/lib/basket-server";
import { PREMIUM_SERVICE } from "@/lib/premium-member";
import { MARKETS, type Market } from "@/lib/site-types";
import { SITE_URL } from "@/lib/site";

// POST /api/basket {market, lines: [{slug, qty}], token?}: Best Basket (lib/basket-server.ts, 2026-11-25). Everyone gets the
// delivered total and what splitting across stores saves; the store-by-store plan (which product from which store, each store's
// shipping, the one-store order) goes only to a Premium member, checked with RiftCompare's sister-premium status on every call, so
// the plan is withheld in the RESPONSE, never hidden in the browser. Per visitor, never cached.
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

/** Is this browser's token a Premium member right now? false on any doubt (the visitor still gets the totals). */
async function isPremium(token: unknown): Promise<boolean> {
  if (typeof token !== "string" || token.length > 4096 || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return false;
  try {
    const r = await fetch(`${PREMIUM_SERVICE}/api/sister-premium/status`, {
      method: "POST",
      // RiftCompare answers only this site's origin (exact-origin rule); the token itself is what it checks.
      headers: { "Content-Type": "application/json", Origin: new URL(SITE_URL).origin },
      body: JSON.stringify({ token }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; premium?: boolean };
    return r.ok && j.ok === true && j.premium === true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { market?: unknown; lines?: unknown; token?: unknown } | null;
  const market = MARKETS.find((m) => m === body?.market) as Market | undefined;
  if (!market) return Response.json({ error: "Unknown market" }, { status: 400, headers });
  const lines = cleanLines(body?.lines);
  if (!lines.length) return Response.json({ error: "Your list is empty" }, { status: 400, headers });
  const basket = loadBasket(lines, market);
  const premium = await isPremium(body?.token);
  const summary = basketSummary(basket);
  return Response.json(
    premium
      ? { premium: true, summary, products: basket.products, missing: basket.missing, plan: basket.result.plan, alternatives: basket.result.alternatives }
      : { premium: false, summary, products: basket.products, missing: basket.missing },
    { headers },
  );
}

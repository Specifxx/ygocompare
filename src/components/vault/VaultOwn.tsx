"use client";
// "I own this" on the card page (components/vault/VaultAddButton.tsx) in the visitor's market: the page is one cached
// copy for everyone, so the market is picked client-side like the rest of the page, and the price when added is that
// market's lowest in-stock store price (lib/alert-feed.ts lowestByMarket), the same number /prices.json values it at.
import { useMarket } from "@/components/ClientPrefs";
import { CURRENCY, type Market } from "@/lib/site-types";
import { VaultAddButton } from "./VaultAddButton";

export function VaultOwn({ id, name, href, image, prices, className }: { id: number; name: string; href: string; image: string | null; prices: Partial<Record<Market, number>>; className?: string }) {
  const { market } = useMarket();
  return <VaultAddButton key={market} id={String(id)} name={name} href={href} image={image} market={market} currency={CURRENCY[market]} addedCents={prices[market] ?? 0} className={className} />;
}

"use client";
// Amazon's price from the Creators API, with the time it was fetched and Amazon's disclaimer, as its licence requires. The
// page sits in the CDN for hours, so the browser checks the age again: past 24 hours the price gives way to the row's plain
// "See price" (the button still opens the listing) rather than a stale number.
import { useEffect, useState } from "react";

const MAX_AGE_MS = 24 * 3600_000;
export const AMAZON_PRICE_DISCLAIMER =
  "Product prices and availability are accurate as of the date/time indicated and are subject to change. Any price and availability information displayed on Amazon at the time of purchase will apply to the purchase of this product.";

export function AmazonPrice({ price, at, timeZone, zoneLabel, fallback = "See price" }: { price: string; at: string; timeZone: string; zoneLabel: string; fallback?: string }) {
  const [fresh, setFresh] = useState(true);
  useEffect(() => setFresh(Date.now() - Date.parse(at) < MAX_AGE_MS), [at]);
  if (!fresh) return <span className="text-xs text-muted">{fallback}</span>;
  const when = new Date(at).toLocaleString("en-GB", { timeZone, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  return (
    <span title={AMAZON_PRICE_DISCLAIMER}>
      <span className="font-semibold text-fg">{price}</span>
      <span className="block text-[10px] text-muted">as of {when} {zoneLabel}*</span>
    </span>
  );
}

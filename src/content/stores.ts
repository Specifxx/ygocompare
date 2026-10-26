// Every store here must be verified by a probe first (scripts/probe-stores.ts,
// run by .github/workflows/probe-stores.yml): its Shopify collection
// products.json returned English Yu-Gi-Oh! TCG singles or sealed, in the
// market's currency. Add a store only after the same check — a wrong
// collection handle fails silently.
import type { StoreConfig } from "@/lib/site-types";

export const STORES: StoreConfig[] = [];

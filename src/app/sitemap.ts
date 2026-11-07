import type { MetadataRoute } from "next";
import { meta, products, refCents, setById, summaryOf } from "@/lib/data";
import { posts } from "@/lib/posts";
import { preorderSetList, sealedHubs, sealedSets } from "@/lib/hubs";
import { preorderPath } from "@/lib/preorders";
import { SITE_URL } from "@/lib/site";
import { creatorsOn } from "@/lib/creators";
import { cardIndexable } from "@/lib/indexing";

export const revalidate = 86400;

// Sealed only (owner, 2026-11-06): the sitemap lists the strong pages and nothing else. The home page, the sealed
// hubs, every set that has sealed product, the pre-order pages, the guides and the few pages people search for, and
// each sealed product page that asks to be indexed (a reference price or a listing, or an upcoming set; never a pack
// insert: lib/indexing.ts). No card URL, no card hub and no retired tool: those 301 (next.config.js,
// lib/card-redirects.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  const at = meta()?.updatedAt ? new Date(meta()!.updatedAt) : new Date();
  const fixed = ["", "/sealed", "/sets", "/preorders", "/tools/deal-finder", "/price-report", "/black-friday", "/cyber-monday", "/boxing-day", "/january-sales", "/lunar-new-year", "/daily", "/blog", "/stores", "/about", "/methodology", "/list-your-store", ...(creatorsOn() ? ["/creators"] : [])];
  return [
    ...fixed.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: at, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.8 })),
    ...sealedHubs().map((h) => ({ url: `${SITE_URL}/sealed/${h.slug}`, lastModified: at, changeFrequency: "daily" as const, priority: 0.8 })),
    ...preorderSetList().map((s) => ({ url: `${SITE_URL}${preorderPath(s)}`, lastModified: at, changeFrequency: "daily" as const, priority: 0.8 })),
    ...sealedSets().map((s) => ({ url: `${SITE_URL}/sets/${s.slug}`, lastModified: at, priority: 0.7 })),
    ...posts().map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(p.updated ?? p.date), priority: 0.6 })),
    ...products()
      .filter((p) => p.kind === "sealed" && cardIndexable(p, refCents(p.id), summaryOf(p.id).listedSources, setById(p.setId)))
      .map((p) => ({ url: `${SITE_URL}/card/${p.slug}`, lastModified: at, priority: 0.6 })),
  ];
}

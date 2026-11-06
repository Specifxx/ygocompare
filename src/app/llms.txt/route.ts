import { sealedSets } from "@/lib/hubs";
import { SITE } from "@/site.config";
import { SITE_URL } from "@/lib/site";
import { sets } from "@/lib/data";
import { posts } from "@/lib/posts";
import { TOOLS } from "@/lib/tool-list";

// /llms.txt (llmstxt.org): a plain map of the site for AI answer engines, as on
// Rift Compare, so "where do I compare <game> card prices" can be answered with
// a link here. Built from the same data as the pages; no claims typed by hand.
export const revalidate = 86400;

export function GET() {
  const md = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.name} is a free ${SITE.game} price comparison site. It compares every ${SITE.gameShort} booster box, pack, tin, structure deck and collection (sealed product only, no single cards) across TCGplayer, eBay, Amazon and ${SITE.stores.length} online stores, cheapest in-stock first, and updates prices daily. No account needed.`,
    "",
    "## Main pages",
    `- [Booster box and sealed prices](${SITE_URL}/sealed)`,
    `- [Sets in order](${SITE_URL}/sets): every set's booster boxes and sealed with prices`,
    `- [Price movers](${SITE_URL}/movers): biggest risers and fallers this week`,
    `- [Pre-orders](${SITE_URL}/preorders)`,
    `- [Stores compared](${SITE_URL}/stores)`,
    `- [How prices work](${SITE_URL}/methodology)`,
    "",
    "## Sets",
    ...sealedSets().slice(0, 40).map((s) => `- [${s.name} booster box and sealed prices](${SITE_URL}/sets/${s.slug})`),
    "",
    "## Tools",
    ...TOOLS.map((t) => `- [${t.name}](${SITE_URL}${t.href}): ${t.text}`),
    "",
    "## Guides",
    ...posts().map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.description}`),
    "",
  ].join("\n");
  return new Response(md, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" } });
}

// Runs in GitHub Actions every three hours (ops-monitor.yml). Each check
// returns ok / warn / fail; anything not ok is emailed to the owner in one
// GitHub sends the owner a failed-workflow email. Add a check here for every new scheduled job, API or limit.
import fs from "node:fs";
import path from "node:path";
import { SITE } from "@/site.config";
import type { Meta } from "@/lib/site-types";
import { SITE_HOST } from "@/lib/site";

type Result = { name: string; status: "ok" | "warn" | "fail"; detail: string };
const site = (process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_HOST}`).replace(/\/$/, "");
// Until the site is live (the SITE_URL repository variable is set at launch),
// the live checks warn instead of failing every three hours.
const live = !!process.env.NEXT_PUBLIC_SITE_URL;

async function check(name: string, fn: () => Promise<Omit<Result, "name">>): Promise<Result> {
  try {
    return { name, ...(await fn()) };
  } catch (e) {
    return { name, status: "fail", detail: (e as Error).message };
  }
}

async function main() {
  const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/public/meta.json"), "utf8")) as Meta;
  const ageH = (Date.now() - new Date(meta.updatedAt).getTime()) / 3_600_000;
  const results = await Promise.all([
    check("Live site", async () => {
      if (!live) return { status: "warn", detail: "SITE_URL repository variable not set — live checks skipped" };
      const r = await fetch(site, { signal: AbortSignal.timeout(20000) });
      return r.ok ? { status: "ok", detail: `${r.status}` } : { status: "fail", detail: `HTTP ${r.status}` };
    }),
    check("A card page", async () => {
      if (!live) return { status: "warn", detail: "SITE_URL repository variable not set — live checks skipped" };
      const r = await fetch(`${site}/cards`, { signal: AbortSignal.timeout(20000) });
      return r.ok ? { status: "ok", detail: `${r.status}` } : { status: "fail", detail: `HTTP ${r.status}` };
    }),
    check("Daily price import", async () =>
      ageH < 30 ? { status: "ok", detail: `${ageH.toFixed(1)}h old` } : { status: ageH < 54 ? "warn" : "fail", detail: `data is ${ageH.toFixed(0)}h old — check the Refresh prices workflow` },
    ),
    check("Store imports", async () => {
      const bad = Object.entries(meta.stores).filter(([, s]) => !s.ok || s.matched === 0);
      return bad.length ? { status: bad.length > SITE.stores.length / 3 ? "fail" : "warn", detail: bad.map(([k, s]) => `${k}: ${s.error ?? "0 matched"}`).join("; ") } : { status: "ok", detail: `${SITE.stores.length} stores` };
    }),
    check("eBay budget", async () => {
      if (!process.env.EBAY_CLIENT_ID) return { status: "warn", detail: "EBAY_CLIENT_ID not set in GitHub secrets — no eBay prices" };
      if (!meta.ebay) return { status: "warn", detail: "no eBay run recorded yet" };
      const age = (Date.now() - new Date(meta.ebay.at).getTime()) / 3_600_000;
      if (age > 30) return { status: "warn", detail: `last eBay run ${age.toFixed(0)}h ago` };
      return { status: "ok", detail: `${meta.ebay.calls}/${meta.ebay.budget} calls on ${meta.ebay.day}, ${meta.ebay.eligible} eligible` };
    }),
  ]);
  for (const r of results) console.log(`${r.status.toUpperCase().padEnd(4)} ${r.name}: ${r.detail}`);
  const bad = results.filter((r) => r.status === "fail" || (r.status === "warn" && !/not set/.test(r.detail)));
  if (bad.length) {
    // A failed run makes GitHub email the repo owner (no email service needed).
    console.error(`
${bad.length} check(s) need a look: ${bad.map((r) => r.name).join(", ")}`);
    process.exit(1);
  }
}
main();

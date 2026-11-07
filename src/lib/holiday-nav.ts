// The nav link for the Black Friday / Cyber Monday page while its strip shows (lib/black-friday.ts saleStrip).
// Server-side only: it reads the data files' date.
import { meta } from "@/lib/data";
import { saleStrip } from "@/lib/black-friday";
import type { NavLink } from "@/lib/nav";

export function holidayNav(): NavLink | null {
  const s = saleStrip((meta()?.updatedAt ?? new Date().toISOString()).slice(0, 10));
  return s ? { href: s.href, label: s.name } : null;
}

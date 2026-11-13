// The release on pre-order right now, once: the strip under the header (components/PreorderStrip.tsx), the header's Deals menu
// (lib/nav.ts `preorder`) and the home page's pill all name the same set. Server-side only: it reads the data files.
import { products } from "@/lib/data";
import { preorderSetList, sealedInSet } from "@/lib/hubs";
import { isPreorder, preorderPath, todayIso } from "@/lib/preorders";
import type { NavLink } from "@/lib/nav";
import type { SetInfo } from "@/lib/site-types";

let memo: { at: unknown; day: string; set: SetInfo | null } | null = null;

/** The soonest set still on pre-order. "Pre-orders are open" must be true: a set listed before any store (written copy, lib/preorders.ts) waits for its first listing. */
export function openPreorder(): SetInfo | null {
  const at = products();
  const day = todayIso();
  if (memo && memo.at === at && memo.day === day) return memo.set;
  const set = preorderSetList().find((s) => isPreorder(s) && sealedInSet(s.id).length > 0) ?? null;
  memo = { at, day, set };
  return set;
}

/** Its landing page as a nav link ("<set> pre-orders"), or null when nothing is on pre-order. */
export function preorderNav(): NavLink | null {
  const s = openPreorder();
  return s ? { href: preorderPath(s), label: `${s.name} pre-orders` } : null;
}

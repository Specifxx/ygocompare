import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { meta } from "@/lib/data";
import { saleStrip } from "@/lib/black-friday";

// One line under the header on every page from 1 November to the day after Cyber Monday, linking the
// Black Friday page, then the Cyber Monday page (lib/black-friday.ts saleStrip; DECISIONS.md, "Black
// Friday strip", 2026-11-07). A plain link in the server HTML: never a pop-up, a countdown or "ends soon".
export function HolidayStrip() {
  const s = saleStrip((meta()?.updatedAt ?? new Date().toISOString()).slice(0, 10));
  if (!s) return null;
  return (
    <div className="border-b border-line bg-brand-soft" data-holiday-strip={s.event}>
      <p className="truncate py-1.5 page text-center text-xs sm:text-sm">
        <Link href={s.href} className="hover:text-fg">
          <b>{s.name} {SITE.gameShort} deals</b> · today&apos;s store prices under TCGplayer, updated daily · <span className="link">see the deals →</span>
        </Link>
      </p>
    </div>
  );
}

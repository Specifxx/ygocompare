import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { meta } from "@/lib/data";
import { saleStrip } from "@/lib/black-friday";
import { StripClose } from "./StripClose";
import { BfModeBar } from "@/components/BfModeBar";
import { goHref } from "@/lib/affiliate";
import { bfModeOn } from "@/lib/bf-mode";

// One line under the header on every page from 1 November to the day after Cyber Monday, linking the
// Black Friday page, then the Cyber Monday page (lib/black-friday.ts saleStrip; DECISIONS.md, "Black
// Friday strip", 2026-11-07). A plain link in the server HTML: never a pop-up, a countdown or "ends soon".
// For Black Friday itself (lib/bf-mode.ts, owner 2026-11-27) the line becomes the bold Black Friday bar, which falls back to it.
export function HolidayStrip() {
  const s = saleStrip((meta()?.updatedAt ?? new Date().toISOString()).slice(0, 10));
  const strip = s ? (
    <div className="relative border-b border-line bg-brand-soft" data-holiday-strip={s.event}>
      <p className="truncate py-1.5 pr-10 page text-center text-xs sm:text-sm">
        <Link href={s.href} className="hover:text-fg">
          <b>{s.name} {SITE.gameShort} deals</b><span className="hidden sm:inline"> · today&apos;s store prices under TCGplayer, updated daily</span> · <span className="link">see the deals →</span>
        </Link>
      </p>
      <StripClose id={s.event} />
    </div>
  ) : null;
  const on = bfModeOn(Date.now());
  if (!on) return strip;
  return (
    <BfModeBar
      on={on}
      href="/black-friday"
      title={`${SITE.gameShort} sealed deals`}
      line="store prices under TCGplayer today"
      ad={
        <a
          href={goHref({ url: `https://www.tcgplayer.com/search/${SITE.tcgplayerSlug}/product?productLineName=${SITE.tcgplayerSlug}&ProductTypeName=Sealed+Products`, source: "tcgplayer", market: "US" }, undefined, "bf_mode")}
          rel="sponsored nofollow noopener"
          className="underline underline-offset-2"
        >
          <span style={{ color: "#fff" }}>TCGplayer sale: 10% store credit on everything</span> · Ad
        </a>
      }
    >
      {strip}
    </BfModeBar>
  );
}


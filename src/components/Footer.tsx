import Link from "@/components/Link";
import { RateUsLink } from "./site-reviews/SiteReviews";
import { SITE } from "@/site.config";
import { creatorsOn } from "@/lib/creators";
import { historyOn } from "@/lib/data";
import { LogoMark } from "./Logo";

type FooterLink = { href: string; label: string };

/** The footer's link columns (the same links as before the engine port, so every crawled link set is unchanged). */
export function footerColumns(history: boolean): { title: string; links: FooterLink[] }[] {
  return [
    {
      title: "Prices",
      links: [
        { href: "/sealed", label: "Sealed prices" },
        { href: "/sealed/booster-box", label: "Booster box prices" },
        { href: "/sets", label: "Sets" },
        ...(SITE.kits ? [{ href: "/kits", label: `${SITE.kits.label} prices` }] : []),
        ...(history ? [{ href: "/movers", label: "Price movers" }, { href: "/price-report", label: "Monthly price report" }] : []),
        { href: "/black-friday", label: "Black Friday deals" },
        { href: "/cyber-monday", label: "Cyber Monday deals" },
        { href: "/boxing-day", label: "Boxing Day deals" },
        { href: "/january-sales", label: "January sales" },
        { href: "/lunar-new-year", label: "Lunar New Year deals" },
        { href: "/embed", label: "Free price widgets" },
        { href: "/tools/deal-finder", label: "Deal Finder" },
        { href: "/preorders", label: "Pre-orders" },
      ],
    },
    {
      title: SITE.name,
      links: [
        { href: "/about", label: "About" },
        { href: "/methodology", label: "How prices work" },
        { href: "/stores", label: "Stores we track" },
        { href: "/blog", label: "Guides" },
        { href: "/forum", label: "Community forum · beta" },
        ...(creatorsOn() ? [{ href: "/creators", label: "Creators" }] : []),
        { href: "/contact", label: "Contact" },
        { href: "/list-your-store", label: "List your store" },
        { href: "/how-we-pick-stores", label: "How we pick stores" },
        { href: "/privacy", label: "Privacy" },
        { href: "/terms", label: "Terms" },
      ],
    },
  ];
}

/**
 * The engine's footer (from MTG Compare): a brand column (mark, one line on what the site is, the money and contact lines), then
 * the link columns, the other card sites (brand names only, owner 2026-11-03) and the one Compare Empire network link, then the
 * disclaimers. Same links as the old footer.
 */
export function Footer() {
  const cols = footerColumns(historyOn());
  const year = new Date().getUTCFullYear();
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="page grid gap-x-6 gap-y-10 py-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,3fr)]">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 font-display text-lg font-extrabold tracking-tight">
            <LogoMark className="h-7 w-7" />
            <span>
              <span className="wordmark">{SITE.wordmark[0]}</span> {SITE.wordmark[1]}
            </span>
          </Link>
          <p className="mt-3 text-sm leading-6 text-muted">{SITE.tagline}. Free, no account needed.</p>
          <p className="mt-4 text-xs leading-5 text-muted">
            eBay, TCGplayer and Amazon links are affiliate links and are marked where they appear.
            <br />
            No store pays to be listed or to rank.{" "}
            <Link href="/methodology" className="whitespace-nowrap font-semibold text-ink underline decoration-line underline-offset-2 hover:decoration-ink">
              How prices work&nbsp;→
            </Link>
          </p>
          <p className="mt-3 text-xs text-muted">
            <Link href="/contact" className="font-semibold text-ink underline decoration-line underline-offset-2 hover:decoration-ink">
              Contact us
            </Link>
            :{" "}
            <a href={`mailto:${SITE.supportEmail}`} className="underline decoration-line underline-offset-2 hover:decoration-ink">
              {SITE.supportEmail}
            </a>
          </p>
          <p className="mt-3 text-xs text-muted">
            <RateUsLink className="font-semibold text-ink underline decoration-line underline-offset-2 hover:decoration-ink">Rate us</RateUsLink>
            {" · "}
            {/* One link to the page that lists our other sites (2026-11-08): the other card sites named on every page were
                thousands of site-wide links between our own sites, the pattern Google's link-spam policy warns about. */}
            <Link href="/our-sites" className="underline decoration-line underline-offset-2 hover:decoration-ink">
              Our other price comparison sites →
            </Link>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          {cols.map((c) => (
            <nav key={c.title} aria-label={`Footer: ${c.title}`}>
              <p className="eyebrow mb-2">{c.title}</p>
              <ul className="text-sm">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="flex min-h-10 items-center text-muted transition-colors hover:text-ink sm:min-h-8">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="page space-y-2 py-6 text-xs leading-5 text-faint">
          <p>
            {SITE.name} is an independent price comparison site, not affiliated with or endorsed by the publisher of {SITE.game}{SITE.kits ? ` or by ${SITE.kits.maker}` : ""}. As an eBay Partner and TCGplayer affiliate we may earn a commission from qualifying purchases made through links on this site, at no cost to you.{SITE.disclaimer ? ` ${SITE.disclaimer}` : ""} As an Amazon Associate we earn from qualifying purchases. Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates. Prices change often; the store&apos;s checkout price is final.
          </p>
          <p>© {year} {SITE.name}</p>
        </div>
      </div>
    </footer>
  );
}

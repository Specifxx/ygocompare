import Link from "@/components/Link";
import type { CSSProperties, ReactNode } from "react";

// The home page's hero (owner, 2026-11-13: "get rid of the products on the hero … minimalistic, dynamic, aesthetic and smooth
// without having everything there"). Words, the search and a few ways in, centred, on a ground of two slow glows and a dot grid
// (globals.css .hero-bg: gradients only, no canvas, no image). Never a product card, a badge for a feature or a second banner: at
// most one small pill above the headline. Server components: no script of their own.

/** Each part's place in the entrance (globals.css .rise: 70ms apart). */
export const riseAt = (i: number) => ({ "--i": i }) as CSSProperties;

export function Hero({ children }: { children: ReactNode }) {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-in">{children}</div>
    </section>
  );
}

/** The one small line above the headline: the single most timely link (a set on pre-order), else a plain label. */
export function HeroPill({ href, children }: { href?: string; children: ReactNode }) {
  return href ? (
    <Link href={href} className="hero-pill rise">
      <span className="hero-pill-dot" aria-hidden="true" />
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  ) : (
    <p className="hero-pill rise">{children}</p>
  );
}

// The tiles' shapes, drawn like Icon.tsx's (24×24, round strokes, currentColor). Functions, so no JSX runs when the module loads.
const SHAPES = {
  box: () => (
    <>
      <path d="M21 7.5 12 3 3 7.5v9L12 21l9-4.5z" />
      <path d="m3 7.5 9 4.5 9-4.5M12 12v9" />
    </>
  ),
  tin: () => (
    <>
      <path d="M5 6.5C5 5.1 8.1 4 12 4s7 1.1 7 2.5v11c0 1.4-3.1 2.5-7 2.5s-7-1.1-7-2.5z" />
      <path d="M5 6.5C5 7.9 8.1 9 12 9s7-1.1 7-2.5" />
    </>
  ),
  deck: () => (
    <>
      <rect x="8" y="3.5" width="11" height="14.5" rx="1.5" />
      <path d="M8 7H6.5A1.5 1.5 0 0 0 5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h8A1.5 1.5 0 0 0 16 19v-1" />
    </>
  ),
  gift: () => (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M3 5h18v4H3zM12 5v15" />
    </>
  ),
  pack: () => (
    <>
      <rect x="8" y="4" width="8" height="16" rx="1" />
      <path d="M5 6v12M19 6v12" />
    </>
  ),
  tag: () => (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  sets: () => (
    <>
      <path d="m12 3 9 4.5-9 4.5-9-4.5z" />
      <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
    </>
  ),
  calendar: () => (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  grid: () => (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
} satisfies Record<string, () => ReactNode>;
export type WayShape = keyof typeof SHAPES;

export interface Way {
  href: string;
  label: string;
  icon: WayShape;
}

/**
 * The ways in: the few pages most visitors want next, as big quiet tiles (six at most: a row on a desktop, two columns on a phone).
 * Plain links in the server's HTML, never products.
 */
export function WaysIn({ links, label }: { links: Way[]; label: string }) {
  return (
    <ul className="ways rise" style={riseAt(4)} aria-label={label}>
      {links.map((l) => (
        <li key={l.href} className="flex">
          <Link href={l.href} className="way flex-1">
            <span className="way-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" focusable="false">
                {SHAPES[l.icon]()}
              </svg>
            </span>
            <span className="min-w-0">{l.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

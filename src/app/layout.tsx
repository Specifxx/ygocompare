import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import "@/components/site-reviews/site-reviews.css";
// The site's own look on top of the shared one (src/content/site.css; empty on a site that needs none).
import "@/content/site.css";
import { SITE } from "@/site.config";
import { SITE_URL } from "@/lib/site";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import { SEASON_BOOT_SCRIPT } from "@/lib/season";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PreorderStrip } from "@/components/PreorderStrip";
import { PrefsProvider } from "@/components/ClientPrefs";
import { QuickView } from "@/components/QuickView";
import { RateCard } from "@/components/site-reviews/RateCard";
import { BuyClickTracker } from "@/components/BuyClickTracker";
import { ShareArrival } from "@/components/ShareArrival";
import { SideNav } from "@/components/SideNav";
import { SideAds } from "@/components/SideAds";
import { navGroups } from "@/lib/nav";
import { historyOn } from "@/lib/data";
import { adSearch, cardAds } from "@/lib/card-ads";

// The engine's two faces (DexCompare and MTG Compare: Bricolage Grotesque for headings, Inter for text), bundled as the latin
// subsets of the variable fonts (OFL, src/app/fonts): no font request at build or at runtime. Display is optional, not swap:
// both faces are preloaded, so a warm visit renders in them from the first paint, and a slow first visit keeps the size-adjusted
// fallback for that page instead of re-wrapping every line when the font lands (MTG Compare measured CLS 0.209 with swap).
const display = localFont({
  src: [{ path: "./fonts/BricolageGrotesque-latin.woff2", weight: "600 800" }],
  variable: "--font-display",
  display: "optional",
});
const sans = localFont({
  src: [{ path: "./fonts/Inter-latin.woff2", weight: "100 900" }],
  variable: "--font-sans",
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  keywords: SITE.keywords,
  applicationName: SITE.name,
  openGraph: { type: "website", siteName: SITE.name, url: "/" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
  // Large image previews and full snippets in Google (Search, Discover, Images), as RiftCompare does.
  // A page that sets its own `robots` (noindex) replaces this whole object.
  robots: { googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
};

// Dark by default (lib/theme.ts); the browser bar follows the default, not a saved light choice.
export const viewport: Viewport = { themeColor: "#0f1013", colorScheme: "dark light" };

const ADSENSE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const history = historyOn();
  return (
    // The boot scripts stamp data-theme and data-season on this element before React hydrates; React must not report that.
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT + SEASON_BOOT_SCRIPT }} />
        <link rel="preconnect" href="https://tcgplayer-cdn.tcgplayer.com" />
        {/* Impact's verifier reads the tag exactly as it issues it: `value`, not `content`. */}
        {SITE.impactSiteVerification && <meta name="impact-site-verification" {...{ value: SITE.impactSiteVerification }} />}
        {ADSENSE && <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}`} crossOrigin="anonymous" />}
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">
          Skip to content
        </a>
        <PrefsProvider>
          <Header />
          <PreorderStrip />
          {/* The engine's shell: from xl the sidebar sits in the flow beside <main>, both inside the 1480px shell. */}
          <div className="mx-auto flex w-full max-w-shell flex-1">
            <SideNav groups={navGroups({ history })} />
            <main id="main" className="min-w-0 flex-1">
              <div className="page py-6">{children}</div>
            </main>
          </div>
          <Footer />
          <QuickView />
          {/* Rate us (owner, 2026-11-03): the corner card, asking only after real use; RiftCompare keeps the ratings. */}
          <RateCard />
          {/* The two side rails on a wide screen (eBay left, TCGplayer right), outside the shell; nothing below 1864px. */}
          <SideAds ads={cardAds({ limit: 6 })} search={adSearch()} />
        </PrefsProvider>
        <Analytics />
        <BuyClickTracker />
        <ShareArrival />
      </body>
    </html>
  );
}

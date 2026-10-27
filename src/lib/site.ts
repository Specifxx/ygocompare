import { SITE } from "@/site.config";

export const SITE_HOST = SITE.apexHost ? SITE.domain : `www.${SITE.domain}`;
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_HOST}`).replace(/\/$/, "");
export const abs = (p: string) => `${SITE_URL}${p.startsWith("/") ? p : `/${p}`}`;

/** The site's share image (src/app/opengraph-image.jpg). A page that sets
 *  its own `openGraph` loses the root file's og:image, so every page names it
 *  again: without it Reddit, Discord and iMessage show no thumbnail. */
export const SHARE_IMAGE = { url: "/opengraph-image.jpg", width: 2400, height: 1260, alt: `${SITE.name}: compare ${SITE.gameShort} card and booster box prices across stores` };

/** Self-canonical plus a matching og:url (the layout sets no og:url, so a
 *  page without this would share the homepage's) and the share image. */
export const canon = (path: string) => ({
  alternates: { canonical: path },
  openGraph: { type: "website" as const, siteName: SITE.name, url: path, images: [SHARE_IMAGE] },
  twitter: { card: "summary_large_image" as const, images: [SHARE_IMAGE] },
});

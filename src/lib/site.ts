import { SITE } from "@/site.config";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || `https://www.${SITE.domain}`).replace(/\/$/, "");
export const abs = (p: string) => `${SITE_URL}${p.startsWith("/") ? p : `/${p}`}`;

/** Self-canonical plus a matching og:url (the layout sets no og:url, so a
 *  page without this would share the homepage's). */
export const canon = (path: string) => ({
  alternates: { canonical: path },
  openGraph: { type: "website" as const, siteName: SITE.name, url: path },
});

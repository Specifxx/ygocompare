import type { Metadata } from "next";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { StaticPage } from "@/components/StaticPage";
import { FAMILY_SITES, NETWORK_PAGE } from "@/lib/family-network";

// The one page that links the owner's other sites (2026-11-08, DECISIONS.md "Our sites"). The footer used to name the other
// card sites on every page: thousands of site-wide links between our own sites, the pattern Google's link-spam policy warns
// about, with no authority in it. Now every footer links here once, and this page links each site once, by its plain name.
export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Our other sites",
  description: `${SITE.name} is one of the Compare Empire price comparison sites. The others compare card games, hobby and tech prices the same way.`,
  ...canon("/our-sites"),
};

export default function OurSites() {
  const sites = FAMILY_SITES.filter((s) => s.id !== SITE.family.id);
  return (
    <StaticPage title="Our other sites">
      <p>{SITE.name} is one of the Compare Empire sites: independent price comparison, the same rules on every site, no paid ranking.</p>
      <ul>
        {sites.map((s) => (
          <li key={s.id}>
            <a href={s.url} rel="noopener">{s.name}</a>: {s.label}
          </li>
        ))}
      </ul>
      <p><a href={NETWORK_PAGE} rel="noopener">Every Compare Empire site →</a></p>
    </StaticPage>
  );
}

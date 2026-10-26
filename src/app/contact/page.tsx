import type { Metadata } from "next";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { StaticPage } from "@/components/StaticPage";

export const revalidate = 86400;
export const metadata: Metadata = { title: "Contact", description: `Contact ${SITE.name}, report a price or list your store.`, ...canon("/contact") };

export default function Contact() {
  return (
    <StaticPage title="Contact us">
      <p>Wrong price, missing card, or a store that should be listed? Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> and we&apos;ll take a look.</p>
      <p>Store owners: listing is free. Send your store&apos;s address and we&apos;ll add it to the comparison.</p>
    </StaticPage>
  );
}

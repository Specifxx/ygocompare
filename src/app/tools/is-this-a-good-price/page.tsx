import type { Metadata } from "next";
import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { LinkChecker } from "@/components/LinkChecker";

// "Is this a good price?" (2026-11-08): paste a store link, see how its price compares with every store we read. The copy and FAQ
// are in the server HTML; the checker is a client island that asks /api/check/<host> (CDN-cached). No data read at render.
export const revalidate = 86400;

const things = SITE.sealedOnly ? "booster box, tin or deck" : "card or booster box";

export const metadata: Metadata = {
  title: `Is this a good price? ${SITE.gameShort} price checker`,
  description: `Paste a store's link to a ${SITE.game} ${things} and see if it's a good price against every store ${SITE.name} compares. Free, no account.`,
  ...canon("/tools/is-this-a-good-price"),
};

const STEPS = [
  "Copy the address of the store's product page (in a phone browser: Share, then Copy).",
  "Paste it into the box. The checker looks it up straight away.",
  "Read the verdict and the cheapest and median in-stock prices beside it.",
  "If the page shows a different price now, type it to check again.",
];

const FAQ = [
  { q: "Which links does it work with?", a: `Product pages at any store ${SITE.name} reads, in any country we cover: it compares the price with the other stores in that store's country. For eBay, Amazon and stores we don't read, it finds the product from the link's words and links its price table.` },
  { q: "Do you open the page I paste?", a: "No. The checker only reads the store's address and the product's part of the link, then looks it up in the listings we already read from that store every day." },
  { q: "Why is the store's price different from the page?", a: "We read each store once a day, so a price can change in between. Type the price the page shows now and the verdict updates." },
  { q: "What counts as a good price?", a: "The cheapest in-stock store price we found, or within 1% of it. Under the median (the middle in-stock store price) is fair; about the median is typical; above it, you can usually pay less elsewhere. eBay and TCGplayer are not counted as stores here." },
  { q: "Does it include shipping?", a: "No. Every price is the store's own item price before shipping, the way the rest of the site compares them. Check postage at checkout." },
];

export default function Page() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div className="max-w-3xl">
      <h1 className="page-h1">Is this a good price?</h1>
      <p className="mt-2 text-muted">
        Paste the link to a {SITE.game} {things} at any store and see how its price compares with the cheapest and the typical in-stock price at every other store we read.
      </p>
      <LinkChecker />

      <h2 className="mt-10 font-display text-2xl font-bold tracking-tight">How to use it</h2>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-muted">
        {STEPS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>

      <h2 className="mt-10 font-display text-2xl font-bold tracking-tight">Questions</h2>
      <dl className="mt-3 space-y-4">
        {FAQ.map((f) => (
          <div key={f.q}>
            <dt className="font-semibold">{f.q}</dt>
            <dd className="mt-1 text-muted">{f.a}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-sm text-muted">
        More free tools: <Link href="/tools/deal-finder" className="link">Deal Finder</Link> and <Link href="/tools" className="link">every tool</Link>.
      </p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </div>
  );
}

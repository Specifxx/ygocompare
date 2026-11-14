import type { Metadata } from "next";
import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { posts } from "@/lib/posts";
import { shortDate } from "@/lib/format";
import { PageHead } from "@/components/Section";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: `${SITE.gameShort} guides and price analysis`,
  description: `Guides to buying ${SITE.game} cards: set price guides, most valuable cards, where to buy and pre-order advice.`,
  ...canon("/blog"),
};

/**
 * The guides, as one quiet list in the home page's voice (2026-11-14): the date, the title, one line; the post's own picture beside
 * it from sm up (on a phone it takes a whole screen per post, so it waits for the post itself). Every title and line stays a link.
 */
export default function Blog() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHead title={`${SITE.gameShort} guides`} sub="Buying guides, release dates and price checks, newest first." />
      <ul className="mt-8 border-t border-line">
        {posts().map((p) => (
          <li key={p.slug} className="group relative flex gap-5 border-b border-line py-6">
            <div className="min-w-0 flex-1">
              <p className="eyebrow tabular-nums">{shortDate(p.updated ?? p.date)}</p>
              <p className="mt-1.5 font-display text-lg font-bold leading-snug tracking-tight sm:text-xl">
                <Link href={`/blog/${p.slug}`} className="transition-colors after:absolute after:inset-0 group-hover:text-brand">{p.title}</Link>
              </p>
              <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">{p.description}</p>
            </div>
            {p.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image.src} alt={p.image.alt} width={1200} height={630} loading="lazy" decoding="async" className="hidden aspect-[1200/630] w-48 shrink-0 self-start rounded-xl border border-line object-cover transition-transform duration-200 group-hover:-translate-y-0.5 sm:block" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { SITE } from "@/site.config";
import { morePosts, postBySlug, posts } from "@/lib/posts";
import { TOOLS } from "@/lib/tool-list";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { AdSlot } from "@/components/AdSlot";
import { abs } from "@/lib/site";
import { renderPost } from "@/lib/post-render";
import { shortDate } from "@/lib/format";
import { PageHead } from "@/components/Section";

export const revalidate = 86400;
// Blog posts are code, not database rows: prerendering them costs nothing.
export const generateStaticParams = () => posts().map((p) => ({ slug: p.slug }));

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = postBySlug(params.slug);
  if (!p) return {};
  const image = p.image?.src ?? "/opengraph-image.jpg";
  return { title: p.title, description: p.description, keywords: p.keywords, alternates: { canonical: `/blog/${p.slug}` }, openGraph: { type: "article", siteName: SITE.name, url: `/blog/${p.slug}`, title: p.title, description: p.description, publishedTime: p.date, images: [{ url: image, width: 1200, height: 630, alt: p.image?.alt ?? p.title }] }, twitter: { card: "summary_large_image", images: [image] } };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const p = postBySlug(params.slug);
  if (!p) notFound();
  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.description, datePublished: p.date, dateModified: p.updated ?? p.date, image: abs(p.image?.src ?? "/opengraph-image.jpg"), author: { "@type": "Organization", name: SITE.name, url: abs("/about") }, publisher: { "@type": "Organization", name: SITE.name, url: abs("/"), logo: { "@type": "ImageObject", url: abs("/icon.svg") } }, mainEntityOfPage: abs(`/blog/${p.slug}`) }} />
      {p.faq && <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />}
      <Breadcrumbs items={[{ name: "Guides", href: "/blog" }, { name: p.title }]} />
      <PageHead eyebrow={p.updated ? `Updated ${shortDate(p.updated)}` : shortDate(p.date)} title={p.title} sub={p.description} size="article" />
      {p.image && (
        // The post's own thumbnail, a static file in public/blog: no optimiser, no function.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image.src} alt={p.image.alt} width={1200} height={630} className="mt-8 aspect-[1200/630] w-full rounded-2xl border border-line object-cover" />
      )}
      <div className="prose-site mt-8" dangerouslySetInnerHTML={{ __html: renderPost(p.html) }} />
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE} className="my-6" />
      {p.faq && (
        <section className="mt-12 max-w-[68ch]">
          <h2 className="mb-2 font-display text-xl font-bold tracking-tight sm:text-2xl">FAQ</h2>
          {/* The questions as rows that open, like the home page's (the answers stay in the HTML). */}
          {p.faq.map((f) => (
            <details key={f.q} className="faq">
              <summary><h3 className="text-[15px] font-semibold leading-6">{f.q}</h3></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      )}
      {/* Every article hands the reader on to more reading and a tool, as Rift Compare's do (its "Related tools" row). */}
      <nav className="mt-14 grid gap-8 border-t border-line pt-8 text-sm sm:grid-cols-2" aria-label="Read next">
        <div>
          <p className="eyebrow">More guides</p>
          <ul className="mt-3 flex flex-col">{morePosts(p.slug).map((x) => <li key={x.slug}><Link className="flex min-h-10 items-center py-1.5 font-medium leading-snug text-ink transition-colors hover:text-brand" href={`/blog/${x.slug}`}>{x.title}</Link></li>)}</ul>
        </div>
        <div>
          <p className="eyebrow">Free price tools</p>
          <ul className="mt-3 flex flex-col">{TOOLS.slice(0, 4).map((t) => <li key={t.href}><Link className="flex min-h-10 items-center py-1.5 font-medium leading-snug text-ink transition-colors hover:text-brand" href={t.href}>{t.name}</Link></li>)}</ul>
        </div>
      </nav>
      <aside className="mt-10 border-t border-line pt-6 text-sm">
        <p className="eyebrow">Also from us</p>
        <p className="mt-2 leading-7 text-muted">{SITE.sisterSites.map((s, i) => (<span key={s.url}>{i ? " · " : ""}<a className="link" href={s.url} rel="noopener">{s.anchor ?? s.name}</a> ({s.anchor ? s.name : s.game})</span>))}</p>
      </aside>
    </article>
  );
}

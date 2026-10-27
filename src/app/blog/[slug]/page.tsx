import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE } from "@/site.config";
import { postBySlug, posts } from "@/lib/posts";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { AdSlot } from "@/components/AdSlot";
import { abs } from "@/lib/site";
import { renderPost } from "@/lib/post-render";

export const revalidate = 86400;
// Blog posts are code, not database rows: prerendering them costs nothing.
export const generateStaticParams = () => posts().map((p) => ({ slug: p.slug }));

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = postBySlug(params.slug);
  if (!p) return {};
  return { title: p.title, description: p.description, keywords: p.keywords, alternates: { canonical: `/blog/${p.slug}` }, openGraph: { type: "article", siteName: SITE.name, url: `/blog/${p.slug}`, title: p.title, description: p.description, publishedTime: p.date, images: ["/opengraph-image.jpg"] }, twitter: { card: "summary_large_image", images: ["/opengraph-image.jpg"] } };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const p = postBySlug(params.slug);
  if (!p) notFound();
  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.description, datePublished: p.date, dateModified: p.updated ?? p.date, author: { "@type": "Organization", name: SITE.name }, publisher: { "@type": "Organization", name: SITE.name }, mainEntityOfPage: abs(`/blog/${p.slug}`) }} />
      {p.faq && <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />}
      <Breadcrumbs items={[{ name: "Guides", href: "/blog" }, { name: p.title }]} />
      <p className="text-xs text-muted">{p.updated ? `Updated ${p.updated}` : p.date}</p>
      <h1 className="mt-2 font-display text-3xl font-black md:text-4xl">{p.title}</h1>
      <p className="mt-3 text-lg text-muted">{p.description}</p>
      <div className="prose-site mt-6 overflow-x-auto" dangerouslySetInnerHTML={{ __html: renderPost(p.html) }} />
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE} className="my-6" />
      {p.faq && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold">FAQ</h2>
          {p.faq.map((f) => (<div key={f.q} className="border-b border-ink-800 py-3"><h3 className="font-medium">{f.q}</h3><p className="mt-1 text-sm text-muted">{f.a}</p></div>))}
        </section>
      )}
      <aside className="card-surface mt-10 p-5 text-sm">
        <p className="font-semibold">Also from us</p>
        <p className="mt-1 text-muted">{SITE.sisterSites.map((s, i) => (<span key={s.url}>{i ? " · " : ""}<a className="link" href={s.url} rel="noopener">{s.anchor ?? s.name}</a> ({s.anchor ? s.name : s.game})</span>))}</p>
      </aside>
    </article>
  );
}

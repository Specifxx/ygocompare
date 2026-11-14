import { PageHead } from "@/components/Section";

/** A page of reading (about, stores, terms…): the shared page head, then the text set as an article. */
export function StaticPage({ title, sub, children }: { title: string; sub?: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl">
      <PageHead title={title} sub={sub} size="article" />
      <div className="prose-site mt-8">{children}</div>
    </article>
  );
}

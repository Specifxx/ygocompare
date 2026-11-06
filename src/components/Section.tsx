import Link from "@/components/Link";

/** The engine's section header (from MTG Compare): a kicker, the title, an optional "See all →" link that wraps under it on a phone. */
export function Section({ id, title, kicker, sub, href, linkLabel = "See all", className = "", children }: { id?: string; title: string; kicker?: string; sub?: string; href?: string; linkLabel?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={className}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          {kicker && <div className="eyebrow mb-1">{kicker}</div>}
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h2>
          {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
        </div>
        {href && (
          <Link href={href} className="shrink-0 text-sm font-semibold text-brand hover:underline">
            {linkLabel} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** An empty list, said plainly. */
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card px-6 py-10 text-center text-muted">{children}</div>;
}

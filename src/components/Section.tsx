import Link from "@/components/Link";

/**
 * A section of a page: the title, an optional kicker and line under it, and an optional "See all →" link that wraps under the
 * title on a phone. `className`: the section's own spacing (and "reveal", to rise in as it scrolls into view); the default is the
 * page's rhythm.
 */
export function Section({ id, title, kicker, sub, href, linkLabel = "See all", className = "mt-16 sm:mt-20", children }: { id?: string; title: string; kicker?: string; sub?: string; href?: string; linkLabel?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={className}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          {kicker && <div className="eyebrow mb-1">{kicker}</div>}
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
        </div>
        {href && (
          <Link href={href} className="shrink-0 text-sm font-semibold text-muted transition-colors hover:text-ink">
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

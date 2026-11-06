import Link from "@/components/Link";
import { abs } from "@/lib/site";
import { JsonLd } from "./JsonLd";

export interface Crumb { name: string; href?: string }

/**
 * Where the page sits (the engine's breadcrumbs, from MTG Compare), plus its BreadcrumbList schema (Home first, as before the
 * engine port: the same names and URLs). Below sm, one "← {parent}" link (a thumb's target, one line instead of a wrapping trail
 * above the H1); from sm, the whole trail.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Home", href: "/" }, ...items];
  const last = all.length - 1;
  const parent = all.length >= 2 ? all[last - 1] : null;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, ...(c.href ? { item: abs(c.href) } : {}) })),
        }}
      />
      <nav className="mb-2 text-sm text-muted sm:mb-4" aria-label="Breadcrumb">
        {parent?.href && (
          <Link href={parent.href} className="-ml-1 inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-lg px-1 font-medium hover:text-ink sm:hidden">
            <span aria-hidden="true">←</span>
            <span className="truncate">{parent.name}</span>
          </Link>
        )}
        <ol className={`${parent?.href ? "hidden sm:flex" : "flex"} flex-wrap items-center gap-1.5`}>
          {all.map((c, i) => (
            <li key={i} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden="true" className="text-faint">
                  /
                </span>
              )}
              {c.href && i < last ? (
                <Link href={c.href} className="hover:text-ink hover:underline hover:underline-offset-2">
                  {c.name}
                </Link>
              ) : (
                <span aria-current={i === last ? "page" : undefined} className="truncate text-ink">
                  {c.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

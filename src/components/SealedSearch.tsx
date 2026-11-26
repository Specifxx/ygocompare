"use client";
// The keyword filter on /sealed (owner, 2026-11-26: "you can't search any sealed products … the filters should be like
// RiftCompare's where you can search keywords"). The page itself is rails by product type; this box answers words ("booster
// box", a set name or code) with every matching sealed product, from the same CDN-cached /api/search the header box reads
// (kind=sealed), so no page render and no new data path. Results replace nothing: the rails stay below.
import { useEffect, useState } from "react";

type Hit = { slug: string; href?: string; name: string; set: string; image: string | null; price: string; kind: string };

export function SealedSearch({ placeholder }: { placeholder: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) {
      setHits(null);
      return;
    }
    const ctl = new AbortController();
    const id = setTimeout(() => {
      setBusy(true);
      fetch(`/api/search?kind=sealed&limit=24&q=${encodeURIComponent(t.toLowerCase())}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d: { hits?: Hit[] }) => setHits((d.hits ?? []).filter((h) => h.kind === "sealed")))
        .catch(() => {})
        .finally(() => setBusy(false));
    }, 250);
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
  }, [q]);

  const t = q.trim();
  return (
    <section aria-label="Search sealed products" data-sealed-search="">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
        enterKeyHint="search"
        autoComplete="off"
        aria-label="Search sealed products"
        placeholder={placeholder}
        className="w-full rounded-full border border-line bg-surface px-4 py-2.5 text-base text-ink placeholder:text-muted focus:border-brand focus:outline-none"
      />
      {hits ? (
        <div className="mt-3">
          <p className="text-sm text-muted" aria-live="polite">
            {hits.length ? `${hits.length === 24 ? "24+" : hits.length} sealed products match “${t}”` : busy ? "Searching…" : `No sealed product matches “${t}”. Try a set name or a product type.`}
          </p>
          {hits.length ? (
            <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {hits.map((h) => (
                <li key={h.slug}>
                  <a href={h.href ?? `/card/${h.slug}`} className="card-surface flex items-center gap-3 p-2 hover:border-brand">
                    {h.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.image} alt={h.name} loading="lazy" className="h-12 w-12 shrink-0 rounded bg-white object-contain" />
                    ) : (
                      <span className="h-12 w-12 shrink-0 rounded bg-white/10" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{h.name}</span>
                      <span className="block truncate text-xs text-muted">{h.set}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">{h.price}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

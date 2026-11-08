"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SITE } from "@/site.config";
import { Icon } from "./Icon";

interface Hit { slug: string; href?: string; name: string; set: string; image: string | null; price: string; kind: string }

/**
 * The search box (the engine's look, from MTG Compare): one rounded field with the glass, suggestions under it from /api/search
 * (CDN-cached per lower-cased query). `size="sm"` is the header's one-row box; `big` the hero's. The list is an ARIA listbox the
 * arrow keys move through; Enter opens the active hit, or the search page for the typed words.
 */
export function SearchBox({ big = false, size, placeholder }: { big?: boolean; size?: "sm"; placeholder?: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const id = useId();
  const t = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(t.current);
    setActive(-1);
    if (q.trim().length < 2) return setHits([]);
    t.current = setTimeout(async () => {
      try {
        // Lower-cased so "Dark Magician" and "dark magician" share one CDN entry.
        const r = await fetch(`/api/search?q=${encodeURIComponent(q.trim().toLowerCase())}`);
        setHits(((await r.json()) as { hits: Hit[] }).hits);
        setOpen(true);
      } catch {}
    }, 250);
  }, [q]);
  const hrefOf = (h: Hit) => h.href ?? `/card/${h.slug}`;
  const listed = open && hits.length > 0;
  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && hits[active]) {
          router.push(hrefOf(hits[active]));
        } else {
          // A pasted store link goes to the "Is this a good price?" checker (lib/link-check.ts), in the fragment: one CDN copy.
        router.push(/^\s*(https?:\/\/|[a-z0-9-]+(\.[a-z0-9-]+)+\/)/i.test(q) ? `/tools/is-this-a-good-price#link=${encodeURIComponent(q.trim())}` : `/cards?q=${encodeURIComponent(q.trim())}`);
        }
        setOpen(false);
      }}
    >
      <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted ${big ? "left-4" : "left-3"}`}>
        <Icon name="search" size={big ? 20 : 16} />
      </span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!listed) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % hits.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a <= 0 ? hits.length - 1 : a - 1));
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        type="search"
        autoComplete="off"
        placeholder={placeholder ?? (SITE.sealedOnly ? (size === "sm" ? "Search sealed…" : "Search any booster box, tin or deck…") : size === "sm" ? "Search cards…" : SITE.kits ? `Search any card, sealed product or ${SITE.kits.label} kit…` : "Search any card or sealed product…")}
        aria-label={SITE.sealedOnly ? "Search sealed products" : "Search cards"}
        role="combobox"
        aria-expanded={listed}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
        className={`w-full rounded-full border border-line bg-surface text-ink placeholder:text-muted focus:border-brand focus:outline-none ${big ? "py-4 pl-12 pr-5 text-lg shadow-lift" : size === "sm" ? "h-10 pl-9 pr-3 text-sm" : "py-2.5 pl-9 pr-3 text-sm"}`}
      />
      {listed && (
        <ul id={`${id}-list`} role="listbox" className="absolute left-0 right-0 z-50 mt-2 max-h-96 overflow-auto rounded-2xl border border-line bg-surface p-1 text-left shadow-lift">
          {hits.map((h, i) => (
            <li key={h.href ?? h.slug} id={`${id}-${i}`} role="option" aria-selected={i === active}>
              <a href={hrefOf(h)} className={`flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-raised ${i === active ? "bg-raised" : ""}`} onMouseEnter={() => setActive(i)}>
                {h.image ? <img src={h.image} alt={h.name} width={32} height={44} className="h-11 w-8 rounded object-contain" loading="lazy" /> : <span className="h-11 w-8" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{h.name}</span>
                  <span className="block truncate text-xs text-muted">{h.set}</span>
                </span>
                <span className="tabular text-sm font-semibold text-brand">{h.price}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

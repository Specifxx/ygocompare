"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SITE } from "@/site.config";
import Link from "./Link";
import { Icon } from "./Icon";

interface Hit { slug: string; href?: string; name: string; set: string; image: string | null; price: string; kind: string }

/**
 * The search box (the engine's look, from MTG Compare): one rounded field with the glass, suggestions under it from /api/search
 * (CDN-cached per lower-cased query). `size="sm"` is the header's one-row box; `big` the hero's. The list is an ARIA listbox the
 * arrow keys move through. There is no search results page (the site is static): Enter opens the active hit, or the only hit;
 * with several it marks the first, so a second Enter opens it; with none the panel says so and offers the ways in that exist
 * (2026-11-14: Enter used to load the whole sealed hub, unfiltered, and a search with no match showed nothing at all).
 */
export function SearchBox({ big = false, size, placeholder }: { big?: boolean; size?: "sm"; placeholder?: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // The query the hits on screen answer: "nothing matches" is only said once the answer for the typed words is in.
  const [answered, setAnswered] = useState("");
  const router = useRouter();
  const id = useId();
  const t = useRef<ReturnType<typeof setTimeout>>();
  const key = q.trim().toLowerCase();
  const find = async (k: string): Promise<Hit[] | null> => {
    try {
      // Lower-cased so "Dark Magician" and "dark magician" share one CDN entry.
      const r = await fetch(`/api/search?q=${encodeURIComponent(k)}`);
      const found = ((await r.json()) as { hits: Hit[] }).hits ?? [];
      setHits(found);
      setAnswered(k);
      setOpen(true);
      return found;
    } catch {
      return null;
    }
  };
  useEffect(() => {
    clearTimeout(t.current);
    setActive(-1);
    if (key.length < 2) return setHits([]);
    t.current = setTimeout(() => void find(key), 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const hrefOf = (h: Hit) => h.href ?? `/card/${h.slug}`;
  const listed = open && hits.length > 0;
  // The header's box is about 130px wide on a phone: its panel takes the screen's width under the header, not the field's.
  const panel = `z-50 rounded-2xl border border-line bg-surface text-left shadow-lift ${size === "sm" ? "max-sm:fixed max-sm:inset-x-3 max-sm:top-[calc(var(--hdr)+4px)] sm:absolute sm:left-0 sm:right-0 sm:mt-2 lg:left-auto lg:w-[26rem] lg:max-w-[calc(100vw-2rem)]" : "absolute left-0 right-0 mt-2"}`;
  const none = open && !listed && key.length >= 2 && answered === key;
  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={async (e) => {
        e.preventDefault();
        if (active >= 0 && hits[active]) {
          setOpen(false);
          return router.push(hrefOf(hits[active]));
        }
        // A pasted store link goes to the "Is this a good price?" checker (lib/link-check.ts), in the fragment: one CDN copy.
        if (/^\s*(https?:\/\/|[a-z0-9-]+(\.[a-z0-9-]+)+\/)/i.test(q)) {
          setOpen(false);
          return router.push(`/tools/is-this-a-good-price#link=${encodeURIComponent(q.trim())}`);
        }
        if (key.length < 2) return;
        // Enter before the suggestions arrived: ask now, not after the typing pause.
        clearTimeout(t.current);
        const found = answered === key ? hits : await find(key);
        if (!found) return;
        if (found.length === 1) {
          setOpen(false);
          router.push(hrefOf(found[0]));
        } else {
          setOpen(true);
          if (found.length) setActive(0);
        }
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
          if (e.key === "Escape") return setOpen(false);
          if (!listed) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % hits.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a <= 0 ? hits.length - 1 : a - 1));
          }
        }}
        type="search"
        autoComplete="off"
        placeholder={placeholder ?? (SITE.sealedOnly ? (size === "sm" ? "Search sealed or set code…" : "Search any booster box, tin or deck…") : size === "sm" ? "Search cards…" : SITE.kits ? `Search any card, sealed product or ${SITE.kits.label} kit…` : "Search any card or sealed product…")}
        aria-label={SITE.sealedOnly ? "Search sealed products" : "Search cards"}
        role="combobox"
        aria-expanded={listed}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
        className={`w-full rounded-full border border-line bg-surface text-ink text-ellipsis placeholder:text-ellipsis placeholder:text-muted focus:border-brand focus:outline-none ${big ? "py-4 pl-12 pr-5 text-lg shadow-lift" : size === "sm" ? "h-10 pl-9 pr-3 text-sm" : "py-2.5 pl-9 pr-3 text-sm"}`}
      />
      {listed && (
        <ul id={`${id}-list`} role="listbox" className={`${panel} max-h-96 overflow-auto p-1`}>
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
      {none && (
        <div id={`${id}-list`} role="status" className={`${panel} p-4`}>
          <p className="break-words text-sm font-medium text-ink">Nothing matches &ldquo;{q.trim()}&rdquo; yet.</p>
          <p className="mt-1 text-sm text-muted">{SITE.sealedOnly ? "Try a set name or its code, or fewer words. You can also browse:" : "Try fewer words or check the spelling. You can also browse:"}</p>
          {/* onMouseDown: the field's blur closes the panel 150ms later; a link pressed here must still be followed. */}
          <p className="mt-3 flex flex-wrap gap-2" onMouseDown={(e) => e.preventDefault()}>
            <Link href="/sealed" className="chip min-h-10" onClick={() => setOpen(false)}>All sealed</Link>
            <Link href="/sets" className="chip min-h-10" onClick={() => setOpen(false)}>Sets</Link>
            <Link href="/tools/deal-finder" className="chip min-h-10" onClick={() => setOpen(false)}>Deals</Link>
          </p>
        </div>
      )}
    </form>
  );
}

"use client";
// A "find in this list" box for the long directory pages (/sets, /stores; 2026-11-23). The list is server HTML: groups
// ([data-ff-group]) of items ([data-ff], the lower-cased name), each group folded to its first few (.ff-x) with a
// [data-ff-more] button. Typing shows every match in every group and hides groups with none; the buttons unfold one group.
// Without scripts the page's <noscript> rule shows everything.
import { useEffect, useRef, useState } from "react";

export function FoldFinder({ placeholder, noun }: { placeholder: string; noun: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const root = () => box.current?.closest<HTMLElement>("[data-ff-root]") ?? null;

  useEffect(() => {
    const r = root();
    if (!r) return;
    const open = (e: Event) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-ff-more]");
      const g = b?.closest<HTMLElement>("[data-ff-group]");
      if (!b || !g) return;
      g.dataset.ffOpen = "1";
      g.querySelectorAll(".ff-x").forEach((el) => el.classList.remove("ff-x"));
      b.hidden = true;
    };
    r.addEventListener("click", open);
    return () => r.removeEventListener("click", open);
  }, []);

  useEffect(() => {
    const r = root();
    if (!r) return;
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    let n = 0;
    r.querySelectorAll<HTMLElement>("[data-ff-group]").forEach((g) => {
      let mine = 0;
      g.querySelectorAll<HTMLElement>("[data-ff]").forEach((el) => {
        const ok = words.every((w) => (el.dataset.ff ?? "").includes(w));
        el.classList.toggle("ff-miss", !ok);
        if (ok) mine++;
      });
      g.classList.toggle("ff-miss", words.length > 0 && mine === 0);
      g.classList.toggle("ff-searching", words.length > 0);
      n += mine;
    });
    setHits(words.length ? n : null);
  }, [q]);

  return (
    <div ref={box} className="ff-box">
      <label className="lc-search">
        <span className="sr-only">{placeholder}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-faint" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="6" /><path d="m14 14 4 4" strokeLinecap="round" /></svg>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} autoComplete="off" enterKeyHint="search" />
      </label>
      <p className="ff-hits" aria-live="polite">{hits == null ? "" : hits === 0 ? `No ${noun} match "${q}".` : `${hits.toLocaleString()} ${noun} match.`}</p>
    </div>
  );
}

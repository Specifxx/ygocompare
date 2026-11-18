"use client";
// The "Best price" tag of a row (lib/best-price.ts). Loud (a paid row is the cheapest): the existing green chip. Plain (a store that
// pays nothing): a small neutral chip, and, when the list has an eBay or TCGplayer row, an "i" that shows a one-line hint on hover,
// focus or tap. Never says another row is cheaper.
import { useState } from "react";
import type { BestTreatment } from "@/lib/best-price";

export function BestPriceTag({ treatment }: { treatment: BestTreatment }) {
  const [open, setOpen] = useState(false);
  if (treatment.loud) return <span className="ml-2 rounded-full bg-open-soft px-2 py-0.5 text-[10px] font-bold uppercase text-open">Best price</span>;
  return (
    <span className="ml-2 inline-flex flex-wrap items-center gap-1 align-middle" data-best-plain="">
      <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">Best price</span>
      {treatment.hint && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={treatment.hint}
            aria-expanded={open}
            title={treatment.hint}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line text-[11px] font-semibold italic leading-none text-muted hover:text-ink"
          >
            i
          </button>
          {open && <span className="basis-full text-[11px] font-normal normal-case text-muted">{treatment.hint}</span>}
        </>
      )}
    </span>
  );
}

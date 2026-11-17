"use client";

// One quiet line under a deals page's hero (2026-11-17): TCGplayer's Cyber Weekend, 28 Nov to 1 Dec, 10% store credit on
// all products. Text only. The state is read in the browser, so a page the CDN kept a day still switches off on time.
import { useEffect, useState } from "react";
import { cyberWeekendState, type CyberWeekendState } from "@/lib/cyber-weekend";

export function CyberWeekendNote({ initial }: { initial: CyberWeekendState }) {
  const [state, setState] = useState<CyberWeekendState>(initial);
  useEffect(() => setState(cyberWeekendState(Date.now())), []);
  if (state === "off") return null;
  return (
    <p className="rounded-xl border border-line bg-raised px-4 py-3 text-sm text-muted">
      <b className="text-ink">TCGplayer Cyber Weekend:</b>{" "}
      {state === "on" ? "on now until 11PM New York time on 1 December" : "9AM New York time on 28 November to 11PM on 1 December"}, buyers
      earn 10% store credit on all products on TCGplayer (subscribers 13% or more). The store prices below are separate from it.
    </p>
  );
}

import type { Metadata } from "next";
import { FeedbackForm } from "@/components/FeedbackAsk";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { StaticPage } from "@/components/StaticPage";

// /feedback (owner, 2026-11-18: "we need more feedback"): the full feedback form (components/FeedbackAsk.tsx, filed with the
// reports for the daily triage) and what visitors' notes have already changed. Linked from the footer and the menu; noindex.
export const revalidate = 86400;
export const metadata: Metadata = { title: "Send feedback", description: `Tell ${SITE.name} what to build or fix next.`, ...canon("/feedback"), robots: { index: false, follow: true } };

// What visitors asked for and we built, newest first. Add a line when a note leads to a change (the daily feedback triage).
const BUILT: { date: string; what: string; from: string }[] = [
  {
    "date": "18 Nov 2026",
    "what": "Search and sort price movers by % gain or loss, not just risers or fallers.",
    "from": "Asked by a visitor on RiftCompare, our sister site, and built here too"
  }
];

export default function FeedbackPage() {
  return (
    <StaticPage title="Tell us what to build next">
      <p style={{ marginTop: 12 }}>Ideas, annoyances, a store or product we&apos;re missing: tell us. Every note is read, usually within a day, and the next things we build come from them.</p>
      <FeedbackForm email={SITE.supportEmail} />
      <h2 style={{ marginTop: 32, fontSize: 20, fontWeight: 700 }}>You asked, we built it</h2>
      {BUILT.length ? (
        <ul style={{ marginTop: 8, paddingLeft: 18, listStyle: "disc" }}>
          {BUILT.map((b) => (
            <li key={b.date + b.what} style={{ margin: "8px 0" }}>
              <b>{b.date}:</b> {b.what} <span style={{ opacity: 0.7 }}>({b.from})</span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ marginTop: 8 }}>Nothing here yet. Your note could be the first.</p>
      )}
    </StaticPage>
  );
}

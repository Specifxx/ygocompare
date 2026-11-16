"use client";

// "in 11 days" beside a real event date, counted in the visitor's browser so a page the CDN kept a day is never a day out.
// Server HTML carries the build-time sentence; this only refreshes it. Never a sale deadline, never urgency copy.
import { useEffect, useState } from "react";
import { daysLabel, daysUntil } from "@/lib/black-friday";

export function DaysUntil({ target, initial }: { target: string; initial: string }) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setText(daysLabel(daysUntil(today, target)));
  }, [target]);
  return <>{text}</>;
}

import { HolidayDealsPage, holidayMetadata } from "@/components/HolidayDealsPage";

// The Cyber Monday page (DECISIONS.md, "Cyber Monday page", 2026-11-07): its own URL for its own
// searches, kept every year like /black-friday, with the same real store deals.
export const revalidate = 86400;

export function generateMetadata() {
  return holidayMetadata("cyber-monday");
}

export default function CyberMondayPage() {
  return <HolidayDealsPage event="cyber-monday" />;
}

import { HolidayDealsPage, holidayMetadata } from "@/components/HolidayDealsPage";

// The Black Friday page (DECISIONS.md, "Black Friday page", 2026-11-02): one URL kept
// year after year, so links and rankings it gathers carry over. Rebuilt from the day's
// prices like every page; never a "was" price, a countdown or an invented sale.
export const revalidate = 86400;

export function generateMetadata() {
  return holidayMetadata("black-friday");
}

export default function BlackFridayPage() {
  return <HolidayDealsPage event="black-friday" />;
}

// TCGplayer's Cyber Weekend 2026 (its Impact affiliate email, 17 Nov 2026): 9AM New York time on 28 November to 11PM
// on 1 December, 10% store credit on all products (subscribers 13%+). A plain-text note on the deal pages, never a
// banner, never a pop-up; it switches itself off after the end. Update these two instants and the copy next year.
export const CYBER_WEEKEND = {
  /** 9AM EST, 28 Nov 2026 */
  start: Date.parse("2026-11-28T14:00:00Z"),
  /** 11PM EST, 1 Dec 2026 */
  end: Date.parse("2026-12-02T04:00:00Z"),
  /** First day the note shows: a week ahead, so it is read before the weekend. */
  showFrom: Date.parse("2026-11-20T00:00:00Z"),
};

export type CyberWeekendState = "soon" | "on" | "off";

export function cyberWeekendState(now: number): CyberWeekendState {
  if (now >= CYBER_WEEKEND.end || now < CYBER_WEEKEND.showFrom) return "off";
  return now >= CYBER_WEEKEND.start ? "on" : "soon";
}

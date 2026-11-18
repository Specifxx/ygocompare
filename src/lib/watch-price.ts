// Lever 1 of the retention programme (components/WatchPrice.tsx; owner 2026-11-18). Pure helpers.
export const WATCH_ARM_KEY = "watch-arm";
export const WATCH_SEEN_KEY = "watch-seen";
/** The window event the shared alert form sends when it opens or saves (detail: { kind: "open" | "saved", from }). */
export const ALERT_EVENT = "price-alert";
export type WatchArm = "on" | "off";
export const pickWatchArm = (rand: number): WatchArm => (rand < 0.5 ? "on" : "off");
export const seenToday = (stored: string | null, day: string): boolean => stored === day;

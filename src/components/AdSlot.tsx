// AdSense is off (owner, 2026-11-18, "Speed up sites on mobile"): the site loads no Google ad script, so a unit
// would stay an empty box. Kept as a component that draws nothing so the pages that place one need no change.
export function AdSlot(_props: { slot?: string; className?: string }) {
  return null;
}

// Pages that never carry an ad or a pop-up (coordinator for the owner, 2026-11-19): Premium (it promises no ads), the account,
// sign-in, collection, watch list and giveaway pages are conversion and utility pages, so the top banner, the phone dock and the
// heavy test's pop-ups all stand down on them, on every arm of the ad-intensity test. Pure, for the tests.
export const AD_FREE_PREFIXES = ["/premium", "/account", "/collection", "/watches", "/login", "/signin", "/sign-in", "/giveaway"] as const;

export function adFreePath(path: string | null | undefined): boolean {
  if (!path) return false;
  const p = path.split(/[?#]/)[0].toLowerCase();
  return AD_FREE_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));
}

// Seasonal theme, as on Rift Compare (src/lib/season.ts there, owner
// 2026-10-16). A season is a window in the VISITOR's local time; the inline
// SEASON_BOOT_SCRIPT stamps data-season on <html> before first paint, so the
// theme switches off at the visitor's own midnight on 31 October → 1 November
// even though pages are ISR-cached for six hours or more. The server only
// decides whether to include season-only markup (with a day of slack).
//
// Preview: ?season=halloween forces it on, ?season=off forces it off.

export type Season = "halloween";

export const SEASONS: Record<Season, { from: [number, number]; to: [number, number] }> = {
  // Through Halloween night; gone on 1 November.
  halloween: { from: [10, 16], to: [10, 31] },
};

const md = (d: Date) => (d.getMonth() + 1) * 100 + d.getDate();

export function seasonAt(d: Date): Season | null {
  const v = md(d);
  for (const [name, w] of Object.entries(SEASONS) as [Season, (typeof SEASONS)[Season]][])
    if (v >= w.from[0] * 100 + w.from[1] && v <= w.to[0] * 100 + w.to[1]) return name;
  return null;
}

export function seasonMarkupLive(season: Season, now: Date = new Date()): boolean {
  const day = 86_400_000;
  return [now, new Date(now.getTime() - day), new Date(now.getTime() + day)].some((d) => seasonAt(d) === season);
}

const H = SEASONS.halloween;
export const SEASON_BOOT_SCRIPT = `(function(){try{var q=(location.search.match(/[?&]season=([a-z]+)/)||[])[1];var s=null;if(q){s=q==="halloween"?"halloween":null}else{var d=new Date(),v=(d.getMonth()+1)*100+d.getDate();if(v>=${H.from[0] * 100 + H.from[1]}&&v<=${H.to[0] * 100 + H.to[1]})s="halloween"}if(s){document.documentElement.setAttribute("data-season",s)}}catch(e){}})();`;

import Link from "@/components/Link";
import { gameViews } from "@/lib/game-hubs";
import { imageAt } from "@/lib/image";

/**
 * The homepage's "pick your game" row on a multi-game site (SITE.lines): one
 * panel per game in its colour, with its three most valuable cards fanned out
 * (TCGplayer's own photos, hotlinked like every tile). Plain links, server HTML.
 */
export function GameTiles() {
  const views = gameViews();
  if (!views.length) return null;
  return (
    <section aria-labelledby="games-h">
      <h2 id="games-h" className="mb-3 text-xl font-bold">Pick your game</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {views.map((v) => {
          const fan = v.topCards.filter((p) => p.image).slice(0, 3);
          return (
            <Link key={v.line.id} href={`/games/${v.line.slug}`} className="game-tile group" style={{ ["--game" as string]: v.line.color }}>
              {fan.length > 0 && (
                <span className="game-fan" aria-hidden="true">
                  {fan.map((p, i) => (
                    <img key={p.id} src={imageAt(p.image, "200w")!} alt={`${p.name} card`} loading="lazy" width={86} height={120} className={`game-fan-card game-fan-${i}`} />
                  ))}
                </span>
              )}
              <span className="game-tile-name">{v.line.name}</span>
              <span className="game-tile-blurb mt-1 block text-sm">{v.line.blurb}</span>
              <span className="game-tile-stats mt-3 flex flex-wrap gap-1.5 text-xs">
                <span>{v.cards.toLocaleString()} cards</span>
                <span>{v.sealed.toLocaleString()} sealed</span>
                <span>{v.sets.length} sets</span>
              </span>
              {v.newest && <span className="mt-2 block text-xs opacity-80">Newest: {v.newest.name}</span>}
              <span className="game-tile-go mt-3 inline-block text-sm font-bold">Compare {v.line.short} prices →</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

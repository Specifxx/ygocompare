import Link from "@/components/Link";
import { SITE } from "@/site.config";
import { creatorsOn, featuredCreators } from "@/lib/creators";
import { CreatorAvatar } from "./CreatorAvatar";

// The small pill into /creators (owner, 2026-11-03: "just a bubble and then a
// really nice formatted creators page, like RiftCompare"): in the hero's
// corner from sm, a centred pill above the headline on a phone. Server HTML,
// one followed link; nothing on a site without creators.
export function CreatorsBubble() {
  if (!creatorsOn()) return null;
  const faces = featuredCreators().slice(0, 3);
  return (
    <Link
      href="/creators"
      className="group relative z-20 mb-3 inline-flex min-h-9 items-center gap-2 rounded-full border border-brand/40 bg-ink-900/80 py-1 pl-1.5 pr-3.5 text-xs font-bold text-fg shadow-lg shadow-brand/10 backdrop-blur transition-transform hover:scale-[1.04] hover:border-brand sm:absolute sm:right-4 sm:top-4 sm:mb-0 sm:text-sm"
    >
      <span className="flex -space-x-2" aria-hidden>
        {faces.map((c) => (
          <span key={c.slug} className="rounded-full ring-2 ring-ink-900">
            <CreatorAvatar creator={c} size={24} decorative />
          </span>
        ))}
      </span>
      <span>
        {SITE.gameShort} creators
        <span className="ml-1.5 font-semibold text-brand-400 group-hover:text-fg">Meet them →</span>
      </span>
    </Link>
  );
}

import Link from "@/components/Link";
import { SearchBox } from "@/components/SearchBox";
import { SITE } from "@/site.config";

/** The 404: say what happened in plain words, then the two ways on: the search and the lists that exist. */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-12 text-center sm:py-20">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-pretty leading-7 text-muted">
        That page has moved or never existed. {SITE.sealedOnly ? "Search for a booster box, tin or deck" : "Search for what you were after"}, or pick up from one of these.
      </p>
      <div className="mt-7 text-left"><SearchBox big /></div>
      <p className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="chip min-h-10">Home</Link>
        <Link href="/sealed" className="chip min-h-10">All sealed</Link>
        <Link href="/sets" className="chip min-h-10">Sets</Link>
        <Link href="/tools/deal-finder" className="chip min-h-10">Deals</Link>
      </p>
    </div>
  );
}

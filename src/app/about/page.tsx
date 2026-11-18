import type { Metadata } from "next";
import { SITE } from "@/site.config";
import { canon } from "@/lib/site";
import { StaticPage } from "@/components/StaticPage";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: `About ${SITE.name}: who runs it`,
  description: `${SITE.name} is run by two people, Bill and George. Where our ${SITE.gameShort} sealed prices come from, how we are paid and what the site costs.`,
  ...canon("/about"),
};

export default function About() {
  return (
    <StaticPage title={`About ${SITE.name}: who runs it`}>
      <p>{SITE.name} is a free price comparison site for {SITE.game}. Every day it collects the price of every {SITE.gameShort} booster box, pack, tin, structure deck and collection from TCGplayer, eBay, Amazon and {SITE.stores.length} online game stores in the US, UK, Canada and Australia, and puts them side by side, cheapest first.</p>
      <h2>Who is behind it</h2>
      <p>Bill and George, the two co-founders, run {SITE.name} between them. Nobody else owns a piece of it: no investor, no publisher, no store. Our one rule is that comparing prices is free for everyone and a cheaper store is never hidden.</p>
      <p>We use AI tools to help write the site&rsquo;s code and to draft guides, which we check before they go up. The prices are not written by anyone: a program reads them from each store every day, and a listing it cannot match to one exact product is dropped rather than guessed.</p>
      {SITE.disclaimer && <p>{SITE.disclaimer}</p>}
      <h2>How we make money</h2>
      <p>Some buy links are affiliate links (eBay Partner Network, TCGplayer, Amazon): if you buy, the store may pay us a small commission at no cost to you. Amazon, eBay and TCGplayer, our affiliate partners, head each price table whatever their price, with &ldquo;Best price&rdquo; still marking the cheapest. The stores below them are ranked by price only — a store that pays us nothing ranks exactly where its price puts it.</p>
      <h2>What it costs</h2>
      <p>{SITE.name} shares its servers, daily price jobs and tools with a handful of other price sites we run. Together they cost about A$790 a month (our own accounts, 30 days to 15 November 2026), paid for by the affiliate commission above. Nobody pays to be listed.</p>
      <h2>Contact</h2>
      <p>Spotted a wrong price, or run a store that sells {SITE.gameShort}? <a href="/contact">Get in touch</a> or email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.</p>
    </StaticPage>
  );
}

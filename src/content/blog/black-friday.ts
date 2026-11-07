import type { Post } from "./types";

// Black Friday 2026 (2026-11-07): the newest sets' sealed prices as live tables ({{sealed:SETID}}, lib/post-render.ts),
// so the "prices to beat" are today's prices on every visit. The deals themselves are on /black-friday and /cyber-monday.
export const post: Post = {
  slug: "yugioh-black-friday-2026",
  title: "Yu-Gi-Oh! Black Friday 2026: the prices to beat",
  description: "Yu-Gi-Oh! Black Friday and Cyber Monday 2026: today's prices for the newest sets' sealed product, the cheapest store for each, and five checks before you buy.",
  date: "2026-11-07",
  keywords: ["yugioh black friday", "yugioh black friday deals", "yugioh cyber monday", "yugioh booster box black friday", "black friday 2026"],
  html: `
<p>Black Friday is Friday 27 November 2026 and Cyber Monday is Monday 30 November. Plenty of stores will run sales on Yu-Gi-Oh! that week, and some start earlier. The one thing worth doing before then is knowing what each product costs today, so you can tell a real deal from a normal price with a red sticker on it.</p>
<p>Below are today's prices for the newest sets' sealed product: TCGplayer's market price, and the cheapest in-stock store listing we found. These tables are rebuilt from every day's prices, so they are the prices to beat right up to Cyber Monday. For the deals themselves, our <a href="/black-friday">Yu-Gi-Oh! Black Friday deals</a> page lists everything stores sell under TCGplayer's market price today, in every country we cover, and <a href="/cyber-monday">Cyber Monday deals</a> does the same that weekend.</p>

<h2>Today's prices to beat</h2>
<h3>Beyond the Brave</h3>
{{sealed:24815}}

<h3>Magnificent Monsters</h3>
{{sealed:24707}}

<h3>Chaos Origins</h3>
{{sealed:24675}}

<h3>Blazing Dominion</h3>
{{sealed:24581}}

<p>Every product links to its page, which compares every store, eBay and TCGplayer for it, cheapest in stock first. Switch the market at the top of any page for stores in your country, in your own currency.</p>

<h2>How to tell a real Black Friday deal</h2>
<ol>
<li><b>Compare with today's price, not the "was" price or the MSRP.</b> Many Yu-Gi-Oh! products already sell under their list price at the cheapest store. A "Black Friday price" that matches what the cheapest store charges every week is not a deal.</li>
<li><b>Count the shipping.</b> A box a few dollars cheaper at a store with $15 shipping costs more than a dearer one with free shipping over a threshold.</li>
<li><b>Check it is in stock.</b> A low price on a pre-order or a backorder is a promise, not a box. Our tables only count in-stock listings.</li>
<li><b>Be careful with prices far under everyone else.</b> A sealed product at half the price of every other store is more often a mistake, a different product or a resealed box than a sale. Buy sealed product from a store you trust, and check the wrap.</li>
<li><b>Codes rarely stack on sealed.</b> Stores often leave booster boxes out of site-wide percentage codes. Read the terms before you count the discount.</li>
</ol>
<p><b>1st Edition or Unlimited?</b> The same booster box can be a 1st Edition or an Unlimited print, at different prices. Check the edition in the product name before you compare.</p>
<h2>When to buy</h2>
<p>If a product you want is already at a good price today, waiting for Black Friday can cost more than it saves: popular sealed product sells out in December. If it is not, bookmark the <a href="/black-friday">Black Friday deals</a> page, which updates every day through the sales, or set a price alert on the product's page and we will email you when it drops.</p>
`,
  faq: [
  {
    "q": "When is Black Friday 2026?",
    "a": "Black Friday is Friday 27 November 2026 and Cyber Monday is Monday 30 November 2026. Many stores start their sales earlier in the week."
  },
  {
    "q": "Will Yu-Gi-Oh! be cheaper on Black Friday 2026?",
    "a": "Some stores will discount Yu-Gi-Oh!, but many products already sell under TCGplayer's market price at the cheapest store. Compare any Black Friday price with today's lowest in-stock price on YGO Compare's product pages, not with a crossed-out price or the MSRP."
  },
  {
    "q": "Where can I find Yu-Gi-Oh! Black Friday deals?",
    "a": "The YGO Compare Black Friday page lists every product a store sells under TCGplayer's market price today, in stock, in every country we cover, updated every day through Black Friday and Cyber Monday."
  }
],
};

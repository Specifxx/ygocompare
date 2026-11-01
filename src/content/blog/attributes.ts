import type { Post } from "./types";

// The tables are live ({{attrstats:FACET}}, lib/post-render.ts): counts and prices update with every import.
export const post: Post = {
  slug: "yu-gi-oh-attributes-and-monster-types-by-price",
  title: "Yu-Gi-Oh! attributes and monster types: which are the most valuable?",
  description: "Every Yu-Gi-Oh! attribute and monster type compared by card count, median price and cards worth $10+, with live prices and a price list for each.",
  date: "2026-11-01",
  keywords: ["yu-gi-oh attributes", "yugioh monster types", "most valuable yugioh dragon cards", "yugioh dark attribute cards", "yugioh spellcaster cards price", "yugioh types list"],
  html: `
<p>Every Yu-Gi-Oh! monster has an <b>attribute</b> (Dark, Light, Earth, Water, Fire, Wind or Divine) and a <b>type</b> (Dragon, Spellcaster, Warrior and two dozen more), printed on the card. Collectors often build binders around one, and many decks are built around a type. Which ones hold the most money? The tables below are live and update with every price import.</p>

<h2>Attributes compared</h2>
{{attrstats:attribute}}
<p><b>Median</b> is the middle printing's TCGplayer market price, so a few trophy cards can't skew it. <b>$10+</b> counts printings worth ten dollars or more. Click any attribute for every card in it, most valuable first.</p>
<p>Dark and Light lead on sheer numbers: they are the two biggest attributes, so they hold the most valuable cards too. Divine is tiny (the Egyptian God cards and a few others) but almost every one is collectable.</p>

<h2>Monster types compared</h2>
{{attrstats:type}}
<p>Dragon, Spellcaster and Warrior are the game's three biggest types and carry its most famous cards, from Blue-Eyes White Dragon to Dark Magician. Smaller types with a high median, such as Sea Serpent, Divine-Beast and Illusion, are where a typical card is worth more than a few dollars.</p>

<h2>What the "most valuable" column really means</h2>
<p>The top card in each row is often a tournament prize or a one-of-a-kind printing that almost nobody buys. For what a deck or a binder actually costs, look at the median and the $10+ count, then open the hub and sort out the printings you need. A card's price depends heavily on its printing: our <a href="/blog/yu-gi-oh-rarities-explained">rarities guide</a> and <a href="/blog/yu-gi-oh-1st-edition-vs-unlimited">1st Edition guide</a> explain why the same card can cost $1 or $1,000.</p>

<h2>Pay less for any of them</h2>
<ol>
<li>Every card page compares TCGplayer, eBay and every store we track, cheapest in-stock first.</li>
<li>For a whole deck, paste the list into the <a href="/tools/best-basket">best basket</a> tool: it finds the cheapest mix of stores, shipping included.</li>
<li>Check <a href="/movers">price movers</a> before you buy: a type that gets new support in a set climbs within days.</li>
</ol>
`,
  faq: [
    { q: "How many attributes are there in Yu-Gi-Oh!?", a: "Seven: Dark, Light, Earth, Water, Fire, Wind and Divine." },
    { q: "What is the most valuable Yu-Gi-Oh! monster type?", a: "Dragon, Spellcaster and Warrior hold the most valuable cards because they are the biggest types. YGO Compare's type table shows the live median and the number of cards worth $10 or more for every type." },
  ],
};

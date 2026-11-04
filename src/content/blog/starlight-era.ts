import type { Post } from "./types";

// A market-trend post (owner, 2026-11-04). Dated figures are TCGplayer market
// prices in the 4 November 2026 public export (data/public): per-set counts of
// cards at US$50 or more, and each rarity's median across every priced card.
// The live tokens reprice daily. No price here is a forecast.
export const post: Post = {
  slug: "yu-gi-oh-quarter-century-to-starlight-era",
  title: "From Quarter Century to Starlight: how the Yu-Gi-Oh! chase rarity changed, and what it did to set values",
  description:
    "Quarter Century Secret Rares topped every core set from 2023 to spring 2025. Since Battles of Legend: Monster Mayhem the top card is a Starlight, and Starlights sell for twice as much. The data, set by set, and what Magnificent Maestros does next.",
  date: "2026-11-04",
  keywords: ["starlight rare prices", "quarter century secret rare prices", "yu-gi-oh market 2026", "magnificent monsters starlight", "yu-gi-oh set value", "magnificent maestros"],
  image: {
    src: "/blog/yu-gi-oh-quarter-century-to-starlight-era.jpg",
    alt: "A bar chart of the median TCGplayer market price by Yu-Gi-Oh! rarity: Secret Rare US$4, Collector's Rare US$11, Quarter Century Secret Rare US$11, Ultimate Rare US$18, Starlight Rare US$22, on YGO Compare's dark red branding",
  },
  html: `
<p>Every Yu-Gi-Oh! core set has one rarity that carries most of its value. For the game's 25th anniversary that rarity was the <b>Quarter Century Secret Rare</b>; since the middle of 2025 it has been the <b>Starlight Rare</b>, and the change has done something the anniversary never did: it has made the top card of a set worth four figures again. This post lays out what we can see in our own prices, set by set, as of 4 November 2026, and what the pattern says to expect from Magnificent Maestros on 13 November.</p>

<p>Every live figure reprices each morning from the same data as the card pages. The dated numbers are there so the comparison stays honest when the live ones move. Our catalogue leaves out cards worth under a dollar in every printing, so "median" below means the median of the cards worth tracking, not of every common.</p>

<h2>The rarities, ranked by what they sell for</h2>
<p>Across every printing in our catalogue with a TCGplayer market price, the median price by rarity on 4 November was:</p>
<ul>
<li><b>Starlight Rare</b>: US$22.29 median across 569 printings, top price US$1,164.</li>
<li><b>Ultimate Rare</b>: US$18.05 across 1,270, top price US$1,012.</li>
<li><b>Quarter Century Secret Rare</b>: US$11.14 across 1,061, top price US$498.</li>
<li><b>Collector's Rare</b>: US$11.01 across 256, top price US$127.</li>
<li><b>Secret Rare</b>: US$4.03 across 2,592, top price US$700.</li>
<li><b>Ultra Rare</b>: US$3.40 across 3,574, top price US$900.</li>
<li><b>Prismatic Secret Rare</b>: US$2.96 across 300, but the single most expensive printing in the game at US$1,451.</li>
</ul>
<p>Two of those rarities are new or newly revived. Starlight Rares became the top slot of every core set in 2025, and Konami brought Ultimate Rares back as the whole point of the Ultimate Tournament Packs in July 2026, which is why a nineteen-year-old rarity has the second-highest median. Our <a href="/blog/yu-gi-oh-rarities-explained">rarities explained</a> guide covers what each one looks like; this post is about what they cost.</p>

<h2>The Quarter Century era, November 2023 to spring 2025</h2>
<p>The 25th Anniversary Rarity Collection (November 2023) put a Quarter Century Secret Rare on 231 reprinted cards, and from Phantom Nightmare (February 2024) every core set's top card was its QCSR. The value this produced was real but shallow:</p>
<ul>
<li>A core set's top QCSR settled between US$80 and US$300: Veidos in Phantom Nightmare at US$79, Mulcharmy Purulia in The Infinite Forbidden at US$169, {{card:584273}} in Rage of the Abyss at {{price:584273}}.</li>
<li>The two Rarity Collections (RA01 and RA02) have no card worth US$50 or more today, because every QCSR in them was printed in volume. Quarter Century Bonanza (RA03) is the exception, with 28 cards at US$50 or more, led by {{card:592725}} at {{price:592725}}.</li>
<li>A typical core set of the era has three to eight cards at US$50 or more. Rage of the Abyss has eight; Supreme Darkness and Alliance Insight five each.</li>
</ul>
<p>The QCSR did its job, which was to make the anniversary sets open. It did not make a single core-set card worth four figures.</p>

<h2>The Starlight era, June 2025 onward</h2>
<p>Battles of Legend: Monster Mayhem (June 2025) was the first set whose top card was a Starlight Rare, and every core set since has followed: Duelist's Advance, Doom of Dimensions, Burst Protocol, Blazing Dominion, Chaos Origins, Magnificent Monsters and Beyond the Brave. The difference shows up in two ways.</p>
<p><b>The top card is worth more.</b> Starlights of the game's signature monsters, especially the Extended Art versions, are the first core-set cards since the Ghost Rare days to pass US$1,000 at TCGplayer market:</p>
<ul>
<li>{{card:695695}} (Battles of Legend: Glorious Gallery, June 2026): {{price:695695}}.</li>
<li>{{card:714655}} (Magnificent Monsters, September 2026): {{price:714655}}.</li>
<li>{{card:687313}} (Rarity Collection 5, April 2026): {{price:687313}}.</li>
<li>{{card:702385}} (Chaos Origins, July 2026): {{price:702385}}.</li>
<li>{{card:719866}} (Beyond the Brave, October 2026): {{price:719866}}.</li>
</ul>
<p><b>More of the set is worth something.</b> Magnificent Monsters has 26 cards at US$50 or more, Glorious Gallery 15, Rarity Collection 5 thirteen, Beyond the Brave twelve, Chaos Origins eleven. The Quarter Century era's best was eight. Part of that is the Starlight itself and part is that these sets also carry Quarter Century and Ultimate printings underneath it, so a set now has three premium tiers where it used to have one.</p>

<h2>What did not change</h2>
<p>The playable version of a card is cheap. Ash Blossom &amp; Joyous Spring has been reprinted in at least a dozen sets and its common and rare printings cost a dollar or two; the {{card:704968}} from Ultimate Tournament Pack 1 is {{price:704968}} because of the rarity, not the card. Format staples move on the ban list and on reprints, and the Starlight era has not changed that: the <a href="/blog/how-much-are-my-yu-gi-oh-cards-worth">card value guide</a> and the <a href="/blog/yu-gi-oh-1st-edition-vs-unlimited">1st Edition vs Unlimited</a> guide are still the right place to start for a deck. The <a href="/blog/most-expensive-yu-gi-oh-cards">most expensive Yu-Gi-Oh! cards</a> list shows where the four-figure prices sit today.</p>

<h2>Beyond the Brave right now</h2>
<p>The newest core set, released on 9 October, a month into its life:</p>
{{toplist:24815:12}}

<h2>What Magnificent Maestros is likely to do</h2>
<p><a href="/blog/yu-gi-oh-tcg-release-schedule-late-2026">Magnificent Maestros</a> releases on 13 November 2026, with Glorious Victors on 4 December. From the eight Starlight-era sets so far, this is the pattern, stated as a pattern rather than a forecast:</p>
<ol>
<li><b>The top card will be a Starlight, and it will list highest in its first week.</b> Every Starlight-era set's top card has been its Starlight, and every one has settled lower in the month after release as boxes were opened. Beyond the Brave's top Starlight is already below where it listed in October.</li>
<li><b>A core set settles at ten to fifteen cards worth US$50 or more.</b> Magnificent Monsters' 26 came from it being a "Monsters" set built around the game's signature characters; a regular core set has landed at eleven to twelve.</li>
<li><b>Beyond the Brave gives back value in November.</b> The set before a new release has lost value in its first full month of competition in each case we can measure, mostly in its Quarter Century and Secret tiers.</li>
<li><b>The old Quarter Century sets keep sliding.</b> With the anniversary over and the Starlight the new chase, the QCSR sets from 2024 have no new buyer coming for them. RA01 and RA02 are already at zero cards over US$50.</li>
</ol>
<p>What would break it: a Starlight of a signature monster in Magnificent Maestros, which would put the set in Magnificent Monsters' class rather than Beyond the Brave's, or a ban list that takes out the set's playable chase.</p>

<p><i>Data: TCGplayer market prices in YGO Compare's public export of 4 November 2026. A description of how prices have behaved, not investment advice.</i></p>
`,
  faq: [
    { q: "Are Starlight Rares worth more than Quarter Century Secret Rares?", a: "On our data, yes: the median Starlight Rare was US$22.29 at TCGplayer market on 4 November 2026 against US$11.14 for a Quarter Century Secret Rare, and the most expensive Starlights (Dragon Master Magia, Dark Magician the Pharaoh's Servant) are over US$1,000 while the most expensive QCSR is under US$500." },
    { q: "Which Yu-Gi-Oh! set has the most valuable cards right now?", a: "Magnificent Monsters (September 2026), with 26 cards at US$50 or more and a master-set value near US$8,000 at TCGplayer market. Quarter Century Bonanza is next with 28 cards over US$50 but a lower top end." },
    { q: "When is Magnificent Maestros released?", a: "13 November 2026, with Glorious Victors following on 4 December 2026." },
    { q: "Why are Ultimate Rares expensive again?", a: "Konami revived the rarity for the Ultimate Tournament Packs in July 2026, so every card in those packs is an Ultimate Rare of a tournament staple. Their median across our catalogue is US$18, second only to Starlights." },
  ],
};

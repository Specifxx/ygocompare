import type { Post } from "./types";

export const post: Post = {
  slug: "how-much-are-my-yu-gi-oh-cards-worth",
  title: "How much are my Yu-Gi-Oh! cards worth? A quick price check",
  description: "How to find what your Yu-Gi-Oh! cards are worth in a few minutes: read the set number, find the exact printing, check the edition and condition, and compare live prices.",
  date: "2026-10-26",
  keywords: ["how much are my yugioh cards worth", "yugioh card value", "yugioh price checker", "check yugioh card prices", "old yugioh cards worth"],
  html: `
<p>Most Yu-Gi-Oh! cards are worth a few cents. A small share are worth a lot, and it is often down to the exact printing. Here is how to sort them quickly.</p>

<h2>1. Read the set number</h2>
<p>Below the artwork on the right is a code like <b>RA01-EN008</b> or <b>LOB-001</b>. That code, not the card name, tells you which printing you have. Type the card name in the search box at the top of this site and pick the result whose number matches.</p>

<h2>2. Match the rarity</h2>
<p>One number can exist in several rarities. Compare your card's foil with our <a href="/blog/yu-gi-oh-rarities-explained">rarity guide</a> and open the matching page. A Quarter Century Secret Rare and a Super Rare of the same card can differ by a hundred times.</p>

<h2>3. Check the edition</h2>
<p>"1st Edition" printed below the artwork on the left can multiply the value of cards from older sets. See <a href="/blog/yu-gi-oh-1st-edition-vs-unlimited">1st Edition vs Unlimited</a>.</p>

<h2>4. Be honest about condition</h2>
<p>Our prices are for near-mint copies. Whitening on the edges, scratches, creases or a curled card all lower what a buyer pays. Graded copies are a separate market.</p>

<h2>5. Compare before you sell or buy</h2>
<p>Each card page shows TCGplayer's market price, the cheapest eBay listing and every store we track. Before you sell, put the price into the <a href="/tools/selling-fees">selling fee calculator</a> to see what you keep. To sort a big pile, start with the rarest cards: our <a href="/cards">card list</a> and <a href="/blog/most-expensive-yu-gi-oh-cards">most expensive cards</a> show where the money is.</p>
`,
  faq: [
    { q: "Are old Yu-Gi-Oh! cards worth money?", a: "Some are, especially near-mint 1st Edition copies of rare cards from the first sets. Most commons from any era are worth very little." },
    { q: "Where is the set number on a Yu-Gi-Oh! card?", a: "Just below the artwork on the right-hand side, for example LOB-EN001." },
  ],
};

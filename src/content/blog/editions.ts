import type { Post } from "./types";

export const post: Post = {
  slug: "yu-gi-oh-1st-edition-vs-unlimited",
  title: "Yu-Gi-Oh! 1st Edition vs Unlimited: how to tell, and why the price differs",
  description:
    "Where to find the 1st Edition mark on a Yu-Gi-Oh! card, what Unlimited and Limited Edition mean, and how much the edition changes a card's price.",
  date: "2026-10-26",
  keywords: ["yugioh 1st edition vs unlimited", "1st edition yugioh cards worth", "how to tell 1st edition yugioh", "limited edition yugioh", "unlimited edition yugioh"],
  html: `
<p>Every Yu-Gi-Oh! card from a booster set comes in one of a few editions, and for older sets the edition can change the price many times over.</p>

<h2>Where to look</h2>
<p>Look just below the artwork, on the left. A <b>1st Edition</b> card says "1st Edition" there. An <b>Unlimited</b> card has nothing printed in that spot. A <b>Limited Edition</b> card says "Limited Edition"; these come from tins, special packs and promotions rather than regular booster sets.</p>
<p>On the right, below the artwork, is the set number, for example <b>LOB-EN001</b>: the set code, a language code (EN for English) and the card's number in the set. English cards from the earliest sets use numbers without a language code (LOB-001), or "E" for some European prints.</p>

<h2>Why 1st Edition costs more</h2>
<ul>
<li>The 1st Edition print run comes first and is usually smaller. For early sets, near-mint 1st Edition copies are far scarcer than Unlimited ones.</li>
<li>For many modern sets, 1st Edition is effectively the only printing sold in booster packs, so the gap is small or absent.</li>
<li>Reprint sets like the 25th Anniversary editions of classic sets are distinct products with their own prices.</li>
</ul>

<h2>How our prices handle editions</h2>
<p>TCGplayer prices each edition separately, and the headline price on a card page is its cheapest edition. Store prices show the edition when the store states it, either in the title or in the condition options. When a store doesn't say, we don't guess. Check the listing before you buy if the edition matters to you.</p>
`,
  faq: [
    { q: "Is 1st Edition always worth more?", a: "For older sets, almost always. For recent sets where every booster pack is 1st Edition, the difference is often small." },
    { q: "What does Limited Edition mean on a Yu-Gi-Oh! card?", a: "It marks cards from tins, special packs and promotions, not from regular booster sets." },
  ],
};

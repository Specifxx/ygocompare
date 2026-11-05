import type { Post } from "./types";

export const post: Post = {
  slug: "how-to-spot-fake-yu-gi-oh-cards",
  title: "How to spot fake Yu-Gi-Oh! cards: the hologram, the passcode and five more checks",
  description:
    "Counterfeit Yu-Gi-Oh! cards fail the same few checks: the Eye of Anubis hologram, the set code and passcode, the foil, the back, the text and the price. How to run each in under a minute.",
  date: "2026-11-05",
  keywords: ["fake yugioh cards", "how to spot fake yugioh cards", "counterfeit yugioh", "yugioh hologram real or fake", "are my yugioh cards real", "fake yugioh cards vs real"],
  image: { src: "/blog/how-to-spot-fake-yu-gi-oh-cards.jpg", alt: "How to spot fake Yu-Gi-Oh! cards: the seven checks" },
  html: `
<p>Yu-Gi-Oh! has been faked for longer than most players have been alive, and the fakes have improved. The crude ones (orange backs, "Yu-Gi-Oh" without the exclamation mark, a Blue-Eyes with 3,000 DEF) are still around, but the ones that cost people money are the Quarter Century and Starlight "reprints" that look right in a photo. These are the checks that catch them, in the order that costs you least effort.</p>

<h2>Which cards get faked</h2>
<p>The expensive ones, and the current top of the market is here, rebuilt every morning from TCGplayer's market price. A listing for any of these at a fraction of the Market figure is a fake until proven otherwise.</p>
{{topall:10}}
<p>The longer list is on <a href="/blog/most-expensive-yu-gi-oh-cards">the most expensive Yu-Gi-Oh! cards</a>. Counterfeiters also target mid-priced staples in Secret and Ultra Rare, because a US$40 card sells with less scrutiny than a US$400 one.</p>

<h2>1. The Eye of Anubis hologram</h2>
<p>Every real card printed for the TCG has a small square holographic foil stamp in the bottom-right corner of the front: the Eye of Anubis. It is <b>silver</b> on 1st Edition and Unlimited cards and <b>gold</b> on Limited Edition cards (promos and some special sets). Tilt it: the image inside the square shifts and shows depth. On a fake the square is often printed flat, a plain silver blob with no image, or a sticker with a visible edge, or the wrong colour for the edition printed on the card. A card with no stamp at all is either a fake or a very old Japanese OCG card, which has different anti-counterfeit features and is a different product.</p>

<h2>2. The set code and the passcode</h2>
<p>Under the artwork on the right is the set code, such as <b>RA04-EN033</b>; in the bottom-left corner is the eight-digit passcode. Both must match a real printing. Search the card name on this site and open the printing whose number matches: if the set code does not exist in that set, or the rarity on the card was never printed with that code, it is fake. Konami's official card database lists every passcode. Counterfeit "sets" are full of Secret Rares and Starlight Rares that were only ever printed in a lower rarity, and of codes that do not exist.</p>

<h2>3. The foil must match the rarity</h2>
<p>Each rarity has a specific finish, described in our <a href="/blog/yu-gi-oh-rarities-explained">rarities guide</a>: an Ultra Rare has gold foil on the name and holographic artwork; a Secret Rare has a silver, rainbow-flecked name with a diagonal pattern across the artwork; Quarter Century Secret Rares add the 25th-anniversary stamp and a foil treatment across the card. Fakes get this wrong in two directions: a flat rainbow sheen over the entire card, text and borders included, or a "Secret Rare" whose name is plain gold. If the finish does not match the rarity for that set code, stop there.</p>

<h2>4. The back</h2>
<p>The back of every real TCG card is the same: the brown-and-orange vortex, a dark border, and the KONAMI logo at the bottom. Fakes are usually lighter, more orange, slightly blurred or off-centre, and the logo is often printed in the wrong weight. Compare it against a common you pulled from a pack yourself. The oldest fakes are the easiest here: an orange, washed-out back is never real.</p>

<h2>5. The text</h2>
<p>Read it. Real cards are set in consistent fonts with exact spacing; fakes use a near-match font that is slightly too bold or too thin, lose the accents and apostrophes, and misspell card names or effect text. Check the copyright line at the very bottom (<b>©1996 KAZUKI TAKAHASHI</b>), the level stars (the right number, evenly spaced) and the ATK/DEF against the official figures. A Spell card with a Monster frame, or a Link monster with a level, is a fake.</p>

<h2>6. The stock and the light test</h2>
<p>A real card is dense and stiff. Hold it in front of a bright light: it should barely glow through, and the printing on the back should not show through the front. Many fakes are thin and let light straight through, and some are noticeably glossier or have a laminated, plastic feel. Sizes vary on fakes too; sleeve it with a real card and compare.</p>

<h2>7. The price and the seller</h2>
<p>Counterfeiters price to sell. Every card page here shows TCGplayer's market price, each store we track and the eBay listings for that exact printing, so you can judge a price in seconds. A Starlight Rare at a third of market, a seller who happens to have every chase card in the game in mint condition, stock photos only, or shipping from a country the TCG is not distributed in: each is a reason to walk away. Buy from <a href="/stores">the stores we list</a> or from sellers with a long record of card sales and photos of the actual card.</p>

<h2>If you already have one</h2>
<p>Marketplaces refund counterfeits. Open a case with photos next to a real card, pointing to the hologram and the set code. Do not pass it on, and do not sell it as a "replica": a fake in a trade or a sale is fraud, whatever the listing calls it.</p>
`,
  faq: [
    { q: "Do all real Yu-Gi-Oh! cards have the hologram?", a: "Every TCG card does: the square Eye of Anubis foil in the bottom-right corner of the front, silver for 1st Edition and Unlimited, gold for Limited Edition. Old Japanese OCG cards use different features." },
    { q: "What is the passcode on a Yu-Gi-Oh! card?", a: "The eight-digit number in the bottom-left corner of the front. Every real card's passcode is listed in Konami's card database; a fake often has a number that belongs to a different card or to no card at all." },
    { q: "Are orange-back Yu-Gi-Oh! cards fake?", a: "Yes. Real TCG cards have the brown vortex back with the KONAMI logo. A bright orange, washed-out back is the oldest kind of counterfeit." },
    { q: "Can a Secret Rare be fake even if it looks holographic?", a: "Yes. Fakes often cover the whole card in a flat rainbow sheen, including the text and borders. A real Secret Rare has the rainbow effect on the name and a diagonal pattern on the artwork only." },
  ],
};

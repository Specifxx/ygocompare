import type { Post } from "./types";

export const post: Post = {
  slug: "yu-gi-oh-rarities-explained",
  title: "Yu-Gi-Oh! rarities explained: from Common to Quarter Century Secret Rare",
  description:
    "How to tell every Yu-Gi-Oh! TCG rarity apart (Rare, Super, Ultra, Secret, Ultimate, Ghost, Starlight, Collector's, Platinum and Quarter Century Secret Rare) and what each is worth.",
  date: "2026-10-26",
  keywords: ["yugioh rarities", "yugioh rarity guide", "quarter century secret rare", "starlight rare yugioh", "how to tell yugioh rarity", "ghost rare"],
  html: `
<p>In Yu-Gi-Oh! the same card is often printed in several rarities, sometimes in the same set under the same set number. The rarity is shown by the foil on the card's name and artwork, and it is often the biggest single factor in the price.</p>

<h2>How to read the rarity</h2>
<ul>
<li><b>Common</b>: no foil anywhere. The name is printed in plain black or white.</li>
<li><b>Rare</b>: the card name is in silver foil; the artwork is not foil.</li>
<li><b>Super Rare</b>: the artwork is holofoil; the name is plain.</li>
<li><b>Ultra Rare</b>: gold foil name and holofoil artwork.</li>
<li><b>Secret Rare</b>: a rainbow foil name and a diagonally patterned foil artwork.</li>
<li><b>Ultimate Rare</b>: the artwork, attribute and border are embossed, so you can feel the relief.</li>
<li><b>Ghost Rare</b>: the artwork is a pale, ghostly hologram that changes with the light.</li>
<li><b>Collector's Rare</b>: a textured foil across the artwork, with a foil name.</li>
<li><b>Starlight Rare</b>: the whole card, border included, is covered in a glittering foil pattern. Usually one or two per box at most, and among the most valuable printings in any modern set.</li>
<li><b>Platinum Secret Rare</b> and <b>Prismatic Secret Rare</b>: Secret Rare variants with a silver (Platinum) or prismatic foil treatment, seen mostly in special sets such as the Rarity Collections and Mega Tins.</li>
<li><b>Quarter Century Secret Rare</b>: a Secret Rare with a 25th-anniversary stamp, from the anniversary sets onward. Often the most expensive printing of a staple.</li>
</ul>

<h2>The same number, several rarities</h2>
<p>Sets like the Rarity Collections print each card in several rarities with the same set number (for example RA01-EN008). On TCGplayer and on our card pages each rarity is its own product, so the page you open is for one exact printing. Our store matching works the same way: a store listing that names a different rarity is never shown as a price for this one.</p>

<h2>Prices by rarity</h2>
<p>Browse every card of a rarity, most valuable first: <a href="/cards/rarity/quarter-century-secret-rare">Quarter Century Secret Rare</a>, <a href="/cards/rarity/starlight-rare">Starlight Rare</a>, <a href="/cards/rarity/ghost-rare">Ghost Rare</a>, <a href="/cards/rarity/collectors-rare">Collector's Rare</a>, <a href="/cards/rarity/secret-rare">Secret Rare</a> and <a href="/cards/rarity/ultra-rare">Ultra Rare</a>.</p>
<h3>The five most valuable Ghost Rares today</h3>
{{rarity:Ghost Rare:5}}
`,
  faq: [
    { q: "What is the rarest Yu-Gi-Oh! rarity?", a: "In modern booster sets, Starlight Rares and Quarter Century Secret Rares are the hardest to pull. Older Ghost Rares and tournament prize cards are scarce too." },
    { q: "How do I tell a Secret Rare from an Ultra Rare?", a: "An Ultra Rare has a gold foil name. A Secret Rare's name is rainbow foil and its artwork has a diagonal foil pattern." },
  ],
};

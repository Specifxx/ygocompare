import type { Post } from "./types";

export const post: Post = {
  slug: "gundam-card-game-ban-list",
  title: "Gundam Card Game ban list explained (October 2026)",
  description:
    "The current Gundam Card Game banned and restricted list: Anksha banned, Corsica Base restricted to two, the new banned pairs, and how often Bandai updates it.",
  date: "2026-10-25",
  keywords: ["gundam card game ban list", "gundam card game banned cards", "anksha banned", "corsica base restricted", "gundam card game banned pairs"],
  html: `
<p>Bandai keeps one banned and restricted list for the Gundam Card Game and revises it roughly every six months, usually when a new booster set releases. Here is what is on it as of October 2026 and why. Always check the <a href="https://www.gundam-gcg.com/en/news/" rel="noopener nofollow">official news page</a> before a tournament.</p>

<h2>Timeline</h2>
<ul>
<li><b>1 April 2026 — the first list.</b> {{card:641483}} (ST02-016) was <b>restricted to 2 copies</b> per deck.</li>
<li><b>24 July 2026 — the first ban.</b> {{card:643169}} (GD01-020) was <b>banned</b>, which Bandai tied to the dominance of Blue/Purple decks. The same update introduced <b>banned pairs</b>: two cards that are each legal but may not be in the same deck. Examples include Amuro Ray with Mikazuki Augus, and Guntank with M1 Astray Shrike.</li>
<li><b>25 September 2026 — revised again</b> alongside the ST11–ST14 starter decks.</li>
</ul>

<h2>What banned pairs mean</h2>
<p>A banned pair targets a combination rather than a card. You can still play Amuro Ray, and you can still play Mikazuki Augus, just not both in one deck. It lets Bandai break up a dominant engine without invalidating a whole colour's collection.</p>

<h2>What a ban does to prices</h2>
<p>A ban usually drops a card's price within days. Anksha fell after July's announcement, while cards that slot into the decks that replace it tend to climb. A card's page here charts its price history, so you can see the effect directly: {{card:643169}} is {{price:643169}} today.</p>
<p>Track it on <a href="/movers">price movers</a>, or bookmark the card pages you expect to move when the next list lands with Blazing Fist (GD07) in January 2027.</p>
`,
  faq: [
    { q: "Is Anksha banned in the Gundam Card Game?", a: "Yes. Anksha (GD01-020) was banned from 24 July 2026." },
    { q: "How many Corsica Base can I play?", a: "Two. Corsica Base (ST02-016) has been restricted to 2 copies since 1 April 2026." },
    { q: "What is a banned pair?", a: "Two cards that are each legal but cannot be played in the same deck, introduced in the July 2026 update." },
  ],
};

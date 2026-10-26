// Copy for /preorders (facts: research/news.md, 2026-10-24).
export const PREORDER_COPY: {
  intro: string;
  facts: { label: string; value: string }[];
  faq: { q: string; a: string }[];
} = {
  intro:
    "Every store taking pre-orders for the next Gundam Card Game sets, compared cheapest first in your currency. <b>Stardust Trails (GD06)</b> — ZZ Gundam and 0083 Stardust Memory — releases on 30 October 2026; <b>Blazing Fist (GD07)</b> follows on 29 January 2027.",
  facts: [
    { label: "GD06 release", value: "30 October 2026" },
    { label: "Pack MSRP", value: "US$4.99 / £3.75" },
    { label: "Legend Rares", value: "12 (+ LR+ / LR++ parallels)" },
    { label: "Next after", value: "GD07 Blazing Fist · 29 Jan 2027" },
  ],
  faq: [
    { q: "When does GD06 Stardust Trails release?", a: "30 October 2026, with pre-orders open at most stores now." },
    { q: "How much is a Stardust Trails booster box?", a: "Store pre-orders have run from about $150 to $190; the table above shows every store's current price, cheapest first." },
    { q: "When is GD07 Blazing Fist?", a: "29 January 2027 per TCGplayer's listing. Some stores already take pre-orders." },
  ],
};

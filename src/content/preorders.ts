import type { PreorderCopy } from "@/lib/site-types";

// Copy for /preorders and /preorders/<set slug> (facts: Konami's announcements
// as reported by ICv2, checked 2026-10-26; see the release-schedule blog post
// for links). A fact we can't source is left out; a set without copy here
// still gets a page from its data.
export const PREORDER_COPY: PreorderCopy = {
  intro:
    "Every upcoming Yu-Gi-Oh! TCG release, each with its own page comparing every store's booster box, tuckbox and sealed pre-order price, cheapest first in your currency. Sets stay listed for six weeks after release, when the most people shop for a box.",
  faq: [
    { q: "When do Yu-Gi-Oh! pre-orders open?", a: "Most stores list a new set a few weeks to two months before release. Each release page adds a store as soon as its listing appears, and refreshes every store daily." },
    { q: "Is it cheaper to pre-order or to wait for release?", a: "Booster boxes often sit near MSRP during pre-order; singles are usually cheapest a few weeks after release. If you want to open product, pre-ordering at a good price is reasonable." },
    { q: "Do the prices include shipping?", a: "No. Every price is the store's item price before shipping, in the store's own currency, so compare the stores in your market." },
  ],
  sets: {
    "magnificent-maestros": {
      intro:
        "Every store taking pre-orders for <b>Magnificent Maestros</b>, compared cheapest first in your currency. It releases on 13 November 2026 in tuckboxes of three 5-card packs, like Magnificent Monsters.",
      facts: [
        { label: "Release", value: "13 November 2026" },
        { label: "Format", value: "Tuckbox · 3 packs of 5 cards" },
        { label: "Per pack", value: "3 Secret Rares" },
        { label: "Grand Master Rares", value: "Numbered #001 to #100" },
      ],
      faq: [
        { q: "When does Magnificent Maestros release?", a: "13 November 2026. Each tuckbox holds three 5-card packs, with three Secret Rares per pack that can be upgraded to Starlight Rares." },
        { q: "What is in Magnificent Maestros?", a: "18 anime-style reprints of cards used by TV-series characters including Seto Kaiba, Zane Truesdale and Jack Atlas, which also appear as serial-numbered Grand Master Rares (#001 to #100); 21 new cards for Toon, Witchcrafter and Unchained decks; and 24 extended-art cards." },
      ],
    },
    "glorious-victors": {
      intro:
        "Every store taking pre-orders for <b>Glorious Victors</b>, the 60-card Yu-Gi-Oh! booster set out on 4 December 2026, compared cheapest first in your currency.",
      facts: [
        { label: "Release", value: "4 December 2026" },
        { label: "Cards", value: "60 + 15 Collector's Rares" },
        { label: "Pack", value: "7 cards · US$4.49 MSRP" },
        { label: "New", value: "Zenet, Trirealm Rift" },
      ],
      faq: [
        { q: "When does Glorious Victors release?", a: "4 December 2026. It is a 60-card set with 7-card packs at a suggested US$4.49." },
        { q: "What rarities are in Glorious Victors?", a: "3 Secret Rares, 10 Ultra Rares, 10 Super Rares and 37 Rares, plus 15 Collector's Rares and 10 Starlight Rares. It introduces the Zenet strategy (Normal Monsters in the Graveyard supporting Ritual Monsters) and Trirealm Rift monsters." },
      ],
    },
  },
};

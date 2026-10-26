// Copy for /preorders (facts: Konami's announcements as reported by ICv2,
// checked 2026-10-26; see the release-schedule blog post for links).
export const PREORDER_COPY: {
  intro: string;
  facts: { label: string; value: string }[];
  faq: { q: string; a: string }[];
} = {
  intro:
    "Every store taking pre-orders for the next Yu-Gi-Oh! TCG releases, compared cheapest first in your currency. <b>Magnificent Maestros</b> releases on 13 November 2026; <b>Glorious Victors</b> follows on 4 December 2026.",
  facts: [
    { label: "Magnificent Maestros", value: "13 November 2026" },
    { label: "Glorious Victors", value: "4 December 2026" },
    { label: "Glorious Victors pack", value: "7 cards · US$4.49 MSRP" },
    { label: "Maestros box", value: "3 packs of 5 cards" },
  ],
  faq: [
    { q: "When does Magnificent Maestros release?", a: "13 November 2026. Each tuckbox holds three 5-card packs, with three Secret Rares per pack that can be upgraded to Starlight Rares." },
    { q: "When does Glorious Victors release?", a: "4 December 2026. It is a 60-card set with 7-card packs at a suggested US$4.49." },
    { q: "Where is it cheapest to pre-order?", a: "The table above lists every store's current pre-order price, cheapest first, refreshed daily." },
  ],
};

import { test } from "node:test";
import assert from "node:assert/strict";
import { isGradedVariant, pickVariant, type ShopifyProduct } from "@/lib/import/shopify";

const product = (variants: { title: string; price: string; available: boolean }[]): ShopifyProduct =>
  ({ id: 1, title: "Card", handle: "card", tags: [], product_type: "", variants: variants.map((v, i) => ({ id: i + 1, ...v })) }) as unknown as ShopifyProduct;

test("a graded slab variant never prices the raw card (OP Compare, 2026-11-19)", () => {
  // Real variants of one store product: the cheaper slab used to win.
  const v = pickVariant(product([
    { title: "Graded - Beckett 9.5", price: "115.00", available: true },
    { title: "Near Mint", price: "344.00", available: true },
  ]));
  assert.equal(v?.title, "Near Mint");
  assert.equal(pickVariant(product([{ title: "PSA 10", price: "50.00", available: true }])), null);
  for (const t of ["Graded - Beckett 9.5", "PSA 10", "BGS 9.5 Black Label", "CGC 9", "Slab", "TAG 10", "SGC 10", "ACE Grading 10"]) assert.ok(isGradedVariant(t), t);
  for (const t of ["Near Mint", "Lightly Played", "Default Title", "Near Mint / Foil", "1st Edition"]) assert.ok(!isGradedVariant(t), t);
});

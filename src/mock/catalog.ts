import type { Product } from "../lib/types";

/**
 * Stand-in catalog so we can build & style the whole shop before wiring Square.
 * Phase 3 replaces this with a real Square Catalog fetch at build time — the
 * component API stays identical, so nothing downstream changes.
 */
export const mockCatalog: Product[] = [
  {
    id: "mock_1",
    slug: "signed-chapbook",
    name: "Signed Chapbook",
    description: "Hand-numbered, signed by the author.",
    price: { amount: 2000, currency: "USD" },
    inStock: true,
    quantity: 12,
  },
  {
    id: "mock_2",
    slug: "one-of-one-print",
    name: "One-of-One Print",
    description: "A single archival print. When it's gone, it's gone.",
    price: { amount: 6500, currency: "USD" },
    inStock: true,
    quantity: 1,
  },
  {
    id: "mock_3",
    slug: "risograph-zine",
    name: "Risograph Zine",
    description: "Two-color riso, 24 pages.",
    price: { amount: 1500, currency: "USD" },
    inStock: false,
    quantity: 0,
  },
];

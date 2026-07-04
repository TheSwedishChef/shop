// Public API of the `shop` package.
export { default as ProductCard } from "./components/ProductCard.astro";
export { default as ProductGrid } from "./components/ProductGrid.astro";

export * from "./lib/types";
export { formatMoney } from "./lib/money";
export { mockCatalog } from "./mock/catalog";

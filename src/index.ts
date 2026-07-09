// Public API of the `shop` package (types + utilities + data).
// Astro components are imported via subpath, e.g.:
//   import ProductGrid from "@cl/shop/components/ProductGrid.astro";
export * from "./lib/types";
export { formatMoney } from "./lib/money";
export { mockCatalog } from "./mock/catalog";
export {
  getCommerce,
  getInventoryCounts,
  createCheckoutLink,
  configFromEnv,
  type SquareConfig,
  type Commerce,
  type CheckoutLineItem,
  type CheckoutOptions,
} from "./lib/square";

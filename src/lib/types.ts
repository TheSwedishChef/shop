/** Money is stored in the currency's minor units (e.g. cents) to avoid float math. */
export interface Money {
  amount: number;
  currency: string; // ISO 4217, e.g. "USD"
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface Product {
  id: string;            // Square catalog object id
  slug: string;          // URL segment, e.g. "signed-chapbook"
  name: string;
  description?: string;
  price: Money;
  image?: ProductImage;
  /**
   * Build-time stock snapshot. The live availability island re-checks Square at
   * request time and overrides this, so a page can go "Sold out" without a rebuild.
   */
  inStock: boolean;
  /** null = inventory not tracked (unlimited); a number = tracked quantity. */
  quantity?: number | null;
}

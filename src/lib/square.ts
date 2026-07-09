// Square client for the shop engine. Uses plain `fetch` (no SDK) so the same code
// runs at Astro build time (Node) and in Cloudflare Pages Functions (Workers).
//
// Two source-of-truth split: Square owns *commerce* (price, stock, buy_url); each
// site owns *presentation* (images, copy, specs). They merge on SKU downstream.
import type { Money } from "./types";

export interface SquareConfig {
  token: string;
  locationId: string;
  environment?: "sandbox" | "production";
  version?: string;
}

/** Commerce truth for one sellable variation, keyed by SKU downstream. */
export interface Commerce {
  id: string;          // catalog ITEM id
  variationId: string; // catalog ITEM_VARIATION id — what checkout line items reference
  sku: string;
  name: string;
  description?: string; // rich text (description_html)
  price: Money;
  buyUrl?: string;      // external fulfillment link, if set
  inStock: boolean;
  quantity: number | null; // null = not tracked
}

const DEFAULT_VERSION = "2025-05-21";

function baseUrl(cfg: SquareConfig): string {
  return cfg.environment === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

/** Build a config from environment variables (Node build or Workers `env`). */
export function configFromEnv(env: Record<string, string | undefined> = process.env): SquareConfig {
  const token = env.SQUARE_ACCESS_TOKEN;
  const locationId = env.SQUARE_LOCATION_ID;
  if (!token || !locationId) {
    throw new Error("Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID");
  }
  return {
    token,
    locationId,
    environment: (env.SQUARE_ENV as "sandbox" | "production") || "sandbox",
    version: env.SQUARE_VERSION || DEFAULT_VERSION,
  };
}

async function sq<T = any>(cfg: SquareConfig, path: string, body?: unknown, method = "POST"): Promise<T> {
  const res = await fetch(baseUrl(cfg) + path, {
    method,
    headers: {
      "Square-Version": cfg.version || DEFAULT_VERSION,
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Square ${path} ${res.status}: ${JSON.stringify(json)}`);
  return json as T;
}

/** Pull the "Buy URL" custom attribute value off a catalog item, if present. */
function readBuyUrl(item: any): string | undefined {
  const values = item?.custom_attribute_values;
  if (!values) return undefined;
  for (const v of Object.values<any>(values)) {
    if (v?.key === "buy_url" || v?.name === "Buy URL") {
      const s = (v.string_value ?? "").trim();
      return s || undefined;
    }
  }
  return undefined;
}

/** Fetch every active item + variation as commerce records, with live inventory merged in. */
export async function getCommerce(cfg: SquareConfig): Promise<Commerce[]> {
  const search = await sq(cfg, "/v2/catalog/search", {
    object_types: ["ITEM"],
    include_deleted_objects: false,
    include_related_objects: false,
  });
  const items: any[] = search.objects ?? [];

  const records: Commerce[] = [];
  for (const item of items) {
    const data = item.item_data ?? {};
    const buyUrl = readBuyUrl(item);
    for (const variation of data.variations ?? []) {
      const vd = variation.item_variation_data ?? {};
      if (!vd.sku) continue; // SKU is our join key; skip anything without one
      const price = vd.price_money;
      records.push({
        id: item.id,
        variationId: variation.id,
        sku: vd.sku,
        name: data.name ?? "",
        description: data.description_html ?? data.description ?? undefined,
        price: price ? { amount: price.amount, currency: price.currency } : { amount: 0, currency: "USD" },
        buyUrl,
        inStock: true, // provisional; corrected by inventory below
        quantity: null,
      });
    }
  }

  // Merge inventory counts for tracked variations.
  const variationIds = records.map((r) => r.variationId);
  if (variationIds.length) {
    const counts = await getInventoryCounts(cfg, variationIds);
    for (const r of records) {
      if (r.variationId in counts) {
        r.quantity = counts[r.variationId];
        r.inStock = counts[r.variationId] > 0;
      }
    }
  }
  return records;
}

/** Return a map of variationId -> in-stock quantity at the configured location. */
export async function getInventoryCounts(
  cfg: SquareConfig,
  variationIds: string[],
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (!variationIds.length) return out;
  const res = await sq(cfg, "/v2/inventory/counts/batch-retrieve", {
    catalog_object_ids: variationIds,
    location_ids: [cfg.locationId],
    states: ["IN_STOCK"],
  });
  for (const c of res.counts ?? []) {
    if (c.state === "IN_STOCK") out[c.catalog_object_id] = Number(c.quantity ?? 0);
  }
  return out;
}

export interface CheckoutLineItem {
  variationId: string;
  quantity: number;
}

export interface CheckoutOptions {
  lineItems: CheckoutLineItem[];
  redirectUrl?: string;
  /** Shipping fee in minor units. 0 = free. Omit to not collect shipping. */
  shippingCents?: number;
  askForShippingAddress?: boolean;
  merchantSupportEmail?: string;
}

/** Create a Square-hosted checkout page for the given cart; returns its URL. */
export async function createCheckoutLink(cfg: SquareConfig, opts: CheckoutOptions): Promise<string> {
  const checkout_options: Record<string, unknown> = {
    ask_for_shipping_address: opts.askForShippingAddress ?? true,
  };
  if (opts.redirectUrl) checkout_options.redirect_url = opts.redirectUrl;
  if (opts.merchantSupportEmail) checkout_options.merchant_support_email = opts.merchantSupportEmail;
  if (opts.shippingCents != null) {
    checkout_options.shipping_fee = {
      name: opts.shippingCents === 0 ? "Shipping (free)" : "Shipping",
      charge: { amount: opts.shippingCents, currency: "USD" },
    };
  }

  const res = await sq(cfg, "/v2/online-checkout/payment-links", {
    idempotency_key: crypto.randomUUID(),
    order: {
      location_id: cfg.locationId,
      line_items: opts.lineItems.map((li) => ({
        catalog_object_id: li.variationId,
        quantity: String(li.quantity),
      })),
    },
    checkout_options,
  });
  return res.payment_link.url as string;
}

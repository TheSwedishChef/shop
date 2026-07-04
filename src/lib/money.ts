import type { Money } from "./types";

/** Format minor-unit money for display, e.g. { amount: 2000, currency: "USD" } -> "$20.00". */
export function formatMoney(money: Money, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
  }).format(money.amount / 100);
}

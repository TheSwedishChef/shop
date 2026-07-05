import type { Money } from "./types";

/** A line in the client-side cart. Persisted in localStorage; no backend needed. */
export interface CartLine {
  id: string;
  slug: string;
  name: string;
  href: string; // product page URL, so the cart can link back
  price: Money;
  image?: string;
  qty: number;
}

const KEY = "cl-cart-v1";
export const CART_EVENT = "cart:change";

function read(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]): void {
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent<CartLine[]>(CART_EVENT, { detail: lines }));
}

export function getCart(): CartLine[] {
  return read();
}

export function addItem(line: Omit<CartLine, "qty">, qty = 1): void {
  const lines = read();
  const existing = lines.find((l) => l.id === line.id);
  if (existing) existing.qty += qty;
  else lines.push({ ...line, qty });
  write(lines);
}

export function setQty(id: string, qty: number): void {
  let lines = read();
  if (qty <= 0) lines = lines.filter((l) => l.id !== id);
  else {
    const line = lines.find((l) => l.id === id);
    if (line) line.qty = qty;
  }
  write(lines);
}

export function removeItem(id: string): void {
  setQty(id, 0);
}

export function clear(): void {
  write([]);
}

export function count(): number {
  return read().reduce((n, l) => n + l.qty, 0);
}

export function subtotal(): Money {
  const lines = read();
  return {
    amount: lines.reduce((s, l) => s + l.price.amount * l.qty, 0),
    currency: lines[0]?.price.currency ?? "USD",
  };
}

import { formatPKR } from "./format";
import type { OrderItem } from "./types";

// Accepts 03xx..., +92 3xx..., 923xx... and returns digits for wa.me.
export function toWaNumber(input: string) {
  let d = (input || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "92" + d.slice(1);
  return d;
}

export function waLink(number: string, text: string) {
  return `https://wa.me/${toWaNumber(number)}?text=${encodeURIComponent(text)}`;
}

export function productWaMessage(name: string, price: number, url: string) {
  return `Assalam o Alaikum, I would like to order:\n${name} (${formatPKR(price)})\n${url}`;
}

export function orderWaMessage(args: {
  ref: string;
  name: string;
  phone: string;
  address: string;
  city?: string;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
}) {
  const lines = args.items.map(
    (i) => `- ${i.name}${i.size ? ` (size ${i.size})` : ""} x${i.qty}: ${formatPKR(i.unit_price * i.qty)}`,
  );
  return [
    `Assalam o Alaikum, new order ${args.ref}`,
    "",
    ...lines,
    "",
    `Subtotal: ${formatPKR(args.subtotal)}`,
    `Delivery: ${args.delivery === 0 ? "Free" : formatPKR(args.delivery)}`,
    `Total (Cash on Delivery): ${formatPKR(args.total)}`,
    "",
    `Name: ${args.name}`,
    `Phone: ${args.phone}`,
    `Address: ${args.address}${args.city ? `, ${args.city}` : ""}`,
  ].join("\n");
}

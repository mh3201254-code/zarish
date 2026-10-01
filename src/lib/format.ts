export function formatPKR(value: number) {
  return "PKR " + Math.round(value).toLocaleString("en-PK");
}

export function effectivePrice(p: { price: number; sale_price: number | null }) {
  return p.sale_price ?? p.price;
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Everything from the database is rendered through React (auto-escaped).
// clean() is an extra layer: it strips tags and control characters so odd
// content can never reach attributes, JSON-LD or wa.me links.
export function clean(value: unknown, max = 2000): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function safeUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}

export function jsonLd(data: unknown) {
  // Prevents "</script>" breakouts inside the JSON-LD block.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Basic client-side throttle. The database enforces the real limit
// (5 per phone/email per hour, see the orders/messages triggers).
export function throttle(key: string, minMs = 20000): boolean {
  try {
    const now = Date.now();
    const last = Number(localStorage.getItem(key) || 0);
    if (now - last < minMs) return false;
    localStorage.setItem(key, String(now));
    return true;
  } catch {
    return true;
  }
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadSettings } from "./data";
import { demoSettings } from "./demo-data";
import type { Product, Settings } from "./types";
import { effectivePrice } from "./format";

/* ------------------------------------------------------------- settings */
const SettingsCtx = createContext<Settings>(demoSettings);
export const useSettings = () => useContext(SettingsCtx);

/* ---------------------------------------------------------------- toasts */
type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastCtx = createContext<(text: string, tone?: "ok" | "error") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

/* ------------------------------------------------------------------ cart */
export type CartLine = {
  key: string;
  id: string;
  slug: string;
  name: string;
  unit_price: number;
  qty: number;
  size?: string;
  category_slug: string;
  image?: string;
};

type CartApi = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (p: Product, size?: string, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};
const CartCtx = createContext<CartApi | null>(null);
export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside provider");
  return c;
};

/* -------------------------------------------------------------- wishlist */
type WishApi = { ids: string[]; has: (id: string) => boolean; toggle: (id: string) => void };
const WishCtx = createContext<WishApi | null>(null);
export const useWishlist = () => {
  const c = useContext(WishCtx);
  if (!c) throw new Error("useWishlist outside provider");
  return c;
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(demoSettings);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ids, setIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readJSON<CartLine[]>("zarish_cart", []));
    setIds(readJSON<string[]>("zarish_wishlist", []));
    setHydrated(true);
    loadSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (hydrated) writeJSON("zarish_cart", lines);
  }, [lines, hydrated]);
  useEffect(() => {
    if (hydrated) writeJSON("zarish_wishlist", ids);
  }, [ids, hydrated]);

  const toast = useCallback((text: string, tone: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const cart = useMemo<CartApi>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.qty * l.unit_price, 0),
      open,
      setOpen,
      add: (p, size, qty = 1) => {
        const key = `${p.id}:${size ?? ""}`;
        setLines((prev) => {
          const found = prev.find((l) => l.key === key);
          if (found) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + qty) } : l));
          return [
            ...prev,
            {
              key,
              id: p.id,
              slug: p.slug,
              name: p.name,
              unit_price: effectivePrice(p),
              qty,
              size,
              category_slug: p.category_slug,
              image: p.images[0],
            },
          ];
        });
        setOpen(true);
      },
      setQty: (key, qty) =>
        setLines((prev) =>
          qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l)),
        ),
      remove: (key) => setLines((prev) => prev.filter((l) => l.key !== key)),
      clear: () => setLines([]),
    }),
    [lines, open],
  );

  const wish = useMemo<WishApi>(
    () => ({
      ids,
      has: (id) => ids.includes(id),
      toggle: (id) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    }),
    [ids],
  );

  return (
    <SettingsCtx.Provider value={settings}>
      <ToastCtx.Provider value={toast}>
        <CartCtx.Provider value={cart}>
          <WishCtx.Provider value={wish}>
            {children}
            <div className="pointer-events-none fixed bottom-4 left-1/2 z-[120] flex -translate-x-1/2 flex-col gap-2" role="status" aria-live="polite">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className={`pointer-events-auto rounded-full border px-5 py-2.5 text-sm shadow-lg backdrop-blur ${
                    t.tone === "error" ? "border-red-400/50 bg-red-950/90 text-red-100" : "border-gold/40 bg-surface/95 text-ivory"
                  }`}
                >
                  {t.text}
                </div>
              ))}
            </div>
          </WishCtx.Provider>
        </CartCtx.Provider>
      </ToastCtx.Provider>
    </SettingsCtx.Provider>
  );
}

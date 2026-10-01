"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBag, X, Check } from "lucide-react";
import { useCart, useSettings, useToast } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import { clean } from "@/lib/sanitize";
import { throttle } from "@/lib/ratelimit";
import { orderWaMessage, waLink } from "@/lib/whatsapp";
import ProductArt from "./ProductArt";
import Image from "next/image";
import type { OrderItem } from "@/lib/types";

type Done = { ref: string; link: string; saved: boolean };

export default function CartDrawer() {
  const cart = useCart();
  const settings = useSettings();
  const toast = useToast();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "", notes: "", company: "" });
  const panelRef = useRef<HTMLDivElement>(null);

  const delivery = Number(settings.delivery_charge) || 0;
  const freeAbove = Number(settings.free_delivery_above) || 0;
  const shipping = cart.lines.length === 0 || (freeAbove > 0 && cart.subtotal >= freeAbove) ? 0 : delivery;
  const total = cart.subtotal + shipping;

  useEffect(() => {
    if (!cart.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.setOpen(false);
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [cart.open, cart]);

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (form.company) return; // honeypot: bots fill this hidden field
    const name = clean(form.name, 120);
    const phone = clean(form.phone, 30);
    const address = clean(form.address, 400);
    if (name.length < 2 || !/^[0-9+][0-9 +()-]{6,24}$/.test(phone) || address.length < 6) {
      toast("Please enter your name, a valid phone number and your address", "error");
      return;
    }
    if (!throttle("zarish_last_order", 15000)) {
      toast("Please wait a few seconds before placing another order", "error");
      return;
    }
    setBusy(true);
    const items: OrderItem[] = cart.lines.map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      unit_price: l.unit_price,
      qty: l.qty,
      size: l.size,
    }));
    let ref = "ZR-" + crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
    let saved = false;
    let subtotal = cart.subtotal;
    let deliveryCharge = shipping;
    let totalFinal = total;
    const sb = getSupabase();
    if (sb) {
      const id = crypto.randomUUID();
      // Prices are recomputed by the database trigger, never trusted from here.
      const { error } = await sb.from("orders").insert({
        id,
        customer_name: name,
        phone,
        address,
        city: clean(form.city, 80),
        notes: clean(form.notes, 600),
        payment_method: "cod",
        items: items.map((i) => ({ id: i.id, qty: i.qty, size: i.size ?? "" })),
      });
      if (error) {
        toast("We could not save the order online. You can still send it on WhatsApp.", "error");
      } else {
        saved = true;
        ref = "ZR-" + id.replace(/-/g, "").slice(0, 6).toUpperCase();
      }
    }
    const link = waLink(
      settings.whatsapp_number,
      orderWaMessage({ ref, name, phone, address, city: clean(form.city, 80), items, subtotal, delivery: deliveryCharge, total: totalFinal }),
    );
    setBusy(false);
    setDone({ ref, link, saved });
    cart.clear();
    window.open(link, "_blank", "noopener,noreferrer");
  }

  const reset = () => {
    setDone(null);
    setStep("cart");
    cart.setOpen(false);
  };

  return (
    <AnimatePresence>
      {cart.open && (
        <motion.div className="fixed inset-0 z-[110]" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.button
            aria-label="Close cart"
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => cart.setOpen(false)}
          />
          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-surface outline-none"
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="text-3xl">{done ? "Order sent" : step === "cart" ? "Your cart" : "Delivery details"}</h2>
              <button onClick={() => cart.setOpen(false)} aria-label="Close cart" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2">
                <X size={20} />
              </button>
            </header>

            {done ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full border border-gold text-gold">
                  <Check />
                </span>
                <p className="text-2xl font-display">Thank you. Order {done.ref}</p>
                <p className="text-sm text-muted">
                  {done.saved ? "Your order is saved." : "Your order was not saved online."} Send the prefilled WhatsApp message to confirm it. You pay cash on delivery.
                </p>
                <a href={done.link} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                  Open WhatsApp
                </a>
                <button onClick={reset} className="text-sm text-muted underline underline-offset-4 hover:text-ivory">
                  Continue shopping
                </button>
              </div>
            ) : cart.lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <ShoppingBag className="text-gold" size={34} />
                <p className="font-display text-2xl">Your cart is empty</p>
                <p className="text-sm text-muted">Pick a piece from the shop and it will wait for you here.</p>
                <Link href="/shop/" onClick={() => cart.setOpen(false)} className="btn btn-gold">
                  Browse the shop
                </Link>
              </div>
            ) : step === "cart" ? (
              <>
                <ul className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                  {cart.lines.map((l) => (
                    <li key={l.key} className="flex gap-4">
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-line">
                        {l.image ? (
                          <Image src={l.image} alt={l.name} fill sizes="80px" className="object-cover" />
                        ) : (
                          <ProductArt category={l.category_slug} label={l.name} className="h-full w-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-display text-xl leading-tight">{l.name}</p>
                        {l.size && <p className="text-xs text-muted">Size {l.size}</p>}
                        <p className="mt-1 text-sm text-gold-soft">{formatPKR(l.unit_price)}</p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex items-center rounded-full border border-line">
                            <button aria-label={`Decrease quantity of ${l.name}`} onClick={() => cart.setQty(l.key, l.qty - 1)} className="grid h-9 w-9 place-items-center">
                              <Minus size={15} />
                            </button>
                            <span className="w-6 text-center text-sm" aria-live="polite">{l.qty}</span>
                            <button aria-label={`Increase quantity of ${l.name}`} onClick={() => cart.setQty(l.key, l.qty + 1)} className="grid h-9 w-9 place-items-center">
                              <Plus size={15} />
                            </button>
                          </div>
                          <button onClick={() => cart.remove(l.key)} className="text-xs text-muted underline underline-offset-4 hover:text-ivory">
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <footer className="space-y-3 border-t border-line px-6 py-5">
                  <Row label="Subtotal" value={formatPKR(cart.subtotal)} />
                  <Row label="Delivery" value={shipping === 0 ? "Free" : formatPKR(shipping)} />
                  <Row label="Total (cash on delivery)" value={formatPKR(total)} strong />
                  <button className="btn btn-gold w-full" onClick={() => setStep("checkout")}>
                    Checkout
                  </button>
                </footer>
              </>
            ) : (
              <form onSubmit={checkout} className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex-1 space-y-4 px-6 py-6">
                  <Field label="Full name">
                    <input required autoComplete="name" value={form.name} maxLength={120} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field label="Phone (WhatsApp)">
                    <input required inputMode="tel" autoComplete="tel" placeholder="03xx xxxxxxx" value={form.phone} maxLength={24} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </Field>
                  <Field label="City">
                    <input autoComplete="address-level2" value={form.city} maxLength={80} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </Field>
                  <Field label="Delivery address">
                    <textarea required rows={3} autoComplete="street-address" value={form.address} maxLength={400} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </Field>
                  <Field label="Notes (optional)">
                    <textarea rows={2} value={form.notes} maxLength={600} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </Field>
                  {/* Honeypot: hidden from people and screen readers */}
                  <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label>
                      Company
                      <input tabIndex={-1} autoComplete="off" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                    </label>
                  </div>
                </div>
                <footer className="space-y-3 border-t border-line px-6 py-5">
                  <Row label="Total (cash on delivery)" value={formatPKR(total)} strong />
                  <button type="submit" disabled={busy} className="btn btn-gold w-full">
                    {busy ? "Placing order" : "Place order and open WhatsApp"}
                  </button>
                  <button type="button" onClick={() => setStep("cart")} className="w-full text-center text-sm text-muted underline underline-offset-4 hover:text-ivory">
                    Back to cart
                  </button>
                </footer>
              </form>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between ${strong ? "text-lg" : "text-sm text-muted"}`}>
      <span>{label}</span>
      <span className={strong ? "font-display text-2xl text-gold-soft" : ""}>{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

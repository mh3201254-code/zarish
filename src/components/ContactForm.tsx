"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { clean } from "@/lib/sanitize";
import { throttle } from "@/lib/ratelimit";
import { useSettings, useToast } from "@/lib/store";
import { waLink } from "@/lib/whatsapp";

export function ContactForm() {
  const toast = useToast();
  const s = useSettings();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "", company: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.company) return; // honeypot
    const name = clean(f.name, 120);
    const message = clean(f.message, 2000);
    if (name.length < 2 || message.length < 5) {
      toast("Please add your name and a short message", "error");
      return;
    }
    if (!throttle("zarish_last_msg", 20000)) {
      toast("Please wait a moment before sending another message", "error");
      return;
    }
    setBusy(true);
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from("messages").insert({
        name,
        email: clean(f.email, 160),
        phone: clean(f.phone, 30),
        message,
      });
      if (error) {
        setBusy(false);
        toast("We could not send your message. Please try WhatsApp instead.", "error");
        return;
      }
    }
    setBusy(false);
    setSent(true);
    setF({ name: "", email: "", phone: "", message: "", company: "" });
  }

  if (sent) {
    return (
      <div className="border border-line bg-surface p-8">
        <p className="font-display text-3xl">Message received</p>
        <p className="mt-3 text-muted">
          Thank you. We reply within one working day. For a faster answer, message us on{" "}
          <a className="underline decoration-gold underline-offset-4" href={waLink(s.whatsapp_number, "Assalam o Alaikum")} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate={false}>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Your name</span>
        <input required autoComplete="name" maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Email (optional)</span>
          <input type="email" autoComplete="email" maxLength={160} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Phone (optional)</span>
          <input type="tel" autoComplete="tel" maxLength={30} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted">Message</span>
        <textarea required rows={5} maxLength={2000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
      </label>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input tabIndex={-1} autoComplete="off" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
        </label>
      </div>
      <button type="submit" disabled={busy} className="btn btn-gold">
        {busy ? "Sending" : "Send message"}
      </button>
    </form>
  );
}

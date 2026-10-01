"use client";

import { Plus } from "lucide-react";

const faqs = [
  { q: "How does ordering work?", a: "Add pieces to your cart and checkout. Your order is saved and a prefilled WhatsApp message opens so we can confirm it with you. You can also message us directly from any product page." },
  { q: "Do you deliver across Pakistan?", a: "Yes. Delivery takes 3 to 5 working days to major cities and up to 7 to smaller towns. Delivery is free above the amount shown in the announcement bar." },
  { q: "How do I pay?", a: "Cash on delivery. Please check the parcel with the rider before you pay." },
  { q: "What is your returns policy?", a: "If a piece arrives damaged or is not as described, message us within 48 hours with photos and we will arrange an exchange or refund." },
  { q: "How should I care for my jewellery?", a: "Keep it dry, put it on after perfume and makeup, and store each piece in its pouch. Wipe gently with a soft cloth." },
];

export default function Faq() {
  return (
    <div id="faq" className="divide-y divide-line border-y border-line">
      {faqs.map((f) => (
        <details key={f.q} className="group py-6">
          <summary className="flex list-none items-center justify-between gap-6 font-display text-2xl md:text-3xl [&::-webkit-details-marker]:hidden">
            {f.q}
            <Plus className="shrink-0 text-gold transition-transform duration-300 group-open:rotate-45" />
          </summary>
          <p className="mt-4 max-w-2xl text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

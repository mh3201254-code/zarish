"use client";

import { MessageCircle, Phone } from "lucide-react";
import { Instagram } from "@/components/icons";
import Faq from "@/components/Faq";
import { ContactForm } from "@/components/ContactForm";
import { useSettings } from "@/lib/store";
import { waLink } from "@/lib/whatsapp";

export default function ContactClient() {
  const s = useSettings();
  return (
    <div className="container-x pb-10 pt-16 md:pt-24">
      <h1 className="text-6xl md:text-8xl">Contact</h1>
      <div className="mt-14 grid gap-16 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="max-w-md text-muted md:text-lg">The fastest way to reach us is WhatsApp. We reply within one working day by message.</p>
          <ul className="mt-8 space-y-4">
            <li>
              <a href={waLink(s.whatsapp_number, "Assalam o Alaikum")} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                <MessageCircle size={18} /> Message on WhatsApp
              </a>
            </li>
            {s.phone && (
              <li className="flex items-center gap-3 text-muted">
                <Phone size={18} className="text-gold" /> {s.phone}
              </li>
            )}
            {s.instagram && (
              <li>
                <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted hover:text-ivory">
                  <Instagram size={18} className="text-gold" /> Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
        <ContactForm />
      </div>
      <section className="mt-[var(--space-6)]">
        <h2 className="mb-10 text-5xl md:text-7xl">Delivery, returns and care</h2>
        <Faq />
      </section>
    </div>
  );
}

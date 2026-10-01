import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact",
  description: "Message ZARISH on WhatsApp or send a note. Delivery, returns and care answers below.",
};

export default function Page() {
  return <ContactClient />;
}

import type { Metadata } from "next";
import Link from "next/link";
import { Reveal, KineticText } from "@/components/fx";

export const metadata: Metadata = {
  title: "About",
  description: "ZARISH makes heritage and bridal jewellery, finished by hand and delivered across Pakistan.",
};

export default function About() {
  return (
    <div className="container-x pb-10 pt-16 md:pt-24">
      <KineticText as="h1" text="Jewellery made slowly, for occasions that last" className="max-w-4xl text-6xl md:text-8xl" />
      <div className="mt-16 grid gap-14 md:grid-cols-2">
        <Reveal>
          <p className="font-display text-3xl leading-snug md:text-4xl">
            ZARISH began with one idea: a bridal set should look as good in ten years as it does on the wedding day.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="space-y-5 text-muted md:text-lg">
            <p>We design in traditional forms, such as kundan, jhumka and haar, and finish them with a modern eye for proportion, so pieces feel heritage without feeling heavy.</p>
            <p>Every product page states its metal, stone and weight. We photograph pieces as they are, and we take orders on WhatsApp so you can talk to a real person before you buy.</p>
            <p>Delivery is cash on delivery across Pakistan, so you can inspect your order before you pay.</p>
          </div>
        </Reveal>
      </div>
      <p className="mt-16 text-xs text-muted">Sample story: replace this text with your own brand history before launch.</p>
      <div className="mt-10 flex gap-3">
        <Link href="/shop/" className="btn btn-gold">Shop the collection</Link>
        <Link href="/contact/" className="btn btn-line">Talk to us</Link>
      </div>
    </div>
  );
}

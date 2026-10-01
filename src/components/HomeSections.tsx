"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Star } from "lucide-react";
import { Instagram } from "./icons";
import ProductCard from "./ProductCard";
import ProductArt from "./ProductArt";
import { KineticText, Marquee, NumberTicker, Reveal } from "./fx";
import { loadCatalog, type Catalog } from "@/lib/data";
import { useSettings } from "@/lib/store";

export function useCatalog() {
  const [data, setData] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadCatalog()
      .then((c) => alive && setData(c))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);
  return { data, error };
}

export function MarqueeBand() {
  return (
    <div className="border-y border-line py-7">
      <Marquee items={["Bridal sets", "22k gold plated", "Hand-set stones", "Cash on delivery", "Delivered across Pakistan", "Made to be kept"]} />
    </div>
  );
}

export function Featured() {
  const { data, error } = useCatalog();
  const items = data ? data.products.filter((p) => p.featured).slice(0, 4) : [];
  return (
    <section className="container-x pt-[var(--space-6)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <KineticText text="Pieces people ask for first" className="max-w-2xl text-5xl md:text-7xl" />
        <Link href="/shop/" className="btn btn-line">
          View all jewellery <ArrowRight size={16} />
        </Link>
      </div>
      {error && <p className="mt-10 text-muted">The collection could not load. Please refresh the page.</p>}
      <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
        {(data ? items : Array.from({ length: 4 })).map((p, i) =>
          p ? (
            <Reveal key={(p as { id: string }).id} delay={i * 0.08}>
              <ProductCard product={p as NonNullable<typeof items>[number]} />
            </Reveal>
          ) : (
            <div key={i} className="aspect-[4/5] animate-pulse border border-line bg-surface" aria-hidden />
          ),
        )}
      </div>
    </section>
  );
}

/* Horizontal-scroll collections gallery, pinned while it scrolls sideways. */
export function CollectionsGallery() {
  const { data } = useCatalog();
  const ref = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const on = () => setMobile(window.innerWidth < 768);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const cats = data?.categories ?? [];
  const n = Math.max(cats.length, 1);
  const cardVw = mobile ? 76 : 34;
  const gapVw = mobile ? 5 : 3;
  const shift = Math.max(0, n * cardVw + (n - 1) * gapVw + 10 - 100);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0vw", `-${shift}vw`]);

  if (!data) return <div className="h-40" aria-hidden />;

  return (
    <section ref={ref} aria-label="Collections" style={{ height: `${Math.max(220, 120 + n * 55)}vh` }} className="relative mt-[var(--space-6)]">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="container-x mb-10 flex items-end justify-between gap-6">
          <KineticText text="Four ways into the collection" className="text-5xl md:text-7xl" />
          <Link href="/collections/" className="hidden text-sm underline decoration-gold underline-offset-[6px] md:block">
            All collections
          </Link>
        </div>
        <motion.ul style={{ x, gap: `${gapVw}vw`, paddingLeft: "5vw" }} className="flex will-change-transform">
          {cats.map((c, i) => (
            <li key={c.id} style={{ width: `${cardVw}vw` }} className="shrink-0">
              <Link href={`/shop/?category=${c.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden border border-line md:aspect-[5/6]">
                  <div className="absolute inset-0 transition-transform duration-[900ms] ease-[var(--ease-out)] group-hover:scale-[1.05]">
                    <ProductArt category={c.slug} seed={i} label={c.name} className="h-full w-full" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/70 to-transparent p-6 pt-24">
                    <h3 className="text-4xl">{c.name}</h3>
                    <p className="mt-2 max-w-xs text-sm text-muted">{c.description}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/* Parallax layers behind animated counters. */
export function CraftStats() {
  const s = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [-90, 90]);
  const y2 = useTransform(scrollYProgress, [0, 1], [60, -140]);
  const r = useTransform(scrollYProgress, [0, 1], [-25, 25]);

  const stats = [
    { label: "Years of making", value: Number(s.stat_years) || 0 },
    { label: "Happy customers", value: Number(s.stat_customers) || 0, suffix: "+" },
    { label: "Pieces delivered", value: Number(s.stat_pieces) || 0, suffix: "+" },
  ];

  return (
    <section ref={ref} className="relative mt-[var(--space-6)] overflow-hidden border-y border-line py-28">
      <motion.svg aria-hidden style={{ y: y1, rotate: r }} viewBox="0 0 600 600" className="absolute -left-40 top-0 h-[34rem] w-[34rem] opacity-30">
        <circle cx="300" cy="300" r="280" fill="none" stroke="#c9a24b" strokeWidth="1" />
        <circle cx="300" cy="300" r="220" fill="none" stroke="#c9a24b" strokeWidth="1" strokeDasharray="2 10" />
        <circle cx="300" cy="300" r="160" fill="none" stroke="#c9a24b" strokeWidth="1" />
      </motion.svg>
      <motion.svg aria-hidden style={{ y: y2 }} viewBox="0 0 400 400" className="absolute -right-24 bottom-0 h-[26rem] w-[26rem] opacity-25">
        <polygon points="200,20 360,140 200,380 40,140" fill="none" stroke="#e6cf93" strokeWidth="1" />
        <polygon points="200,20 280,140 200,380 120,140" fill="none" stroke="#e6cf93" strokeWidth="1" />
      </motion.svg>
      <div className="container-x relative grid gap-14 text-center md:grid-cols-3">
        {stats.map((st, i) => (
          <Reveal key={st.label} delay={i * 0.1}>
            <p className="gold-text font-display text-7xl md:text-8xl">
              <NumberTicker value={st.value} suffix={st.suffix} />
            </p>
            <p className="mt-3 text-muted">{st.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const testimonials = [
  { name: "Ayesha K.", city: "Lahore", text: "The set arrived well packed and looked even better in person. It photographed beautifully at my nikah." },
  { name: "Mahnoor S.", city: "Karachi", text: "Ordering on WhatsApp was quick and they confirmed the same day. Cash on delivery made it easy for my mother to trust." },
  { name: "Hina R.", city: "Islamabad", text: "I wear the jhumkay every week. They are light and the finish has held up." },
];

export function Testimonials() {
  return (
    <section className="container-x pt-[var(--space-6)]">
      <KineticText text="Words from brides and gift-givers" className="max-w-3xl text-5xl md:text-7xl" />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.1}>
            <figure className="h-full border border-line bg-surface p-8">
              <div className="flex gap-1 text-gold" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} size={16} className="fill-gold" />
                ))}
              </div>
              <blockquote className="mt-5 font-display text-2xl leading-snug">{t.text}</blockquote>
              <figcaption className="mt-6 text-sm text-muted">
                {t.name}, {t.city}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Sample testimonials: replace with real customer words before launch.</p>
    </section>
  );
}

export function InstaStrip() {
  const s = useSettings();
  const cats = ["bridal", "rings", "necklaces", "earrings", "bridal", "earrings"];
  return (
    <section className="pt-[var(--space-6)]">
      <div className="container-x mb-8 flex items-end justify-between gap-4">
        <h2 className="text-4xl md:text-6xl">On our Instagram</h2>
        <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline decoration-gold underline-offset-[6px]">
          <Instagram size={16} /> Follow us
        </a>
      </div>
      <div className="hide-scrollbar flex gap-3 overflow-x-auto px-5 md:px-[calc((100vw-1320px)/2)]">
        {cats.map((c, i) => (
          <a key={i} href={s.instagram} target="_blank" rel="noopener noreferrer" aria-label="Open Instagram" className="group relative aspect-square w-56 shrink-0 overflow-hidden border border-line md:w-64">
            <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
              <ProductArt category={c} seed={i} variant={(i % 2) as 0 | 1} label="Jewellery from our Instagram" className="h-full w-full" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

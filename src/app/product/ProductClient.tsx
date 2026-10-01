"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Heart, MessageCircle, ShoppingBag } from "lucide-react";
import ProductCard, { ProductImage } from "@/components/ProductCard";
import ProductArt from "@/components/ProductArt";
import { useCatalog } from "@/components/HomeSections";
import { formatPKR } from "@/lib/format";
import { jsonLd } from "@/lib/sanitize";
import { useCart, useSettings, useToast, useWishlist } from "@/lib/store";
import { productWaMessage, waLink } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

export default function ProductClient() {
  const slug = useSearchParams().get("slug") ?? "";
  const { data, error } = useCatalog();
  const product = data?.products.find((p) => p.slug === slug);

  useEffect(() => {
    if (product) document.title = `${product.name} | ZARISH`;
  }, [product]);

  if (error) return <Message title="This piece could not load" text="Please refresh the page." />;
  if (!data) return <div className="container-x py-40" aria-busy><div className="aspect-[4/5] max-w-md animate-pulse border border-line bg-surface" /></div>;
  if (!product) return <Message title="We could not find that piece" text="It may have sold out or been removed." cta />;

  return <Detail product={product} all={data.products} />;
}

function Message({ title, text, cta }: { title: string; text: string; cta?: boolean }) {
  return (
    <div className="container-x grid min-h-[60vh] place-items-center text-center">
      <div>
        <h1 className="text-5xl">{title}</h1>
        <p className="mt-3 text-muted">{text}</p>
        {cta && <Link href="/shop/" className="btn btn-gold mt-6">Back to the shop</Link>}
      </div>
    </div>
  );
}

function Detail({ product, all }: { product: Product; all: Product[] }) {
  const cart = useCart();
  const wish = useWishlist();
  const toast = useToast();
  const settings = useSettings();
  const [active, setActive] = useState(0);
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const price = product.sale_price ?? product.price;
  const out = product.stock <= 0;

  const related = useMemo(() => {
    const same = all.filter((p) => p.id !== product.id && p.category_slug === product.category_slug);
    const rest = all.filter((p) => p.id !== product.id && p.category_slug !== product.category_slug);
    return [...same, ...rest].slice(0, 8);
  }, [all, product]);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const waHref = waLink(settings.whatsapp_number, productWaMessage(product.name + (size ? ` (size ${size})` : ""), price, url));

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    category: product.category_name,
    material: product.metal,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: price,
      availability: out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url,
    },
  };

  const specs: [string, string][] = [
    ["Metal", product.metal],
    ["Stone", product.stone],
    ["Weight", product.weight_grams != null ? `${product.weight_grams} g` : ""],
    ["Collection", product.category_name],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div className="container-x pb-10 pt-10 md:pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
        <Link href="/shop/" className="hover:text-ivory">Shop</Link> /{" "}
        {product.category_slug && (
          <>
            <Link href={`/shop/?category=${product.category_slug}`} className="hover:text-ivory">{product.category_name}</Link> /{" "}
          </>
        )}
        <span className="text-ivory">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr]">
        <Gallery product={product} active={active} setActive={setActive} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <h1 className="text-5xl md:text-7xl">{product.name}</h1>
          <p className="mt-5 flex items-baseline gap-4">
            <span className="font-display text-4xl text-gold-soft">{formatPKR(price)}</span>
            {product.sale_price != null && <span className="text-muted line-through">{formatPKR(product.price)}</span>}
          </p>
          <p className="mt-6 max-w-lg text-muted md:text-lg">{product.description}</p>

          {product.sizes.length > 0 && (
            <fieldset className="mt-8">
              <legend className="mb-3 text-sm text-muted">Size</legend>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className={`h-11 min-w-11 rounded-full border px-4 text-sm transition-colors ${size === s ? "border-gold bg-gold text-[#1a0d10]" : "border-line hover:border-gold"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-9 flex flex-wrap gap-3">
            <button className="btn btn-gold" disabled={out} onClick={() => cart.add(product, size || undefined)}>
              <ShoppingBag size={18} /> {out ? "Sold out" : "Add to cart"}
            </button>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-line">
              <MessageCircle size={18} /> Order on WhatsApp
            </a>
            <button
              className="btn btn-line !px-4"
              aria-pressed={wish.has(product.id)}
              aria-label={wish.has(product.id) ? "Remove from wishlist" : "Save to wishlist"}
              onClick={() => {
                wish.toggle(product.id);
                toast(wish.has(product.id) ? "Removed from wishlist" : "Saved to wishlist");
              }}
            >
              <Heart size={18} className={wish.has(product.id) ? "fill-gold text-gold" : ""} />
            </button>
          </div>
          <p className="mt-4 text-xs text-muted">Cash on delivery across Pakistan. {product.stock > 0 && product.stock <= 3 ? `Only ${product.stock} left.` : ""}</p>

          {specs.length > 0 && (
            <dl className="mt-10 divide-y divide-line border-y border-line">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between py-3.5 text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-[var(--space-6)]" aria-label="Related pieces">
          <h2 className="text-4xl md:text-6xl">You may also like</h2>
          <ul className="hide-scrollbar -mx-5 mt-10 flex snap-x gap-5 overflow-x-auto px-5 pb-4">
            {related.map((p) => (
              <li key={p.id} className="w-[62vw] shrink-0 snap-start sm:w-[34vw] lg:w-[22vw]">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Gallery({ product, active, setActive }: { product: Product; active: number; setActive: (n: number) => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const count = Math.max(product.images.length, 2);
  const src = product.images[active];

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !frame.current) return;
    const r = frame.current.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="grid gap-4 md:grid-cols-[88px_1fr]">
      <ul className="order-2 flex gap-3 md:order-1 md:flex-col" aria-label="Product images">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i}>
            <button
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={active === i}
              className={`relative block aspect-[4/5] w-20 overflow-hidden border transition-colors md:w-full ${active === i ? "border-gold" : "border-line hover:border-gold/60"}`}
            >
              {product.images[i] ? (
                <Image src={product.images[i]} alt="" fill sizes="88px" className="object-cover" />
              ) : (
                <ProductArt category={product.category_slug} seed={product.sort_order} variant={(i % 2) as 0 | 1} label="" className="h-full w-full" />
              )}
            </button>
          </li>
        ))}
      </ul>

      <motion.div
        ref={frame}
        key={active}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        onPointerMove={onMove}
        onPointerLeave={() => setZoom(null)}
        className="relative order-1 aspect-[4/5] overflow-hidden border border-line bg-surface md:order-2"
        data-cursor
      >
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out will-change-transform"
          style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        >
          {src ? (
            <Image src={src} alt={`${product.name}, image ${active + 1}`} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
          ) : (
            <ProductImage product={product} variant={(active % 2) as 0 | 1} />
          )}
        </div>
      </motion.div>
    </div>
  );
}

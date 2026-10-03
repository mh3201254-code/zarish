"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Heart, Plus } from "lucide-react";
import ProductArt from "./ProductArt";
import { formatPKR } from "@/lib/format";
import { useCart, useToast, useWishlist } from "@/lib/store";
import type { Product } from "@/lib/types";

export function productHref(slug: string) {
  return `/product/?slug=${encodeURIComponent(slug)}`;
}

export function ProductImage({ product, variant, className }: { product: Product; variant: 0 | 1; className?: string }) {
  const src = product.images[variant] ?? (variant === 1 ? undefined : product.images[0]);
  if (src) {
    return (
      <img
        src={src}
        alt={`${product.name}${variant ? ", alternate view" : ""}`}
        className={className ?? "h-full w-full object-cover"}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <ProductArt
      category={product.category_slug}
      seed={product.sort_order}
      variant={variant}
      label={`${product.name}${variant ? ", alternate view" : ""}`}
      className={className ?? "h-full w-full"}
    />
  );
}

export default function ProductCard({ product, preview = false }: { product: Product; preview?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const cart = useCart();
  const wish = useWishlist();
  const toast = useToast();
  const [hover, setHover] = useState(false);

  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 20 });
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);
  const glowX = useSpring(gx, { stiffness: 300, damping: 30 });
  const glowY = useSpring(gy, { stiffness: 300, damping: 30 });
  const glowOpacity = useTransform(glowX, () => (hover ? 1 : 0));

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 10);
    rx.set((0.5 - py) * 10);
    gx.set(e.clientX - r.left - 120);
    gy.set(e.clientY - r.top - 120);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    setHover(false);
  };

  const wished = wish.has(product.id);
  const onSale = product.sale_price != null;
  const out = product.stock <= 0;
  const href = preview ? "#" : productHref(product.slug);

  return (
    <div className="[perspective:900px]">
      <motion.div
        ref={ref}
        
        onPointerMove={onMove}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerLeave={onLeave}
        className="group relative"
      >
        <Link href={href} onClick={(e) => preview && e.preventDefault()} className="block focus-visible:outline-offset-4" aria-label={`${product.name}, ${formatPKR(product.sale_price ?? product.price)}`}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] bg-surface">
            <div className={`absolute inset-0 transition-opacity duration-500 ${product.images.length === 1 ? "" : "group-hover:opacity-0"}`}>
              <ProductImage product={product} variant={0} />
            </div>
            {(product.images.length === 0 || product.images.length > 1) && (
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <ProductImage product={product} variant={1} />
              </div>
            )}
            <motion.div
              aria-hidden
              style={{ x: glowX, y: glowY, opacity: glowOpacity }}
              className="pointer-events-none absolute left-0 top-0 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.35),transparent_65%)]"
            />
            {onSale && (
              <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-ivory">Sale</span>
            )}
            {out && (
              <span className="absolute left-3 top-3 rounded-full border border-line bg-bg/80 px-3 py-1 text-xs">Sold out</span>
            )}
          </div>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-body text-[15px] font-normal leading-tight">{product.name}</h3>
              <p className="mt-1 text-xs text-muted">{product.metal || product.category_name}</p>
            </div>
            <p className="text-right text-sm">
              {onSale && <span className="block text-xs text-muted line-through">{formatPKR(product.price)}</span>}
              <span className="text-ivory">{formatPKR(product.sale_price ?? product.price)}</span>
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => {
            wish.toggle(product.id);
            toast(wished ? "Removed from wishlist" : "Saved to wishlist");
          }}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-line bg-bg/70 backdrop-blur transition-colors hover:border-gold"
        >
          <Heart size={18} className={wished ? "fill-gold text-gold" : "text-ivory"} />
        </button>

        <button
          type="button"
          disabled={out || preview}
          onClick={() => {
            cart.add(product, product.sizes[0]);
          }}
          aria-label={`Add ${product.name} to cart`}
          className="absolute bottom-[4.6rem] right-3 grid h-11 translate-y-2 place-items-center gap-1 rounded-full bg-ivory px-4 text-sm font-medium text-white opacity-0 transition-all duration-300 hover:bg-[#4a423c] focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100 disabled:opacity-0"
        >
          <span className="flex items-center gap-1.5">
            <Plus size={16} /> Add
          </span>
        </button>
      </motion.div>
    </div>
  );
}

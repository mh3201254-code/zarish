"use client";

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useCatalog } from "@/components/HomeSections";
import { useWishlist } from "@/lib/store";

export default function WishlistClient() {
  const { data } = useCatalog();
  const wish = useWishlist();
  const items = data?.products.filter((p) => wish.has(p.id)) ?? [];
  return (
    <div className="container-x pb-10 pt-16 md:pt-24">
      <h1 className="text-6xl md:text-8xl">Wishlist</h1>
      {data && items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-3xl">Nothing saved yet</p>
          <p className="mt-2 text-muted">Tap the heart on any piece to keep it here.</p>
          <Link href="/shop/" className="btn btn-gold mt-6">Browse the shop</Link>
        </div>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {items.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

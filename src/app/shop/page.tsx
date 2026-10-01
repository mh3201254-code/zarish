import { Suspense } from "react";
import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse bridal sets, rings, necklaces and earrings. Filter by category, sort by price and order on WhatsApp.",
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-x py-40" aria-busy />}>
      <ShopClient />
    </Suspense>
  );
}

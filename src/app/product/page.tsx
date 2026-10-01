import { Suspense } from "react";
import type { Metadata } from "next";
import ProductClient from "./ProductClient";

export const metadata: Metadata = {
  title: "Product",
  description: "Jewellery details, price in PKR and ordering on WhatsApp.",
};

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="container-x py-40" aria-busy />}>
      <ProductClient />
    </Suspense>
  );
}

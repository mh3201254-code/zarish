"use client";

import Link from "next/link";
import Image from "next/image";
import ProductArt from "@/components/ProductArt";
import { Reveal } from "@/components/fx";
import { useCatalog } from "@/components/HomeSections";

export default function CollectionsClient() {
  const { data } = useCatalog();
  return (
    <div className="container-x pb-10 pt-16 md:pt-24">
      <h1 className="text-6xl md:text-8xl">Collections</h1>
      <p className="mt-4 max-w-xl text-muted">Start with the occasion, then choose the piece.</p>
      <div className="mt-14 grid gap-x-6 gap-y-14 md:grid-cols-2">
        {(data?.categories ?? []).map((c, i) => {
          const count = data?.products.filter((p) => p.category_slug === c.slug).length ?? 0;
          return (
            <Reveal key={c.id} delay={(i % 2) * 0.1}>
              <Link href={`/shop/?category=${c.slug}`} className="group block">
                <div className="relative aspect-[5/4] overflow-hidden border border-line">
                  <div className="absolute inset-0 transition-transform duration-[900ms] ease-[var(--ease-out)] group-hover:scale-[1.04]">
                    {c.cover_image ? (
                      <Image src={c.cover_image} alt={c.name} fill sizes="50vw" className="object-cover" />
                    ) : (
                      <ProductArt category={c.slug} seed={i} label={c.name} className="h-full w-full" />
                    )}
                  </div>
                </div>
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h2 className="text-4xl md:text-5xl">{c.name}</h2>
                  <span className="text-sm text-muted">{count} pieces</span>
                </div>
                <p className="mt-2 max-w-md text-muted">{c.description}</p>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

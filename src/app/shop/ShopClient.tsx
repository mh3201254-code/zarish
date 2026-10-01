"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useCatalog } from "@/components/HomeSections";
import { effectivePrice } from "@/lib/format";

const sorts = [
  { v: "featured", l: "Featured" },
  { v: "price-asc", l: "Price: low to high" },
  { v: "price-desc", l: "Price: high to low" },
  { v: "name", l: "Name" },
];

export default function ShopClient() {
  const { data, error } = useCatalog();
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get("category") ?? "all";
  const [sort, setSort] = useState("featured");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    if (!data) return [];
    let out = data.products.filter((p) => category === "all" || p.category_slug === category);
    const term = q.trim().toLowerCase();
    if (term) out = out.filter((p) => `${p.name} ${p.metal} ${p.stone} ${p.category_name}`.toLowerCase().includes(term));
    const copy = [...out];
    if (sort === "price-asc") copy.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    else if (sort === "price-desc") copy.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    else if (sort === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
    else copy.sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort_order - b.sort_order);
    return copy;
  }, [data, category, q, sort]);

  const setCategory = (slug: string) => router.replace(slug === "all" ? "/shop/" : `/shop/?category=${slug}`, { scroll: false });
  const current = data?.categories.find((c) => c.slug === category);

  return (
    <div className="container-x pb-10 pt-16 md:pt-24">
      <h1 className="text-6xl md:text-8xl">{current ? current.name : "All jewellery"}</h1>
      <p className="mt-4 max-w-xl text-muted">{current ? current.description : "Every piece lists its metal, stone and weight. Order on WhatsApp and pay on delivery."}</p>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border-y border-line py-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[{ slug: "all", name: "All" }, ...(data?.categories ?? [])].map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              aria-pressed={category === c.slug}
              className={`rounded-full border px-5 py-2 text-sm transition-colors ${category === c.slug ? "border-gold bg-gold text-[#1a0d10]" : "border-line hover:border-gold"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block">
            <span className="sr-only">Search jewellery</span>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="!w-48 !rounded-full !py-2.5 !pl-10" />
          </label>
          <label>
            <span className="sr-only">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="!w-auto !rounded-full !py-2.5">
              {sorts.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.l}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && <p className="py-20 text-center text-muted">The collection could not load. Please refresh the page.</p>}
      {!data && !error && (
        <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4" aria-busy>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse border border-line bg-surface" />
          ))}
        </div>
      )}
      {data && list.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-display text-3xl">Nothing matches that search</p>
          <p className="mt-2 text-muted">Try a different word or clear the filters.</p>
          <button className="btn btn-line mt-6" onClick={() => { setQ(""); setCategory("all"); }}>
            Clear filters
          </button>
        </div>
      )}
      <motion.ul layout className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((p) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductCard product={p} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}

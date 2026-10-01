"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { Field, PageHeader, Spinner, ErrorNote } from "@/components/admin/ui";
import ImageUploader, { publicPath } from "@/components/admin/ImageUploader";
import ProductCard from "@/components/ProductCard";
import { slugify } from "@/lib/utils";
import { useToast } from "@/lib/store";
import { clean } from "@/lib/sanitize";
import type { Category, Product } from "@/lib/types";

type Form = {
  name: string; slug: string; description: string; price: string; sale_price: string; category_id: string;
  metal: string; stone: string; weight_grams: string; sizes: string; stock: string;
  featured: boolean; published: boolean; sort_order: string; images: string[];
};

const blank: Form = {
  name: "", slug: "", description: "", price: "", sale_price: "", category_id: "", metal: "", stone: "",
  weight_grams: "", sizes: "", stock: "0", featured: false, published: false, sort_order: "0", images: [],
};

export default function EditClient() {
  const id = useSearchParams().get("id") ?? "new";
  const isNew = id === "new";
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState<Form>(blank);
  const [cats, setCats] = useState<Category[]>([]);
  const [original, setOriginal] = useState<string[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    (async () => {
      const c = await sb.from("categories").select("*").order("sort_order");
      setCats((c.data ?? []) as Category[]);
      if (!isNew) {
        const { data, error } = await sb.from("products").select("*").eq("id", id).maybeSingle();
        if (error || !data) {
          setError(error?.message ?? "Product not found");
        } else {
          const p = data as Record<string, any>;
          setOriginal(p.images ?? []);
          setSlugTouched(true);
          setF({
            name: p.name, slug: p.slug, description: p.description ?? "", price: String(p.price), sale_price: p.sale_price == null ? "" : String(p.sale_price),
            category_id: p.category_id ?? "", metal: p.metal ?? "", stone: p.stone ?? "", weight_grams: p.weight_grams == null ? "" : String(p.weight_grams),
            sizes: (p.sizes ?? []).join(", "), stock: String(p.stock), featured: p.featured, published: p.published, sort_order: String(p.sort_order), images: p.images ?? [],
          });
        }
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const preview: Product = useMemo(() => {
    const cat = cats.find((c) => c.id === f.category_id);
    const price = Number(f.price) || 0;
    const sale = f.sale_price === "" ? null : Number(f.sale_price);
    return {
      id: "preview", slug: f.slug, name: f.name || "Product name", description: f.description, price, sale_price: sale,
      category_id: f.category_id || null, category_slug: cat?.slug ?? "bridal", category_name: cat?.name ?? "",
      metal: f.metal, stone: f.stone, weight_grams: f.weight_grams === "" ? null : Number(f.weight_grams),
      sizes: [], stock: Number(f.stock) || 0, featured: f.featured, published: f.published, sort_order: Number(f.sort_order) || 0, images: f.images,
    };
  }, [f, cats]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    const price = Math.round(Number(f.price));
    const sale = f.sale_price === "" ? null : Math.round(Number(f.sale_price));
    if (!f.name.trim() || !Number.isFinite(price) || price < 0) return toast("Enter a name and a valid price", "error");
    if (sale != null && (!Number.isFinite(sale) || sale < 0 || sale >= price)) return toast("Sale price must be lower than the price", "error");
    const slug = f.slug || slugify(f.name);
    if (!slug) return toast("Enter a slug", "error");

    const row = {
      name: clean(f.name, 140), slug, description: clean(f.description, 4000), price, sale_price: sale,
      category_id: f.category_id || null, metal: clean(f.metal, 80), stone: clean(f.stone, 80),
      weight_grams: f.weight_grams === "" ? null : Number(f.weight_grams),
      sizes: f.sizes.split(",").map((s) => clean(s, 20)).filter(Boolean),
      stock: Math.max(0, Math.round(Number(f.stock) || 0)), featured: f.featured, published: f.published,
      sort_order: Math.round(Number(f.sort_order) || 0), images: f.images,
    };
    setSaving(true);
    const res = isNew ? await sb.from("products").insert(row) : await sb.from("products").update(row).eq("id", id);
    setSaving(false);
    if (res.error) return toast(res.error.message.includes("duplicate") ? "That slug is already used by another product" : res.error.message, "error");

    // Remove storage files that were taken out of this product.
    const gone = original.filter((u) => !f.images.includes(u)).map(publicPath).filter(Boolean) as string[];
    if (gone.length) await sb.storage.from("product-images").remove(gone);
    toast("Product saved");
    router.replace("/admin/products/");
  }

  if (loading) return <Spinner />;

  return (
    <>
      <Link href="/admin/products/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ivory"><ArrowLeft size={15} /> All products</Link>
      <PageHeader title={isNew ? "New product" : "Edit product"} />
      {error && <ErrorNote text={error} />}
      <form onSubmit={save} className="grid gap-10 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Field label="Name"><input required maxLength={140} value={f.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></Field>
          <Field label="Slug" hint="Used in the product link. Lowercase letters, numbers and hyphens."><input required value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></Field>
          <Field label="Description"><textarea rows={5} maxLength={4000} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Price (PKR)"><input required type="number" min={0} step={1} inputMode="numeric" value={f.price} onChange={(e) => set("price", e.target.value)} /></Field>
            <Field label="Sale price (PKR)" hint="Optional. Must be lower."><input type="number" min={0} step={1} inputMode="numeric" value={f.sale_price} onChange={(e) => set("sale_price", e.target.value)} /></Field>
            <Field label="Stock"><input type="number" min={0} step={1} inputMode="numeric" value={f.stock} onChange={(e) => set("stock", e.target.value)} /></Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category">
              <select value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>
                <option value="">No category</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Sort order" hint="Lower numbers appear first."><input type="number" step={1} value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Metal"><input maxLength={80} value={f.metal} onChange={(e) => set("metal", e.target.value)} /></Field>
            <Field label="Stone"><input maxLength={80} value={f.stone} onChange={(e) => set("stone", e.target.value)} /></Field>
            <Field label="Weight (grams)"><input type="number" min={0} step="0.01" value={f.weight_grams} onChange={(e) => set("weight_grams", e.target.value)} /></Field>
          </div>
          <Field label="Sizes" hint="Comma separated, for example 6, 7, 8. Leave empty if not needed."><input value={f.sizes} onChange={(e) => set("sizes", e.target.value)} /></Field>
          <div>
            <p className="mb-2 text-sm text-muted">Images</p>
            <ImageUploader images={f.images} onChange={(v) => set("images", v)} />
          </div>
          <div className="flex flex-wrap gap-8">
            <label className="flex items-center gap-3"><input type="checkbox" className="!w-5" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured on the home page</label>
            <label className="flex items-center gap-3"><input type="checkbox" className="!w-5" checked={f.published} onChange={(e) => set("published", e.target.checked)} /> Published in the shop</label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn btn-gold">{saving ? "Saving" : "Save product"}</button>
            <Link href="/admin/products/" className="btn btn-line">Cancel</Link>
          </div>
        </div>
        <aside className="xl:sticky xl:top-10 xl:self-start">
          <p className="mb-3 text-sm text-muted">Live preview</p>
          <div className="max-w-[300px]"><ProductCard product={preview} preview /></div>
        </aside>
      </form>
    </>
  );
}

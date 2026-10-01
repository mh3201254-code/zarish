"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { Confirm, Empty, ErrorNote, PageHeader, Spinner } from "@/components/admin/ui";
import { publicPath } from "@/components/admin/ImageUploader";
import { formatPKR } from "@/lib/format";
import { useToast } from "@/lib/store";
import { normalizeProduct } from "@/lib/data";
import type { Product } from "@/lib/types";

export default function AdminProducts() {
  const toast = useToast();
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [del, setDel] = useState<Product | null>(null);

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data, error } = await sb.from("products").select("*, categories(slug, name)").order("sort_order").order("created_at", { ascending: false });
    if (error) return setError(error.message);
    setItems((data as Record<string, unknown>[]).map(normalizeProduct));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (items ?? []).filter((p) => !t || `${p.name} ${p.slug} ${p.category_name}`.toLowerCase().includes(t));
  }, [items, q]);

  async function togglePublished(p: Product) {
    const { error } = await getSupabase()!.from("products").update({ published: !p.published }).eq("id", p.id);
    if (error) return toast(error.message, "error");
    toast(p.published ? "Product hidden from the shop" : "Product published");
    load();
  }

  async function duplicate(p: Product) {
    const { id, category_slug, category_name, ...rest } = p;
    void id; void category_slug; void category_name;
    const suffix = Math.random().toString(36).slice(2, 6);
    const { error } = await getSupabase()!.from("products").insert({ ...rest, name: `${p.name} (copy)`, slug: `${p.slug}-copy-${suffix}`, published: false });
    if (error) return toast(error.message, "error");
    toast("Duplicated as a draft");
    load();
  }

  async function remove(p: Product) {
    const sb = getSupabase()!;
    const { error } = await sb.from("products").delete().eq("id", p.id);
    setDel(null);
    if (error) return toast(error.message, "error");
    const paths = p.images.map(publicPath).filter(Boolean) as string[];
    if (paths.length) await sb.storage.from("product-images").remove(paths);
    toast("Product deleted");
    load();
  }

  return (
    <>
      <PageHeader title="Products">
        <input type="search" aria-label="Search products" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="!w-56" />
        <Link href="/admin/products/edit/?id=new" className="btn btn-gold !py-2.5"><Plus size={16} /> New product</Link>
      </PageHeader>
      {error && <ErrorNote text={error} />}
      {!items && !error && <Spinner />}
      {items && items.length === 0 && (
        <Empty title="No products yet" text="Add your first piece. It stays hidden from the shop until you publish it.">
          <Link href="/admin/products/edit/?id=new" className="btn btn-gold">Add a product</Link>
        </Empty>
      )}
      {items && items.length > 0 && (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="p-3 font-normal">Product</th>
                <th className="p-3 font-normal">Category</th>
                <th className="p-3 font-normal">Price</th>
                <th className="p-3 font-normal">Stock</th>
                <th className="p-3 font-normal">Shop</th>
                <th className="p-3 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden border border-line bg-surface">
                        {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted">{p.slug}{p.featured ? " · featured" : ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted">{p.category_name || "None"}</td>
                  <td className="p-3">
                    {formatPKR(p.sale_price ?? p.price)}
                    {p.sale_price != null && <span className="ml-2 text-xs text-muted line-through">{formatPKR(p.price)}</span>}
                  </td>
                  <td className={`p-3 ${p.stock <= 3 ? "text-gold-soft" : ""}`}>{p.stock}</td>
                  <td className="p-3">
                    <button onClick={() => togglePublished(p)} aria-pressed={p.published} className={`rounded-full border px-3 py-1 text-xs ${p.published ? "border-gold text-gold-soft" : "border-line text-muted"}`}>
                      {p.published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/products/edit/?id=${p.id}`} aria-label={`Edit ${p.name}`} className="grid h-9 w-9 place-items-center rounded hover:bg-surface-2"><Pencil size={16} /></Link>
                      <button onClick={() => duplicate(p)} aria-label={`Duplicate ${p.name}`} className="grid h-9 w-9 place-items-center rounded hover:bg-surface-2"><Copy size={16} /></button>
                      <button onClick={() => setDel(p)} aria-label={`Delete ${p.name}`} className="grid h-9 w-9 place-items-center rounded text-red-300 hover:bg-surface-2"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="p-6 text-center text-sm text-muted">No products match that search.</p>}
        </div>
      )}
      <Confirm open={!!del} title="Delete this product?" text={`"${del?.name}" and its images will be removed permanently.`} onConfirm={() => del && remove(del)} onCancel={() => setDel(null)} />
    </>
  );
}

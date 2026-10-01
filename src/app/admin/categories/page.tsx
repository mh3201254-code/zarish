"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { Confirm, Empty, ErrorNote, Field, PageHeader, Spinner } from "@/components/admin/ui";
import ImageUploader, { publicPath } from "@/components/admin/ImageUploader";
import { normalizeCategory } from "@/lib/data";
import { slugify } from "@/lib/utils";
import { clean } from "@/lib/sanitize";
import { useToast } from "@/lib/store";
import type { Category } from "@/lib/types";

type Form = { id?: string; name: string; slug: string; description: string; sort_order: string; published: boolean; cover: string[] };
const blank: Form = { name: "", slug: "", description: "", sort_order: "0", published: true, cover: [] };

export default function AdminCategories() {
  const toast = useToast();
  const [items, setItems] = useState<Category[] | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [del, setDel] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await getSupabase()!.from("categories").select("*").order("sort_order");
    if (error) return setError(error.message);
    setItems((data as Record<string, unknown>[]).map(normalizeCategory));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const slug = form.slug || slugify(form.name);
    if (!form.name.trim() || !slug) return toast("Enter a name", "error");
    const row = {
      name: clean(form.name, 80), slug, description: clean(form.description, 600),
      sort_order: Math.round(Number(form.sort_order) || 0), published: form.published, cover_image: form.cover[0] ?? null,
    };
    setSaving(true);
    const sb = getSupabase()!;
    const res = form.id ? await sb.from("categories").update(row).eq("id", form.id) : await sb.from("categories").insert(row);
    setSaving(false);
    if (res.error) return toast(res.error.message.includes("duplicate") ? "That slug is already used" : res.error.message, "error");
    toast("Collection saved");
    setForm(null);
    load();
  }

  async function remove(c: Category) {
    const sb = getSupabase()!;
    const { error } = await sb.from("categories").delete().eq("id", c.id);
    setDel(null);
    if (error) return toast(error.message, "error");
    const p = c.cover_image ? publicPath(c.cover_image) : null;
    if (p) await sb.storage.from("product-images").remove([p]);
    toast("Collection deleted. Its products are now uncategorised.");
    load();
  }

  return (
    <>
      <PageHeader title="Categories and collections">
        <button className="btn btn-gold !py-2.5" onClick={() => setForm({ ...blank })}><Plus size={16} /> New collection</button>
      </PageHeader>
      {error && <ErrorNote text={error} />}
      {!items && !error && <Spinner />}
      {items && items.length === 0 && <Empty title="No collections yet" text="Collections group your products in the shop and on the home page." />}
      {items && items.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <li key={c.id} className="flex gap-4 border border-line bg-surface p-4">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-line bg-bg">{c.cover_image && <Image src={c.cover_image} alt="" fill sizes="80px" className="object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-2xl leading-tight">{c.name}</p>
                <p className="truncate text-xs text-muted">{c.slug} · order {c.sort_order}{c.published ? "" : " · hidden"}</p>
                <div className="mt-3 flex gap-1">
                  <button aria-label={`Edit ${c.name}`} className="grid h-9 w-9 place-items-center rounded hover:bg-surface-2" onClick={() => setForm({ id: c.id, name: c.name, slug: c.slug, description: c.description, sort_order: String(c.sort_order), published: c.published, cover: c.cover_image ? [c.cover_image] : [] })}><Pencil size={16} /></button>
                  <button aria-label={`Delete ${c.name}`} className="grid h-9 w-9 place-items-center rounded text-red-300 hover:bg-surface-2" onClick={() => setDel(c)}><Trash2 size={16} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <div className="fixed inset-0 z-[140] grid place-items-center overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="cat-title" onKeyDown={(e) => e.key === "Escape" && setForm(null)}>
          <form onSubmit={save} className="my-8 w-full max-w-lg space-y-5 border border-line bg-surface p-6">
            <h2 id="cat-title" className="font-display text-3xl">{form.id ? "Edit collection" : "New collection"}</h2>
            <Field label="Name"><input required autoFocus maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} /></Field>
            <Field label="Slug"><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} /></Field>
            <Field label="Description"><textarea rows={3} maxLength={600} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Sort order"><input type="number" step={1} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></Field>
            <div>
              <p className="mb-2 text-sm text-muted">Cover image</p>
              <div className="max-w-[160px]"><ImageUploader images={form.cover} max={1} onChange={(v) => setForm({ ...form, cover: v })} /></div>
            </div>
            <label className="flex items-center gap-3"><input type="checkbox" className="!w-5" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Visible in the shop</label>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn btn-line !py-2.5" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-gold !py-2.5">{saving ? "Saving" : "Save collection"}</button>
            </div>
          </form>
        </div>
      )}
      <Confirm open={!!del} title="Delete this collection?" text={`Products in "${del?.name}" will stay but lose their category.`} onConfirm={() => del && remove(del)} onCancel={() => setDel(null)} />
    </>
  );
}

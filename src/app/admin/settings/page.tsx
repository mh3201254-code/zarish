"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { ErrorNote, Field, PageHeader, Spinner } from "@/components/admin/ui";
import { clean } from "@/lib/sanitize";
import { useToast } from "@/lib/store";
import { loadSettings } from "@/lib/data";

const fields: { key: string; label: string; hint?: string; type?: "textarea" | "number" }[] = [
  { key: "whatsapp_number", label: "WhatsApp number", hint: "Digits with country code, for example 923001234567. A leading 03 is also accepted." },
  { key: "phone", label: "Phone shown on the site" },
  { key: "announcement", label: "Announcement bar text", hint: "Leave empty to hide the bar." },
  { key: "hero_title", label: "Hero headline" },
  { key: "hero_subtitle", label: "Hero subtitle", type: "textarea" },
  { key: "instagram", label: "Instagram link" },
  { key: "facebook", label: "Facebook link" },
  { key: "delivery_charge", label: "Delivery charge (PKR)", type: "number" },
  { key: "free_delivery_above", label: "Free delivery above (PKR)", hint: "Set 0 to always charge delivery.", type: "number" },
  { key: "stat_years", label: "Counter: years of making", type: "number" },
  { key: "stat_customers", label: "Counter: happy customers", type: "number" },
  { key: "stat_pieces", label: "Counter: pieces delivered", type: "number" },
];

export default function AdminSettings() {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.from("site_settings").select("key, value").then(({ data, error }) => {
      if (error) return setError(error.message);
      const v: Record<string, string> = {};
      for (const r of (data ?? []) as { key: string; value: string }[]) v[r.key] = r.value;
      setValues(v);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!values) return;
    setSaving(true);
    const rows = fields.map((f) => ({ key: f.key, value: clean(values[f.key] ?? "", 1000) }));
    const { error } = await getSupabase()!.from("site_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) return toast(error.message, "error");
    loadSettings(true);
    toast("Settings saved. The site picks them up on the next page load.");
  }

  return (
    <>
      <PageHeader title="Site settings" />
      {error && <ErrorNote text={error} />}
      {!values && !error && <Spinner />}
      {values && (
        <form onSubmit={save} className="max-w-2xl space-y-6">
          <p className="text-sm text-muted">These values are public: they are shown on the storefront. Do not store passwords or keys here.</p>
          {fields.map((f) => (
            <Field key={f.key} label={f.label} hint={f.hint}>
              {f.type === "textarea" ? (
                <textarea rows={3} maxLength={1000} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              ) : (
                <input type={f.type === "number" ? "number" : "text"} min={f.type === "number" ? 0 : undefined} maxLength={1000} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              )}
            </Field>
          ))}
          <button type="submit" disabled={saving} className="btn btn-gold">{saving ? "Saving" : "Save settings"}</button>
        </form>
      )}
    </>
  );
}

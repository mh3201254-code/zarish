"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { Empty, ErrorNote, PageHeader, Spinner } from "@/components/admin/ui";
import { formatDate, formatPKR } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { clean } from "@/lib/sanitize";
import { useToast } from "@/lib/store";
import { waLink } from "@/lib/whatsapp";
import type { Order, OrderStatus } from "@/lib/types";

const statuses: OrderStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const { data, error } = await getSupabase()!.from("orders").select("*").order("created_at", { ascending: false });
    if (error) return setError(error.message);
    setOrders(data as Order[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (orders ?? []).filter((o) => (status === "all" || o.status === status) && (!t || `${o.ref} ${o.customer_name} ${o.phone} ${o.city}`.toLowerCase().includes(t)));
  }, [orders, status, q]);

  async function setOrderStatus(o: Order, next: OrderStatus) {
    const { error } = await getSupabase()!.from("orders").update({ status: next }).eq("id", o.id);
    if (error) return toast(error.message, "error");
    setOrders((prev) => prev && prev.map((x) => (x.id === o.id ? { ...x, status: next } : x)));
    toast(`Order ${o.ref} marked ${next}`);
  }

  async function saveNotes(o: Order) {
    const value = clean(notes[o.id] ?? o.admin_notes, 1000);
    const { error } = await getSupabase()!.from("orders").update({ admin_notes: value }).eq("id", o.id);
    if (error) return toast(error.message, "error");
    setOrders((prev) => prev && prev.map((x) => (x.id === o.id ? { ...x, admin_notes: value } : x)));
    toast("Notes saved");
  }

  function exportCSV() {
    downloadCSV(
      `zarish-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      list.map((o) => ({
        reference: o.ref, date: o.created_at, status: o.status, customer: o.customer_name, phone: o.phone, city: o.city, address: o.address,
        items: o.items.map((i) => `${i.name}${i.size ? ` (${i.size})` : ""} x${i.qty}`).join("; "),
        subtotal_pkr: o.subtotal, delivery_pkr: o.delivery_charge, total_pkr: o.total, notes: o.notes, admin_notes: o.admin_notes,
      })),
    );
  }

  return (
    <>
      <PageHeader title="Orders">
        <input type="search" aria-label="Search orders" placeholder="Search name, phone, reference" value={q} onChange={(e) => setQ(e.target.value)} className="!w-64" />
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="!w-auto">
          <option value="all">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-line !py-2.5" onClick={exportCSV} disabled={list.length === 0}><Download size={16} /> Export CSV</button>
      </PageHeader>
      {error && <ErrorNote text={error} />}
      {!orders && !error && <Spinner />}
      {orders && orders.length === 0 && <Empty title="No orders yet" text="Orders placed at checkout appear here with the customer's details." />}
      {orders && orders.length > 0 && (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>{["Order", "Customer", "Date", "Total", "Status", ""].map((h) => <th key={h} className="p-3 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((o) => (
                <Fragment key={o.id}>
                  <tr>
                    <td className="p-3 font-medium">{o.ref}</td>
                    <td className="p-3">{o.customer_name}<br /><span className="text-xs text-muted">{o.phone}</span></td>
                    <td className="p-3 text-muted">{formatDate(o.created_at)}</td>
                    <td className="p-3 text-gold-soft">{formatPKR(o.total)}</td>
                    <td className="p-3">
                      <select aria-label={`Status of ${o.ref}`} value={o.status} onChange={(e) => setOrderStatus(o, e.target.value as OrderStatus)} className="!w-auto !py-1.5 text-xs">
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button aria-expanded={open === o.id} aria-label={`Details for ${o.ref}`} onClick={() => setOpen(open === o.id ? null : o.id)} className="grid h-9 w-9 place-items-center rounded hover:bg-surface-2"><ChevronDown size={18} className={open === o.id ? "rotate-180" : ""} /></button>
                    </td>
                  </tr>
                  {open === o.id && (
                    <tr className="bg-surface/60">
                      <td colSpan={6} className="grid gap-6 p-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-muted">Delivery address</p>
                          <p>{o.address}{o.city ? `, ${o.city}` : ""}</p>
                          {o.notes && <p className="text-muted">Customer note: {o.notes}</p>}
                          <a className="inline-block text-gold-soft underline underline-offset-4" target="_blank" rel="noopener noreferrer" href={waLink(o.phone, `Assalam o Alaikum ${o.customer_name}, regarding your ZARISH order ${o.ref}`)}>Message on WhatsApp</a>
                        </div>
                        <div>
                          <p className="mb-2 text-muted">Items</p>
                          <ul className="space-y-1">
                            {o.items.map((i, k) => <li key={k} className="flex justify-between gap-4"><span>{i.name}{i.size ? ` (size ${i.size})` : ""} x{i.qty}</span><span>{formatPKR(i.unit_price * i.qty)}</span></li>)}
                          </ul>
                          <p className="mt-3 flex justify-between text-muted"><span>Delivery</span><span>{o.delivery_charge ? formatPKR(o.delivery_charge) : "Free"}</span></p>
                          <p className="flex justify-between font-medium"><span>Total</span><span>{formatPKR(o.total)}</span></p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-muted">Internal notes
                            <textarea rows={2} maxLength={1000} className="mt-1.5" defaultValue={o.admin_notes} onChange={(e) => setNotes({ ...notes, [o.id]: e.target.value })} />
                          </label>
                          <button className="btn btn-line mt-3 !py-2" onClick={() => saveNotes(o)}>Save notes</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="p-6 text-center text-sm text-muted">No orders match those filters.</p>}
        </div>
      )}
    </>
  );
}

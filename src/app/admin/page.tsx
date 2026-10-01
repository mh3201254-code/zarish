"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { PageHeader, Spinner, ErrorNote } from "@/components/admin/ui";
import { formatDate, formatPKR } from "@/lib/format";
import type { Order } from "@/lib/types";

type Counts = { products: number; low: number; orders: number; messages: number };

export default function Dashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    (async () => {
      const head = { count: "exact" as const, head: true };
      const [p, l, o, m, r] = await Promise.all([
        sb.from("products").select("id", head),
        sb.from("products").select("id", head).lte("stock", 3),
        sb.from("orders").select("id", head).eq("status", "new"),
        sb.from("messages").select("id", head).eq("is_read", false),
        sb.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      const err = p.error || l.error || o.error || m.error || r.error;
      if (err) return setError(err.message);
      setCounts({ products: p.count ?? 0, low: l.count ?? 0, orders: o.count ?? 0, messages: m.count ?? 0 });
      setRecent((r.data ?? []) as Order[]);
    })();
  }, []);

  const cards = counts
    ? [
        { label: "Products", value: counts.products, href: "/admin/products/" },
        { label: "Low stock (3 or fewer)", value: counts.low, href: "/admin/products/" },
        { label: "New orders", value: counts.orders, href: "/admin/orders/" },
        { label: "Unread messages", value: counts.messages, href: "/admin/messages/" },
      ]
    : [];

  return (
    <>
      <PageHeader title="Dashboard" />
      {error && <ErrorNote text={error} />}
      {!counts && !error && <Spinner />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="border border-line bg-surface p-6 transition-colors hover:border-gold">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="gold-text mt-2 font-display text-6xl">{c.value}</p>
          </Link>
        ))}
      </div>

      {counts && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-3xl">Recent orders</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">No orders yet. New orders appear here as customers check out.</p>
          ) : (
            <ul className="divide-y divide-line border border-line">
              {recent.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
                  <span className="font-medium">{o.ref}</span>
                  <span>{o.customer_name}</span>
                  <span className="text-muted">{formatDate(o.created_at)}</span>
                  <span className="text-gold-soft">{formatPKR(o.total)}</span>
                  <span className="rounded-full border border-line px-3 py-0.5 text-xs">{o.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}

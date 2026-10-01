"use client";

import { useCallback, useEffect, useState } from "react";
import { MailOpen, Mail, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { Confirm, Empty, ErrorNote, PageHeader, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { useToast } from "@/lib/store";
import type { Message } from "@/lib/types";

export default function AdminMessages() {
  const toast = useToast();
  const [items, setItems] = useState<Message[] | null>(null);
  const [error, setError] = useState("");
  const [del, setDel] = useState<Message | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await getSupabase()!.from("messages").select("*").order("created_at", { ascending: false });
    if (error) return setError(error.message);
    setItems(data as Message[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function setRead(m: Message, read: boolean) {
    const { error } = await getSupabase()!.from("messages").update({ is_read: read }).eq("id", m.id);
    if (error) return toast(error.message, "error");
    setItems((prev) => prev && prev.map((x) => (x.id === m.id ? { ...x, is_read: read } : x)));
  }

  async function remove(m: Message) {
    const { error } = await getSupabase()!.from("messages").delete().eq("id", m.id);
    setDel(null);
    if (error) return toast(error.message, "error");
    toast("Message deleted");
    load();
  }

  const unread = items?.filter((m) => !m.is_read).length ?? 0;

  return (
    <>
      <PageHeader title={`Messages${items ? ` (${unread} unread)` : ""}`} />
      {error && <ErrorNote text={error} />}
      {!items && !error && <Spinner />}
      {items && items.length === 0 && <Empty title="No messages yet" text="Messages sent from the contact form appear here." />}
      <ul className="space-y-3">
        {items?.map((m) => (
          <li key={m.id} className={`border bg-surface p-5 ${m.is_read ? "border-line" : "border-gold/60"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{m.name} {!m.is_read && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[11px] text-[#1a0d10]">New</span>}</p>
                <p className="text-xs text-muted">{[m.email, m.phone].filter(Boolean).join(" · ") || "No contact details"} · {formatDate(m.created_at)}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setRead(m, !m.is_read)} aria-label={m.is_read ? "Mark as unread" : "Mark as read"} className="grid h-9 w-9 place-items-center rounded hover:bg-surface-2">{m.is_read ? <Mail size={17} /> : <MailOpen size={17} />}</button>
                <button onClick={() => setDel(m)} aria-label="Delete message" className="grid h-9 w-9 place-items-center rounded text-red-300 hover:bg-surface-2"><Trash2 size={17} /></button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-ivory/90">{m.message}</p>
          </li>
        ))}
      </ul>
      <Confirm open={!!del} title="Delete this message?" text="This cannot be undone." onConfirm={() => del && remove(del)} onCancel={() => setDel(null)} />
    </>
  );
}

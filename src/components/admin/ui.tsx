"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-16 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-gold" />
      {label}
    </div>
  );
}

export function Empty({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-line py-16 text-center">
      <p className="font-display text-3xl">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{text}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

export function ErrorNote({ text }: { text: string }) {
  return (
    <p role="alert" className="border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
      {text}
    </p>
  );
}

export function Confirm({
  open,
  title,
  text,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-black/70 p-4" role="alertdialog" aria-modal="true" aria-labelledby="cf-title">
      <div className="w-full max-w-sm border border-line bg-surface p-6">
        <h2 id="cf-title" className="font-display text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-muted">{text}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={ref} className="btn btn-line !py-2.5" onClick={onCancel}>Cancel</button>
          <button className="btn !bg-red-700 !py-2.5 text-white hover:!bg-red-600" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

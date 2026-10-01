"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { ErrorNote } from "@/components/admin/ui";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupabase()?.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/admin/");
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError("");
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError("That email and password did not match. Check them and try again.");
      return;
    }
    router.replace("/admin/");
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 border border-line bg-surface p-8">
        <div className="text-center">
          <p className="gold-text font-display text-4xl tracking-[0.18em]">ZARISH</p>
          <h1 className="mt-2 font-display text-2xl">Admin sign in</h1>
        </div>
        {!isSupabaseConfigured && <ErrorNote text="Supabase environment variables are missing. See the README." />}
        {error && <ErrorNote text={error} />}
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Email</span>
          <input type="email" required autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Password</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" disabled={busy || !isSupabaseConfigured} className="btn btn-gold w-full">
          {busy ? "Signing in" : "Sign in"}
        </button>
        <p className="text-center text-xs text-muted">Accounts are created by the site owner. There is no public sign-up.</p>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Boxes, ExternalLink, Inbox, LayoutDashboard, LogOut, Package, Settings, ShoppingCart, Tags } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { Spinner } from "./ui";

type Status = "loading" | "ok" | "denied";
const AdminCtx = createContext<{ email: string }>({ email: "" });
export const useAdmin = () => useContext(AdminCtx);

const nav = [
  { href: "/admin/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products/", label: "Products", icon: Package },
  { href: "/admin/categories/", label: "Categories", icon: Tags },
  { href: "/admin/orders/", label: "Orders", icon: ShoppingCart },
  { href: "/admin/messages/", label: "Messages", icon: Inbox },
  { href: "/admin/settings/", label: "Site settings", icon: Settings },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const isLogin = pathname.replace(/\/$/, "") === "/admin/login";
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (isLogin) return;
    const sb = getSupabase();
    if (!sb) return;
    let alive = true;

    async function check() {
      const { data } = await sb!.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace("/admin/login/");
        return;
      }
      // RLS lets a signed-in user read only their own admins row.
      const { data: row } = await sb!.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle();
      if (!alive) return;
      setEmail(session.user.email ?? "");
      setStatus(row ? "ok" : "denied");
    }
    check();
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/admin/login/");
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [isLogin, router]);

  if (isLogin) return <>{children}</>;

  if (!isSupabaseConfigured) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-4xl">Supabase is not connected</h1>
          <p className="mt-3 text-muted">
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see README), then reload this page.
          </p>
        </div>
      </div>
    );
  }
  if (status === "loading") return <div className="grid min-h-screen place-items-center"><Spinner label="Checking your session" /></div>;
  if (status === "denied") {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-4xl">This account is not an admin</h1>
          <p className="mt-3 text-muted">{email} is signed in but has no access. Ask the site owner to add your user id to the admins table.</p>
          <button
            className="btn btn-line mt-6"
            onClick={async () => {
              await getSupabase()?.auth.signOut();
              router.replace("/admin/login/");
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminCtx.Provider value={{ email }}>
      <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
        <aside className="border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
          <div className="flex items-center justify-between px-5 py-5 md:block">
            <Link href="/admin/" className="font-display text-3xl tracking-[0.18em] gold-text">ZARISH</Link>
            <p className="hidden text-xs text-muted md:mt-1 md:block">Admin panel</p>
          </div>
          <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
            {nav.map((n) => {
              const active = n.href === "/admin/" ? pathname.replace(/\/$/, "") === "/admin" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 whitespace-nowrap rounded px-3 py-2.5 text-sm transition-colors ${active ? "bg-surface-2 text-gold-soft" : "text-ivory/80 hover:bg-surface-2"}`}
                >
                  <n.icon size={17} /> {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden space-y-1 px-3 pt-6 md:block">
            <Link href="/" target="_blank" className="flex items-center gap-3 rounded px-3 py-2.5 text-sm text-ivory/80 hover:bg-surface-2">
              <ExternalLink size={17} /> View site
            </Link>
            <button
              className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm text-ivory/80 hover:bg-surface-2"
              onClick={async () => {
                await getSupabase()?.auth.signOut();
                router.replace("/admin/login/");
              }}
            >
              <LogOut size={17} /> Log out
            </button>
            <p className="truncate px-3 pt-3 text-xs text-muted">{email}</p>
          </div>
        </aside>
        <div className="min-w-0 p-5 md:p-10">{children}</div>
      </div>
    </AdminCtx.Provider>
  );
}

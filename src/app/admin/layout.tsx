import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";

// The admin area is never indexed.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <meta name="robots" content="noindex" />
      <AdminShell>{children}</AdminShell>
    </>
  );
}

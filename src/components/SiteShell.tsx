"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Heart, Menu, Phone, ShoppingBag, X } from "lucide-react";
import { Instagram, Facebook } from "./icons";
import { useCart, useSettings, useWishlist } from "@/lib/store";
import { Cursor, ScrollProgress } from "./fx";
import SmoothScroll from "./SmoothScroll";
import CartDrawer from "./CartDrawer";

const nav = [
  { href: "/shop/", label: "Shop" },
  { href: "/collections/", label: "Collections" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
];

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  if (isAdmin) return <>{children}</>;
  return (
    <>
      <SmoothScroll />
      <ScrollProgress />
      <Cursor />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}

function Header() {
  const settings = useSettings();
  const cart = useCart();
  const wish = useWishlist();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded focus:bg-gold focus:px-4 focus:py-2 focus:text-bg">
        Skip to content
      </a>
      {settings.announcement && (
        <div className="relative z-[60] bg-ruby px-4 py-2 text-center text-xs text-ivory">{settings.announcement}</div>
      )}
      <header
        className={`sticky top-0 z-[70] transition-colors duration-500 ${scrolled ? "border-b border-line bg-bg/85 backdrop-blur-md" : "bg-transparent"}`}
      >
        <div className="container-x flex h-[72px] items-center justify-between">
          <Link href="/" className="font-display text-3xl tracking-[0.2em]" aria-label="ZARISH home">
            <span className="gold-text">ZARISH</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={pathname === n.href ? "page" : undefined}
                className={`text-sm transition-colors hover:text-gold-soft ${pathname === n.href ? "text-gold-soft" : "text-ivory/85"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/wishlist/" aria-label={`Wishlist, ${wish.ids.length} saved`} className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2">
              <Heart size={20} />
              {wish.ids.length > 0 && <Badge n={wish.ids.length} />}
            </Link>
            <button onClick={() => cart.setOpen(true)} aria-label={`Open cart, ${cart.count} items`} className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2">
              <ShoppingBag size={20} />
              {cart.count > 0 && <Badge n={cart.count} />}
            </button>
            <button onClick={() => setOpen(true)} aria-label="Open menu" className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2 md:hidden">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex flex-col bg-bg px-8 py-6 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="ml-auto grid h-11 w-11 place-items-center rounded-full border border-line">
            <X size={20} />
          </button>
          <nav className="mt-10 flex flex-col gap-6">
            {[{ href: "/", label: "Home" }, ...nav, { href: "/wishlist/", label: "Wishlist" }].map((n, i) => (
              <motion.div key={n.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.5 }}>
                <Link href={n.href} className="font-display text-5xl">
                  {n.label}
                </Link>
              </motion.div>
            ))}
          </nav>
        </motion.div>
      )}
    </>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[11px] font-semibold text-[#1a0d10]">
      {n}
    </span>
  );
}

function Footer() {
  const s = useSettings();
  return (
    <footer className="relative mt-[var(--space-6)] overflow-hidden border-t border-line pt-20">
      <div className="container-x grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-4xl gold-text">ZARISH</p>
          <p className="mt-4 max-w-xs text-sm text-muted">
            Heritage jewellery, finished by hand. Order on WhatsApp and pay cash on delivery anywhere in Pakistan.
          </p>
        </div>
        <FooterCol title="Shop" links={[["/shop/", "All jewellery"], ["/collections/", "Collections"], ["/wishlist/", "Wishlist"]]} />
        <FooterCol title="Company" links={[["/about/", "About us"], ["/contact/", "Contact"], ["/contact/#faq", "Delivery and returns"]]} />
        <div>
          <p className="mb-4 text-sm text-gold-soft">Reach us</p>
          <ul className="space-y-3 text-sm text-muted">
            {s.phone && (
              <li className="flex items-center gap-2">
                <Phone size={15} /> {s.phone}
              </li>
            )}
            {s.instagram && (
              <li>
                <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ivory">
                  <Instagram size={15} /> Instagram
                </a>
              </li>
            )}
            {s.facebook && (
              <li>
                <a href={s.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ivory">
                  <Facebook size={15} /> Facebook
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <motion.p
        aria-hidden
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="gold-text mt-20 select-none text-center font-display text-[clamp(5rem,24vw,22rem)] leading-[0.8] tracking-[0.06em]"
      >
        ZARISH
      </motion.p>
      <p className="container-x py-8 text-center text-xs text-muted">&copy; {new Date().getFullYear()} ZARISH. All rights reserved.</p>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-4 text-sm text-gold-soft">{title}</p>
      <ul className="space-y-3 text-sm text-muted">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="hover:text-ivory">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

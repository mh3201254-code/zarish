"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Lenis smooth scroll. Skipped entirely for reduced-motion users.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, autoRaf: true });
    return () => lenis.destroy();
  }, []);
  return null;
}

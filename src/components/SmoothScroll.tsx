"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Keep the premium smooth-scroll feel, but use a lighter interpolation so
// wheel/touch scrolling stays responsive and does not fight the scroll-driven animations.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 0.75, smoothWheel: true, autoRaf: true });
    return () => lenis.destroy();
  }, []);
  return null;
}

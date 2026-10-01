"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";

/* In-view reveal: plays once. Opacity + transform only. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "p" | "section";
}) {
  const M = motion[as] as typeof motion.div;
  return (
    <M
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </M>
  );
}

/* Kinetic headline: words rise in a stagger. */
export function KineticText({
  text,
  className,
  delay = 0,
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3";
}) {
  const words = text.split(" ");
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: delay + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
            {i < words.length - 1 ? "\u00a0" : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/* Number ticker: counts up once when visible. */
export function NumberTicker({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setN(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref}>
      {n.toLocaleString("en-PK")}
      {suffix}
    </span>
  );
}

/* Magnetic button / link: leans toward the cursor on desktop. */
export function Magnetic({
  children,
  href,
  onClick,
  className,
  strength = 0.3,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16, mass: 0.4 });

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div ref={ref} style={{ x, y }} onPointerMove={move} onPointerLeave={leave} className="inline-block">
      {href ? (
        <Link href={href} className={className}>
          {children}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          {children}
        </button>
      )}
    </motion.div>
  );
}

/* Marquee: CSS-driven, pauses on hover. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = [...items, ...items];
  return (
    <div className={`overflow-hidden ${className ?? ""}`} aria-hidden>
      <div className="marquee-track flex w-max gap-14 whitespace-nowrap hover:[animation-play-state:paused]">
        {row.map((t, i) => (
          <span key={i} className="font-display text-4xl italic text-ivory/80 md:text-6xl">
            {t}
            <span className="ml-14 text-gold">&#9670;</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* Thin gold scroll progress bar. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[90] h-[2px] w-full origin-left bg-gold"
    />
  );
}

/* Desktop-only halo cursor. The native pointer stays visible. */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  const x = useSpring(useMotionValue(-100), { stiffness: 420, damping: 34, mass: 0.35 });
  const y = useSpring(useMotionValue(-100), { stiffness: 420, damping: 34, mass: 0.35 });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setEnabled(true);
    const move = (e: PointerEvent) => {
      x.set(e.clientX - 18);
      y.set(e.clientY - 18);
      const t = e.target as HTMLElement | null;
      setActive(Boolean(t?.closest("a, button, [role='button'], summary, [data-cursor]")));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y, reduce]);

  if (!enabled) return null;
  return (
    <motion.div
      aria-hidden
      style={{ x, y }}
      className="pointer-events-none fixed left-0 top-0 z-[130] hidden md:block"
    >
      <motion.div
        animate={{ scale: active ? 1.7 : 1, opacity: active ? 0.9 : 0.55 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="h-9 w-9 rounded-full border border-gold"
      />
    </motion.div>
  );
}

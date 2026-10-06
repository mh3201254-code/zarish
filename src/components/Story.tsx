"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { KineticText, Magnetic } from "./fx";
import RingHero, { useRingSource } from "./RingHero";
import { useSettings } from "@/lib/store";

// The canvas (three + drei + shaders) is split into its own chunk and only
// requested on capable devices.
const GemCanvas = dynamic(() => import("./GemCanvas"), { ssr: false });

type Capability = { ready: boolean; can3D: boolean; lowPower: boolean };

function useCapability(): Capability {
  const [cap, setCap] = useState<Capability>({ ready: false, can3D: false, lowPower: true });
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let gl = false;
    try {
      const c = document.createElement("canvas");
      gl = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      gl = false;
    }
    const mem = nav.deviceMemory ?? 8;
    const cores = nav.hardwareConcurrency ?? 8;
    const saveData = Boolean(nav.connection?.saveData);
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const can3D = gl && !reduce && !saveData && mem >= 2 && cores >= 2;
    const lowPower = coarse || mem <= 4 || cores <= 4;
    const go = () => setCap({ ready: true, can3D, lowPower });
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(go);
    else setTimeout(go, 200);
  }, []);
  return cap;
}

/* If the 3D canvas ever throws (old GPU, blocked WebGL), fall back to the static gem
   instead of taking the whole page down. */
class CanvasBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("3D scene disabled:", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* Shown on low-power devices, reduced motion and before the canvas loads. */
function StaticGem() {
  return (
    <div className="absolute inset-0 grid place-items-center md:place-items-center md:pl-[30vw]" aria-hidden>
      <svg viewBox="0 0 200 240" className="h-[46vh] w-auto max-md:-mt-[18vh]">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff8aa0" />
            <stop offset="0.5" stopColor="#b3203f" />
            <stop offset="1" stopColor="#5c0e1f" />
          </linearGradient>
          <linearGradient id="sr" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8d6c2a" />
            <stop offset="0.4" stopColor="#f0dba0" />
            <stop offset="1" stopColor="#7a5a1f" />
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="120" rx="96" ry="34" fill="none" stroke="url(#sr)" strokeWidth="4" transform="rotate(-18 100 120)" />
        <polygon points="100,18 170,84 100,220 30,84" fill="url(#sg)" stroke="#f0dba0" strokeWidth="1.5" />
        <polygon points="100,18 128,84 100,220 72,84" fill="#fff" opacity="0.16" />
        <polyline points="30,84 170,84" stroke="#fff" strokeOpacity="0.35" />
      </svg>
    </div>
  );
}

function Panel({
  progress,
  from,
  to,
  side,
  children,
}: {
  progress: MotionValue<number>;
  from: number;
  to: number;
  side: "left" | "right";
  children: React.ReactNode;
}) {
  // Scroll-linked ranges must run from exactly 0 to 1, otherwise the browser
  // blends the missing end back to the element's base value.
  const fade = 0.05;
  const end = Math.min(to, 1);
  const holdsToEnd = to >= 1;
  const input = holdsToEnd ? [0, from, from + fade, 1] : [0, from, from + fade, end - fade, end, 1];
  const opacity = useTransform(progress, input, holdsToEnd ? [0, 0, 1, 1] : [0, 0, 1, 1, 0, 0]);
  const y = useTransform(progress, input, holdsToEnd ? [36, 36, 0, 0] : [36, 36, 0, 0, -36, -36]);
  return (
    <motion.div
      style={{ opacity, y }}
      className={`pointer-events-none absolute inset-x-0 bottom-0 top-auto z-10 md:inset-y-0 md:flex md:items-center ${side === "right" ? "md:justify-end" : ""}`}
    >
      <div className="container-x w-full">
        <div className={`pointer-events-auto max-w-md pb-16 md:pb-0 ${side === "right" ? "md:ml-auto" : ""}`}>{children}</div>
      </div>
    </motion.div>
  );
}

export default function Story() {
  const settings = useSettings();
  const reduce = useReducedMotion();
  const cap = useCapability();
  const ring = useRingSource();
  const wrap = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const still = useMotionValue(0);
  const progress = reduce ? still : scrollYProgress;

  useEffect(() => {
    if (!sticky.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "120px" });
    io.observe(sticky.current);
    return () => io.disconnect();
  }, []);

  const heroOpacity = useTransform(progress, [0, 0.16, 0.22, 1], [1, 1, 0, 0]);
  const heroY = useTransform(progress, [0, 0.22, 1], [0, -60, -60]);

  return (
    <section ref={wrap} aria-label="Introduction" className={reduce ? "relative" : "relative h-[460vh]"}>
      <div ref={sticky} className={reduce ? "relative min-h-[88vh]" : "sticky top-0 h-screen overflow-hidden"}>
        <div className="absolute inset-0 overflow-hidden bg-white" aria-hidden>
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/hero-jewellery.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-white/10" />
        </div>
        {/* A realistic ring image (public/hero-ring.png) wins. Without one, the 3D ruby gem is used. */}
        {ring ? (
          <RingHero progress={progress} source={ring} />
        ) : ring === null && cap.ready && cap.can3D ? (
          <CanvasBoundary fallback={<StaticGem />}>
            <GemCanvas progress={progress} lowPower={cap.lowPower} visible={visible} />
          </CanvasBoundary>
        ) : ring === null ? (
          <StaticGem />
        ) : null}

        {/* Hero */}
        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="absolute inset-0 z-10 flex items-end pb-20 md:items-center md:pb-0">
          <div className="container-x">
            <div className="max-w-xl">
              <p className="mb-5 text-[11px] uppercase tracking-[0.3em] text-muted">Fine jewellery, Pakistan</p>
              <KineticText
                as="h1"
                text={settings.hero_title || "Gold, worn for generations"}
                className="text-[clamp(3rem,7.5vw,6.4rem)] leading-[1]"
                delay={1.7}
              />
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 max-w-md text-base text-muted md:text-lg"
              >
                {settings.hero_subtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.45, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="mt-9 flex flex-wrap items-center gap-5"
              >
                <Magnetic href="/shop/" className="btn btn-gold px-9 py-4 text-[13px] uppercase tracking-[0.14em]">
                  Shop Collection
                </Magnetic>
                <Link href="/collections/" className="text-sm text-ivory underline decoration-gold underline-offset-[6px] hover:text-gold-soft">
                  See the collections
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {!reduce && (
          <>
            <Panel progress={progress} from={0.24} to={0.5} side={ring || (cap.ready && cap.can3D) ? "right" : "left"}>
              <StoryCopy title="Cut, set and polished by hand" text="Each stone is set and each edge finished by a single craftsperson, then checked against the design before it leaves the workshop. Slow work, and you can see it in the light." />
            </Panel>
            <Panel progress={progress} from={0.52} to={0.76} side="left">
              <StoryCopy title="Metal you can read about" text="Every product page lists its metal, stone and weight in grams, so you know exactly what you are buying before you order." />
            </Panel>
            <Panel progress={progress} from={0.78} to={1} side="left">
              <StoryCopy title="Made for the day, kept for the decades" text="Bridal sets are designed as a whole: necklace, earrings and tikka that sit together on camera and in person." cta />
            </Panel>
          </>
        )}
      </div>

      {reduce && (
        <div className="container-x grid gap-14 py-20 md:grid-cols-3">
          <StoryCopy title="Cut, set and polished by hand" text="Each stone is set and each edge finished by a single craftsperson, then checked against the design before it leaves the workshop." />
          <StoryCopy title="Metal you can read about" text="Every product page lists its metal, stone and weight in grams, so you know exactly what you are buying." />
          <StoryCopy title="Made for the day, kept for the decades" text="Bridal sets are designed as a whole: necklace, earrings and tikka that sit together." cta />
        </div>
      )}
    </section>
  );
}

function StoryCopy({ title, text, cta }: { title: string; text: string; cta?: boolean }) {
  return (
    <div>
      <h2 className="text-4xl md:text-6xl">{title}</h2>
      <p className="mt-5 text-muted md:text-lg">{text}</p>
      {cta && (
        <Link href="/shop/?category=bridal" className="btn btn-line mt-7">
          Explore bridal sets
        </Link>
      )}
    </div>
  );
}

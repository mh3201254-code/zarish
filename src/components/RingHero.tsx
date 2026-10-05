"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";

// Premium hero ring motion:
// - damped pointer tilt
// - scroll-linked parallax
// - subtle cinematic 3D sway
// - slow idle float
// The existing transparent ring asset is kept unchanged.
export const RING_CANDIDATES = [
  { src: "/hero-ring.webp", blend: false },
  { src: "/hero-ring.png", blend: false },
  { src: "/hero-ring-black.png", blend: true },
];

export type RingSource = { src: string; blend: boolean };

export function useRingSource(): RingSource | null | undefined {
  const [found, setFound] = useState<RingSource | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    (async () => {
      for (const c of RING_CANDIDATES) {
        const ok = await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img.naturalWidth > 0);
          img.onerror = () => resolve(false);
          img.src = c.src;
        });
        if (ok) {
          if (alive) setFound(c);
          return;
        }
      }
      if (alive) setFound(null);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return found;
}

const STOPS = [0, 1 / 3, 2 / 3, 1];

export default function RingHero({ progress, source }: { progress: MotionValue<number>; source: RingSource }) {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const on = () => setMobile(window.innerWidth < 768);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  // Pointer, normalised to -1..1, then damped for a luxury-camera feel.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 55, damping: 18, mass: 0.7 });
  const sy = useSpring(py, { stiffness: 55, damping: 18, mass: 0.7 });

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [px, py]);

  // Keep the existing story choreography; only the ring's presentation changes.
  const xs = mobile ? ["0vw", "0vw", "0vw", "0vw"] : ["19vw", "-19vw", "19vw", "17vw"];
  const ys = mobile ? ["-17vh", "-17vh", "-17vh", "-17vh"] : ["0vh", "0vh", "0vh", "0vh"];
  const baseX = useTransform(progress, STOPS, xs);
  const baseY = useTransform(progress, STOPS, ys);
  const scale = useTransform(progress, STOPS, [1, 1.28, 1.06, 1.12]);
  const spin = useTransform(progress, STOPS, [-8, 10, -14, 6]);
  const turn = useTransform(progress, STOPS, [-14, 26, -22, 12]);

  const tiltY = useTransform(sx, [-1, 1], [-14, 14]);
  const tiltX = useTransform(sy, [-1, 1], [10, -10]);
  const shiftX = useTransform(sx, [-1, 1], [-14, 14]);
  const shiftY = useTransform(sy, [-1, 1], [-10, 10]);
  const rotateY = useTransform([turn, tiltY], ([a, b]) => (a as number) + (b as number));

  const size = mobile ? "min(80vw, 380px)" : "min(44vw, 640px)";

  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center [perspective:1100px]" aria-hidden>
      <motion.div
        style={{ x: baseX, y: baseY, scale }}
        className="relative will-change-transform"
      >
        <motion.div
          style={{
            x: shiftX,
            y: shiftY,
            rotateX: tiltX,
            rotateY,
            rotateZ: spin,
            transformStyle: "preserve-3d",
          }}
          className="relative will-change-transform"
        >
          {/* A restrained cinematic light sweep, similar to a luxury product film. */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[74%] w-[18%] -translate-x-1/2 -translate-y-1/2 rotate-[18deg] rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,245,210,0.42),transparent)] blur-[12px] mix-blend-screen"
            animate={{ x: ["-210%", "210%"], opacity: [0, 0.8, 0] }}
            transition={{ duration: 5.8, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut" }}
          />

          {/* Nested 3D sway gives the flat transparent render a more dimensional product-film feel. */}
          <motion.div
            animate={{
              rotateY: [-7, 9, -6, 4, -7],
              rotateX: [0, 2, -1, 1, 0],
              scaleX: [1, 0.965, 1.015, 0.98, 1],
              y: [0, -12, 2, -7, 0],
            }}
            transition={{
              duration: 8.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative will-change-transform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={source.src}
              alt="A diamond ring"
              decoding="async"
              fetchPriority="high"
              draggable={false}
              style={{
                width: size,
                height: "auto",
                mixBlendMode: source.blend ? "screen" : undefined,
                filter: "drop-shadow(0 34px 44px rgba(0,0,0,0.38))",
              }}
            />
          </motion.div>

          {/* Fine diamond glints: kept subtle so the ring remains the hero. */}
          {GLINTS.map((g, i) => (
            <motion.span
              key={i}
              className="absolute block rounded-full bg-gold-soft"
              style={{
                left: g.x,
                top: g.y,
                width: g.s,
                height: g.s,
                boxShadow: "0 0 10px 2px rgba(230,207,147,0.9)",
              }}
              animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }}
              transition={{ duration: 2.8, repeat: Infinity, delay: g.d, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

const GLINTS = [
  { x: "28%", y: "22%", s: 5, d: 0.2 },
  { x: "64%", y: "18%", s: 4, d: 1.1 },
  { x: "78%", y: "46%", s: 6, d: 0.6 },
  { x: "20%", y: "58%", s: 4, d: 1.7 },
  { x: "52%", y: "72%", s: 5, d: 2.2 },
  { x: "40%", y: "34%", s: 3, d: 1.4 },
];

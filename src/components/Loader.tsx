"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// Intro loader (under 2s). Shown once per browser session, home page only.
export default function Loader() {
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    try {
      if (sessionStorage.getItem("zarish_intro")) return;
      sessionStorage.setItem("zarish_intro", "1");
    } catch {
      /* ignore */
    }
    setShow(true);
    document.documentElement.style.overflow = "hidden";
    const t = setTimeout(() => {
      setShow(false);
      document.documentElement.style.overflow = "";
    }, reduce ? 500 : 1700);
    return () => {
      clearTimeout(t);
      document.documentElement.style.overflow = "";
    };
  }, [reduce]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loader"
          role="status"
          aria-label="Loading ZARISH"
          className="fixed inset-0 z-[200] grid place-items-center bg-bg"
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
        >
          <div className="text-center">
            <div className="font-display text-5xl tracking-[0.18em] md:text-7xl" aria-hidden>
              {"ZARISH".split("").map((c, i) => (
                <motion.span
                  key={i}
                  className="gold-text inline-block"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.09, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {c}
                </motion.span>
              ))}
            </div>
            <motion.div
              className="mx-auto mt-6 h-px w-40 origin-left bg-gold"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

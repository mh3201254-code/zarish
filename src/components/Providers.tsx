"use client";

import { MotionConfig } from "motion/react";
import { StoreProvider } from "@/lib/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>{children}</StoreProvider>
    </MotionConfig>
  );
}

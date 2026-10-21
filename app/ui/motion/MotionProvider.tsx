"use client";

import { MotionConfig } from "motion/react";
import { motionEase, motionTiming } from "./config";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: motionTiming.base, ease: motionEase }}>
      {children}
    </MotionConfig>
  );
}

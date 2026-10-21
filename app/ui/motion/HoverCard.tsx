"use client";

import { motion, useReducedMotion } from "motion/react";
import { motionDistance, motionEase, motionTiming } from "./config";

export function HoverCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`motion-hover-card ${className ?? ""}`}
      whileHover={reduceMotion ? undefined : { y: -motionDistance.hover }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      transition={{ duration: motionTiming.fast, ease: motionEase }}
    >
      {children}
    </motion.div>
  );
}

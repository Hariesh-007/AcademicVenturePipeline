"use client";

import { motion, useReducedMotion } from "motion/react";
import { motionDistance, motionEase, motionTiming } from "./config";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
};

export function Reveal({ children, className, delay = 0, once = true }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`motion-reveal ${className ?? ""}`}
      initial={reduceMotion ? false : { opacity: 0, y: motionDistance.reveal }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.12, margin: "0px 0px -32px" }}
      transition={{ duration: motionTiming.slow, delay, ease: motionEase }}
    >
      {children}
    </motion.div>
  );
}

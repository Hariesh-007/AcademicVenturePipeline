"use client";

import { motion, useReducedMotion } from "motion/react";
import { motionDistance, motionEase, motionTiming } from "./config";

type ListElement = "div" | "ol" | "ul";
type ItemElement = "div" | "li";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: motionTiming.stagger } },
};

const item = {
  hidden: { opacity: 0, y: motionDistance.reveal },
  visible: { opacity: 1, y: 0 },
};

export function Stagger({ children, className, as = "div" }: {
  children: React.ReactNode;
  className?: string;
  as?: ListElement;
}) {
  const reduceMotion = useReducedMotion();
  const Component = as === "ol" ? motion.ol : as === "ul" ? motion.ul : motion.div;

  return (
    <Component
      className={`motion-stagger ${className ?? ""}`}
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.08, margin: "0px 0px -24px" }}
      variants={container}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({ children, className, as = "div" }: {
  children: React.ReactNode;
  className?: string;
  as?: ItemElement;
}) {
  const reduceMotion = useReducedMotion();
  const Component = as === "li" ? motion.li : motion.div;

  return (
    <Component
      className={`motion-stagger-item ${className ?? ""}`}
      variants={reduceMotion ? undefined : item}
      transition={{ duration: motionTiming.base, ease: motionEase }}
    >
      {children}
    </Component>
  );
}

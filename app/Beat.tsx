"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

// Sets data-in once the section enters the viewport; CSS (landing.module.css) does all the motion.
// `eager` sections (the hero) render with data-in already set, so they animate on load without JS.
export default function Beat({ className, eager, id, children }: { className: string; eager?: boolean; id?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [entered, setEntered] = useState(Boolean(eager));

  useEffect(() => {
    const el = ref.current;
    if (!el || eager) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.in = "";
        setEntered(true);
        io.disconnect();
      },
      { rootMargin: "0px 0px -25% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      data-beat=""
      data-in={entered ? "" : undefined}
      initial={false}
      animate={reduce || entered ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 28, scale: 0.985 }}
      transition={{ duration: reduce ? 0 : 0.62, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

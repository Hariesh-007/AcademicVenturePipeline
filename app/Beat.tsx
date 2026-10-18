"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Sets data-in once the section enters the viewport; CSS (landing.module.css) does all the motion.
// `eager` sections (the hero) render with data-in already set, so they animate on load without JS.
export default function Beat({ className, eager, children }: { className: string; eager?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || eager) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.in = "";
        io.disconnect();
      },
      { rootMargin: "0px 0px -25% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);

  return (
    <section ref={ref} className={className} data-beat="" data-in={eager ? "" : undefined}>
      {children}
    </section>
  );
}

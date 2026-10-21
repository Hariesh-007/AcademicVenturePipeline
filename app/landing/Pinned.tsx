"use client";

import { useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useMotionValue, useScroll, type MotionValue } from "motion/react";
import s from "@/app/landing.module.css";

// Must match the `.pin` media query in landing.module.css — CSS does the sticking, this only decides
// whether scroll drives the scene or it renders its end state (mobile / reduced motion / SSR).
const QUERY = "(min-width: 900px) and (min-height: 820px) and (prefers-reduced-motion: no-preference)";
// Hydration-safe media query: false on the server and the first client render, then live.
export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}
export const useReduced = () => useMedia("(prefers-reduced-motion: reduce)");

// Sticky scene: the outer box is `length` tall, the stage sticks for its whole run, and
// children get 0→1 progress. Unpinned, progress is a constant 1 so every scene shows its finished state.
export default function Pinned({
  length,
  label,
  children,
}: {
  length: string;
  label: string;
  children: (progress: MotionValue<number>, pinned: boolean) => ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const pinned = useMedia(QUERY);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const done = useMotionValue(1);

  return (
    <section ref={ref} aria-label={label} className={s.pin} style={{ "--len": length } as CSSProperties}>
      <div className={s.stage}>{children(pinned ? scrollYProgress : done, pinned)}</div>
    </section>
  );
}

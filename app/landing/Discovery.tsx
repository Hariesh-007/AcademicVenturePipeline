"use client";

import { useRef } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import s from "@/app/landing.module.css";
import { useReduced } from "./Pinned";
import { DISCOVERY_LINKS, TECH } from "./data";

const W = 560;
const H = 360;
const ys = DISCOVERY_LINKS.map((_, n) => 30 + (n * (H - 60)) / (DISCOVERY_LINKS.length - 1));

// A patent leaves the archive and is re-read as a technology: one node with six kinds of evidence behind it.
export default function Discovery() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReduced();
  const on = seen || !!reduce;
  const t = (delay: number) => ({ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : delay, ease: [0.2, 0.7, 0.2, 1] as const });

  return (
    <div ref={ref} className={s.discovery}>
      <motion.article
        className={s.doc}
        initial={{ x: -40, opacity: 0 }}
        animate={on ? { x: 0, opacity: 1 } : undefined}
        transition={t(0)}
      >
        <p className={s.kicker}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={on ? "tech" : "patent"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={t(on ? 0.6 : 0)}
              className={on ? s.blue : undefined}
            >
              {on ? "Technology" : "Patent"}
            </motion.span>
          </AnimatePresence>
        </p>
        <h3 className={s.docTitle}>{TECH.name}</h3>
        <p className={s.ref}>{TECH.ref}</p>
        <p className={s.claim}>
          1. A catalyst composition comprising copper and zinc oxide on a modified support, wherein&hellip;
        </p>
        <p className={s.ref}>Illustrative example</p>
      </motion.article>

      <svg className={s.fan} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Connected to: ${DISCOVERY_LINKS.join(", ")}`}>
        {ys.map((y, n) => (
          <g key={n}>
            <motion.path
              d={`M0 ${H / 2} C ${W * 0.35} ${H / 2}, ${W * 0.4} ${y}, ${W * 0.62} ${y}`}
              fill="none"
              stroke="var(--blue)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={on ? { pathLength: 1 } : undefined}
              transition={t(0.9 + n * 0.08)}
            />
            <motion.g initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : undefined} transition={t(1.3 + n * 0.08)}>
              <circle cx={W * 0.62} cy={y} r="4" fill="var(--blue)" />
              <text x={W * 0.62 + 14} y={y + 4} className={s.svgLabel}>{DISCOVERY_LINKS[n]}</text>
            </motion.g>
          </g>
        ))}
      </svg>
    </div>
  );
}

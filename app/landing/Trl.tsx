"use client";

import { useState, type ReactNode } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import s from "@/app/landing.module.css";
import Pinned, { useReduced } from "./Pinned";
import { EVIDENCE, MISSING, TECH, TRL_LEVELS } from "./data";

// Fades/lifts its child in over one slice of the scene's scroll progress.
function Reveal({ p, from, to, children, className }: { p: MotionValue<number>; from: number; to: number; children: ReactNode; className?: string }) {
  const opacity = useTransform(p, [from, to], [0, 1]);
  const y = useTransform(p, [from, to], [12, 0]);
  return <motion.li className={className} style={{ opacity, y }}>{children}</motion.li>;
}

// Scroll beats: 0–.3 marker travels 1→4 · .3–.55 evidence · .55–.8 missing · .8–.95 next level emphasised.
function Trl({ progress: p }: { progress: MotionValue<number> }) {
  const [picked, setPicked] = useState(TECH.trl);
  const level = TRL_LEVELS[picked - 1];
  // Marker is one column wide; translating by 100% moves it exactly one level.
  const markerX = useTransform(p, [0.04, 0.3], ["0%", `${(TECH.trl - 1) * 100}%`]);
  const next = useTransform(p, [0.8, 0.95], [0, 1]);
  // "Current" only lights up once the marker has actually arrived.
  const [arrived, setArrived] = useState(() => p.get() >= 0.3);
  useMotionValueEvent(p, "change", (v) => setArrived(v >= 0.3));

  return (
    <div className={s.trl}>
      <div className={s.scale}>
        <motion.div className={s.marker} style={{ x: markerX }} aria-hidden="true">
          <span>Today</span>
        </motion.div>
        <ol className={s.levels}>
          {TRL_LEVELS.map(({ n, title }) => {
            const state = n < TECH.trl ? "past" : n === TECH.trl ? (arrived ? "now" : "past") : n === TECH.trl + 1 ? "next" : "later";
            return (
              <li key={n} data-state={state}>
                <button
                  type="button"
                  aria-pressed={picked === n}
                  aria-label={`TRL ${n}: ${title}${n === TECH.trl ? " (current)" : ""}`}
                  onClick={() => setPicked(n)}
                >
                  <span className={s.levelNo}>{n}</span>
                  <span className={s.levelTitle}>{title}</span>
                </button>
                {state === "next" && (
                  <>
                    <motion.span className={s.nextBar} style={{ scaleX: next }} aria-hidden="true" />
                    <motion.span className={s.nextTag} style={{ opacity: next }} aria-hidden="true">Next</motion.span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <p className={s.levelDetail} aria-live="polite">
        <strong>TRL {level.n} · {level.title}.</strong> Typical evidence: {level.evidence}
      </p>

      <div className={s.trlCols}>
        <div>
          <h3 className={s.colHead}>What supports TRL {TECH.trl}</h3>
          <ul className={s.cards}>
            {EVIDENCE.map((e, n) => (
              <Reveal key={e.label} p={p} from={0.3 + n * 0.07} to={0.4 + n * 0.07} className={s.have}>
                <span>{e.label}</span>
                <span className={s.src}>{e.source}</span>
              </Reveal>
            ))}
          </ul>
        </div>
        <div>
          <h3 className={s.colHead}>Missing to reach TRL {TECH.trl + 1}</h3>
          <ul className={s.cards}>
            {MISSING.map((m, n) => (
              <Reveal key={m} p={p} from={0.55 + n * 0.07} to={0.65 + n * 0.07} className={s.gap}>
                <span>{m}</span>
                <span className={s.src}>Missing</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Server-rendered heading goes in as children; the render prop stays on the client.
export default function TrlScene({ children }: { children: ReactNode }) {
  const reduce = useReduced();
  return (
    <Pinned length="260vh" label="Technology readiness level">
      {(p, pinned) => (
        <>
          {children}
          <motion.div
            initial={!pinned && !reduce ? { opacity: 0, y: 18, scale: 0.985 } : false}
            whileInView={!pinned && !reduce ? { opacity: 1, y: 0, scale: 1 } : undefined}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: reduce ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <Trl key={String(pinned)} progress={p} />
          </motion.div>
        </>
      )}
    </Pinned>
  );
}

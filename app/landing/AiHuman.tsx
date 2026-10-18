"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import s from "@/app/landing.module.css";
import { useReduced } from "./Pinned";

const AI = ["Organise", "Categorise", "Synthesise"];
const HUMAN = ["Review", "Challenge", "Interpret", "Validate"];
const AI_Y = 60;
const HU_Y = 220;
const aiX = (n: number) => 70 + n * 150;
const huX = (n: number) => 70 + n * 120;
const DECIDE_X = 590;
// Evidence runs along the AI layer, is handed down as a draft, then moves through the human layer to the decision.
const HANDOFF = `M ${aiX(2)} ${AI_Y} C ${aiX(2) + 80} ${AI_Y}, ${aiX(2) + 80} ${(AI_Y + HU_Y) / 2}, 330 ${(AI_Y + HU_Y) / 2} S 20 ${HU_Y}, ${huX(0)} ${HU_Y}`;

export default function AiHuman() {
  const ref = useRef<SVGSVGElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReduced();
  const on = seen || !!reduce;
  const t = (delay: number, duration = 0.8) => ({ duration: reduce ? 0 : duration, delay: reduce ? 0 : delay, ease: "easeInOut" as const });

  return (
    <svg
      ref={ref}
      className={s.flow}
      viewBox="0 0 640 290"
      role="img"
      aria-label="AI organises, categorises and synthesises evidence, then hands a draft to people, who review, challenge, interpret, validate and make the decision."
    >
      <text x="0" y="18" className={s.svgCap}>AI layer</text>
      <text x="0" y={HU_Y - 42} className={s.svgCap}>Human layer</text>

      {/* AI lane */}
      <line x1="20" y1={AI_Y} x2={aiX(2)} y2={AI_Y} stroke="var(--blue)" strokeWidth="1" />
      {/* the travelling pulse: a short dash moving along the lane, twice, then it stops */}
      {!reduce && (
        <motion.path
          d={`M20 ${AI_Y} H ${aiX(2)}`}
          fill="none"
          stroke="var(--blue)"
          strokeWidth="3"
          initial={{ pathLength: 0.12, pathOffset: 0, opacity: 0 }}
          animate={on ? { pathOffset: [0, 0.88], opacity: [0, 1, 1, 0] } : undefined}
          transition={{ duration: 0.9, repeat: 1, ease: "easeInOut", delay: 0.1 }}
        />
      )}
      {AI.map((label, n) => (
        <g key={label}>
          <circle cx={aiX(n)} cy={AI_Y} r="7" fill="#fff" stroke="var(--blue)" strokeWidth="1.5" />
          <text x={aiX(n)} y={AI_Y + 30} textAnchor="middle" className={s.svgLabel}>{label}</text>
        </g>
      ))}

      {/* hand-off: AI produces a draft, it does not reach the decision */}
      <motion.path
        d={HANDOFF}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1"
        strokeDasharray="4 4"
        initial={{ opacity: 0 }}
        animate={on ? { opacity: 1 } : undefined}
        transition={t(1.4, 0.5)}
      />
      <motion.text
        x="420"
        y={(AI_Y + HU_Y) / 2 + 4}
        className={s.svgCap}
        initial={{ opacity: 0 }}
        animate={on ? { opacity: 1 } : undefined}
        transition={t(1.5, 0.4)}
      >
        Draft, with sources
      </motion.text>

      {/* human lane */}
      <motion.line
        x1={huX(0)}
        y1={HU_Y}
        x2={DECIDE_X}
        y2={HU_Y}
        stroke="var(--ink)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={on ? { pathLength: 1 } : undefined}
        transition={t(1.8, 0.9)}
      />
      {HUMAN.map((label, n) => (
        <motion.g key={label} initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : undefined} transition={t(1.8 + n * 0.18, 0.3)}>
          <circle cx={huX(n)} cy={HU_Y} r="7" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
          <text x={huX(n)} y={HU_Y + 30} textAnchor="middle" className={s.svgLabel}>{label}</text>
        </motion.g>
      ))}
      <motion.g initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : undefined} transition={t(2.6, 0.4)}>
        <circle cx={DECIDE_X} cy={HU_Y} r="12" fill="var(--ink)" />
        <circle cx={DECIDE_X} cy={HU_Y} r="18" fill="none" stroke="var(--orange)" strokeWidth="2" />
        <text x={DECIDE_X} y={HU_Y + 42} textAnchor="middle" className={s.svgStrong}>Decide</text>
      </motion.g>
    </svg>
  );
}

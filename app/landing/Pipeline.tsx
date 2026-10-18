"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValueEvent, type MotionValue } from "motion/react";
import s from "@/app/landing.module.css";
import Pinned from "./Pinned";
import { EVIDENCE, MISSING, PIPELINE, TECH } from "./data";

const CAPTION = [
  "An archived patent is opened as a technology, not a file.",
  "Sources are attached: lab records, papers, the patent itself.",
  "Each source is read and tagged by what it actually shows.",
  "The evidence is weighed against the readiness scale.",
  "What is still unknown is written down, not smoothed over.",
  "The same record becomes a dossier for a human reviewer.",
];
const TAGS = ["Performance", "Stability", "IP scope"];

const Row = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.li
    layout
    className={className}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.35 }}
  >
    {children}
  </motion.li>
);

// One record, six states. Scroll advances the stage; the card is never swapped, only extended.
function Pipeline({ progress }: { progress: MotionValue<number> }) {
  const at = (v: number) => Math.min(PIPELINE.length - 1, Math.floor(v * PIPELINE.length));
  const [stage, setStage] = useState(() => at(progress.get()));
  useMotionValueEvent(progress, "change", (v) => setStage(at(v)));

  return (
    <div className={s.pipeline}>
      <div className={s.railWrap}>
        <ol className={s.rail}>
          {PIPELINE.map((name, n) => (
            <li key={name} data-state={n < stage ? "done" : n === stage ? "now" : "next"} aria-current={n === stage ? "step" : undefined}>
              <span className={s.railNo}>{n + 1}</span> {name}
            </li>
          ))}
        </ol>
        <motion.span className={s.railBar} style={{ scaleX: progress }} aria-hidden="true" />
      </div>
      <p className={s.caption}>{CAPTION[stage]}</p>

      <motion.article layout className={s.record} data-dossier={stage === 5 ? "" : undefined} transition={{ duration: 0.4 }}>
        <motion.header layout className={s.recordHead}>
          <div>
            <p className={s.kicker}>{stage === 5 ? "Technology dossier · draft for review" : "Technology record"}</p>
            <h3 className={s.recordName}>{TECH.short}</h3>
          </div>
          <AnimatePresence>
            {stage >= 3 && (
              <motion.span
                className={s.trlBadge}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                TRL {TECH.trl}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.header>

        <ul className={s.recordRows}>
          <AnimatePresence>
            {stage >= 1 &&
              EVIDENCE.map((e, n) => (
                <Row key={e.label} className={s.have}>
                  <span>{e.label}</span>
                  <span className={s.src}>
                    {stage >= 2 ? <em className={s.tag}>{TAGS[n]}</em> : null} {e.source}
                  </span>
                </Row>
              ))}
            {stage >= 4 &&
              MISSING.map((m) => (
                <Row key={m} className={s.gap}>
                  <span>{m}</span>
                  <span className={s.src}>Missing</span>
                </Row>
              ))}
          </AnimatePresence>
        </ul>

        <AnimatePresence>
          {stage === 5 && (
            <motion.footer className={s.recordFoot} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Ready for reviewer · every line links to its source
            </motion.footer>
          )}
        </AnimatePresence>
      </motion.article>
    </div>
  );
}

// Server-rendered heading goes in as children; the render prop stays on the client.
export default function PipelineScene({ children }: { children: ReactNode }) {
  return (
    <Pinned length="200vh" label="The pipeline">
      {(p, pinned) => (
        <>
          {children}
          {/* remount when pinning toggles so the stage re-reads the new progress source */}
          <Pipeline key={String(pinned)} progress={p} />
        </>
      )}
    </Pinned>
  );
}

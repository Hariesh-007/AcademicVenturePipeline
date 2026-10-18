"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LayoutGroup, motion, useInView } from "motion/react";
import s from "@/app/landing.module.css";
import { useReduced } from "./Pinned";
import { EVIDENCE, MISSING, TECH } from "./data";

const ROWS = 5;
const COLS = 24;
const PICK = COLS + 17; // the one document that gets discovered
// Deterministic pseudo-random spine heights/years so SSR and client agree.
const spine = (k: number) => ({ h: 62 + ((k * 37) % 38), year: 2009 + ((k * 7) % 14), no: String((k * 53) % 97).padStart(3, "0") });

// Archive wall → one spine turns orange, leaves its slot and opens into a technology profile (shared layoutId).
export default function Hero() {
  const reduce = useReduced();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.5 });
  const [open, setOpen] = useState(false);

  // Let the visitor see the archive first, then pull the one document out.
  useEffect(() => {
    if (!seen && !reduce) return;
    const t = setTimeout(() => setOpen(true), reduce ? 0 : 1600);
    return () => clearTimeout(t);
  }, [seen, reduce]);

  const morph = { type: "spring", stiffness: 120, damping: 22 } as const;

  return (
    <LayoutGroup>
      <div ref={ref} className={s.archive} data-open={open ? "" : undefined}>
        <div className={s.shelves} aria-hidden="true">
          {Array.from({ length: ROWS * COLS }, (_, k) => {
            const { h, year, no } = spine(k);
            const style = { "--h": `${h}%`, "--r": Math.floor(k / COLS) } as CSSProperties;
            if (k !== PICK) {
              return (
                <span key={k} className={s.spine} style={style}>
                  <span>{year}/{no}</span>
                </span>
              );
            }
            return (
              <span key={k} className={s.slot} style={style}>
                {!open && (
                  <motion.span layoutId="tech" transition={morph} className={`${s.spine} ${s.picked}`}>
                    <span>2019/041</span>
                  </motion.span>
                )}
              </span>
            );
          })}
        </div>

        {open && (
          <motion.article layoutId="tech" transition={morph} className={s.profile} aria-label="Illustrative technology profile">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.45, duration: 0.4 }}
            >
              <p className={s.kicker}>Technology profile · Illustrative example</p>
              <h2 className={s.profileName}>{TECH.name}</h2>
              <p className={s.ref}>{TECH.ref}</p>
              <dl className={s.facts}>
                <div><dt>Readiness</dt><dd>TRL {TECH.trl} · validated in the lab</dd></div>
                <div><dt>Evidence</dt><dd>{EVIDENCE.length} sources linked</dd></div>
                <div><dt>Open gaps</dt><dd>{MISSING.length} to investigate</dd></div>
                <div><dt>Next</dt><dd>Reviewer to confirm TRL</dd></div>
              </dl>
            </motion.div>
          </motion.article>
        )}
      </div>
    </LayoutGroup>
  );
}

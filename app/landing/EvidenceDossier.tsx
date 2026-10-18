"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import s from "@/app/landing.module.css";
import Pinned from "./Pinned";
import { EVIDENCE, GRAPH_NODES, MISSING, TECH, TRL_LEVELS } from "./data";

const CX = 400;
const CY = 230;
const R = 190;
const nodes = GRAPH_NODES.map((label, n) => {
  const a = -Math.PI / 2 + (n * 2 * Math.PI) / GRAPH_NODES.length;
  return { label, x: CX + Math.cos(a) * R * 1.35, y: CY + Math.sin(a) * R };
});

function Edge({ p, n, x, y, label }: { p: MotionValue<number>; n: number; x: number; y: number; label: string }) {
  const from = 0.04 + n * 0.05;
  const pathLength = useTransform(p, [from, from + 0.12], [0, 1]);
  const opacity = useTransform(p, [from + 0.08, from + 0.14], [0, 1]);
  return (
    <g>
      <motion.line x1={CX} y1={CY} x2={x} y2={y} stroke="var(--blue)" strokeWidth="1" style={{ pathLength }} />
      <motion.g style={{ opacity }}>
        <circle cx={x} cy={y} r="5" fill="var(--blue)" />
        <text x={x} y={y + (y < CY ? -14 : 24)} textAnchor="middle" className={s.svgLabel}>{label}</text>
      </motion.g>
    </g>
  );
}

// Graph draws (0–.45), collapses into its centre (.45–.6), and the dossier opens out of that point (.55–.75).
function EvidenceDossier({ progress: p, pinned }: { progress: MotionValue<number>; pinned: boolean }) {
  const graphScale = useTransform(p, [0.45, 0.6], [1, 0.15]);
  const graphOpacity = useTransform(p, [0.5, 0.6], [1, 0]);
  const docScale = useTransform(p, [0.55, 0.75], [0.3, 1]);
  const docOpacity = useTransform(p, [0.55, 0.68], [0, 1]);

  return (
    <div className={s.evidence} data-pinned={pinned ? "" : undefined}>
      <motion.div className={s.graph} style={pinned ? { scale: graphScale, opacity: graphOpacity } : undefined}>
        <svg viewBox="0 0 800 470" role="img" aria-label={`Technology connected to: ${GRAPH_NODES.join(", ")}`}>
          {nodes.map((nd, n) => (
            <Edge key={nd.label} p={p} n={n} {...nd} />
          ))}
          <circle cx={CX} cy={CY} r="34" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx={CX} cy={CY} r="40" fill="none" stroke="var(--orange)" strokeWidth="2" />
          <text x={CX} y={CY + 4} textAnchor="middle" className={s.svgStrong}>Technology</text>
        </svg>
      </motion.div>

      <motion.div className={s.dossierWrap} style={pinned ? { scale: docScale, opacity: docOpacity } : undefined}>
        <Dossier />
      </motion.div>
    </div>
  );
}

function Dossier() {
  const trl = TRL_LEVELS[TECH.trl - 1];
  return (
    <article className={s.dossier} aria-label="Example technology dossier">
      <header className={s.dHead}>
        <div>
          <p className={s.kicker}>Technology dossier · Illustrative example</p>
          <h3 className={s.dTitle}>{TECH.name}</h3>
          <p className={s.ref}>{TECH.ref}</p>
        </div>
        <p className={s.status}>Draft · awaiting reviewer sign-off</p>
      </header>

      <div className={s.dGrid}>
        <section className={s.dWide}>
          <h4>Plain-language synopsis</h4>
          <p>
            A copper–zinc catalyst that turns captured CO₂ and hydrogen into methanol at lower temperatures than the usual
            industrial process. Lab results are consistent across sources. It has not yet been tested outside the lab.
          </p>
        </section>
        <section className={s.dTrl}>
          <h4>TRL recommendation</h4>
          <p className={s.dBig}>{TECH.trl}</p>
          <p>{trl.title}. Suggested from 3 sources. Reviewer to confirm.</p>
        </section>

        <section>
          <h4>Evidence</h4>
          <ol className={s.dList}>
            {EVIDENCE.map((e, n) => (
              <li key={e.label}>
                {e.label} <span className={s.cite}>[{n + 1}] {e.source}</span>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h4>IP analysis</h4>
          <p>Claims cover the catalyst composition and how it is prepared. Process-use claims are narrower. Freedom to operate not yet assessed. <span className={s.cite}>[3]</span></p>
        </section>
        <section>
          <h4>Market scope</h4>
          <p>Green methanol for chemicals and shipping fuel. Fit depends on access to low-cost hydrogen and captured CO₂.</p>
        </section>

        <section>
          <h4>Bottlenecks</h4>
          <p>Catalyst deactivation from sulphur in real gas streams. Cost of green hydrogen.</p>
        </section>
        <section>
          <h4>Policy &amp; regulation</h4>
          <p>Methanol fuel and chemical standards apply. Eligibility for carbon-utilisation incentives varies by jurisdiction.</p>
        </section>
        <section>
          <h4>TEA / LCA highlights</h4>
          <p>Lab-scale cost estimate only. Net emissions benefit depends on the hydrogen source; LCA pending.</p>
        </section>

        <section className={s.dMissing}>
          <h4>Missing evidence</h4>
          <ul>
            {MISSING.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      </div>

      <footer className={s.dFoot}>Every statement links to its source · Reviewer: unassigned</footer>
    </article>
  );
}

// Server-rendered heading goes in as children; the render prop stays on the client.
export default function EvidenceDossierScene({ children }: { children: ReactNode }) {
  return (
    <Pinned length="280vh" label="Evidence graph and dossier">
      {(p, pinned) => (
        <>
          {children}
          <EvidenceDossier progress={p} pinned={pinned} />
        </>
      )}
    </Pinned>
  );
}

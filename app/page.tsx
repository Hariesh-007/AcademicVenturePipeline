import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import Beat from "./Beat";
import AiHuman from "./landing/AiHuman";
import Discovery from "./landing/Discovery";
import EvidenceDossierScene from "./landing/EvidenceDossier";
import Hero from "./landing/Hero";
import PipelineScene from "./landing/Pipeline";
import TrlScene from "./landing/Trl";
import s from "./landing.module.css";
import { BrandLink, Lockup } from "./_brand/Logo";
import { currentSession } from "@/lib/currentSession";

// the team inbox; set NEXT_PUBLIC_CONTACT_EMAIL per deployment
const DEMO_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "team@avp.example";

const i = (n: number) => ({ "--i": n }) as CSSProperties;
const Arrow = () => <span className={s.arrow}> →</span>;

// Interactive Explainer Tooltip for key textual concepts
function Term({
  word,
  tag,
  explainer,
}: {
  word: ReactNode;
  tag: string;
  explainer: string;
}) {
  return (
    <span className={s.term} tabIndex={0}>
      {word}
      <span className={s.termBox} role="tooltip">
        <span className={s.termTag}>{tag}</span>
        <span className={s.termDesc}>{explainer}</span>
      </span>
    </span>
  );
}

// Line-mask statement; copy is pre-split so nothing is measured at runtime.
function Lines({ lines, from = 0 }: { lines: ReactNode[]; from?: number }) {
  return lines.map((l, n) => (
    <span key={n} className={s.line}>
      <span style={i(from + n)}>{l}</span>
    </span>
  ));
}

// Mono stair: each step is indented 3ch further; every step but the last gets an orange joint.
function Chain({ steps, from }: { steps: ReactNode[]; from: number }) {
  return (
    <div className={s.chain}>
      {steps.map((step, n) => {
        const last = n === steps.length - 1;
        return (
          <p key={n} style={i(from + n)} className={last ? s.strong : undefined}>
            {step}
            {!last && <Arrow />}
          </p>
        );
      })}
    </div>
  );
}

function Stack({ items, from }: { items: { text: ReactNode; low?: boolean }[]; from: number }) {
  return (
    <div className={s.stack}>
      {items.map((it, n) => (
        <p key={n} style={i(from + n)} className={it.low ? s.low : undefined}>
          {it.text}
        </p>
      ))}
    </div>
  );
}

// Heading for the full-width scenes: mono name, then the statement.
function SceneHead({ name, children, sub }: { name: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <header className={s.sceneHead}>
      <p className={s.name}>{name}</p>
      <h2 className={s.sceneLead}>{children}</h2>
      {sub && <p className={s.sceneSub}>{sub}</p>}
    </header>
  );
}

export default async function Landing() {
  // signed-in visitors get a way straight back to their dashboard instead of sign-up prompts
  const signedIn = (await currentSession()) !== null;
  return (
    <div className={s.page}>
      <noscript>
        <style>{`[data-beat], [data-beat] *, [data-beat] *::after { animation: none !important; opacity: 1 !important; clip-path: none !important; transform: none !important; }`}</style>
      </noscript>

      <nav className={s.nav}>
        <Link href="/" aria-label="Academic Venture Pipeline home"><BrandLink size={26} /></Link>
        {signedIn ? (
          <Link href="/app">Open your dashboard →</Link>
        ) : (
          <span className={s.navLinks}>
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Become an analyser →</Link>
          </span>
        )}
      </nav>

      {/* 1 — Archive → discovered */}
      <Beat className={s.hero} eager>
        <h1 className={s.heroLead}>
          <Lines
            lines={[
              "Turn overlooked university",
              "research into",
              "investment-ready evidence.",
            ]}
          />
        </h1>
        <p className={s.heroAudience}>For technology-transfer teams, venture builders, and research investors.</p>
        <p className={s.heroSub}>
          <Lines
            from={3}
            lines={[
              <>
                AVP validates university IP, maps the gaps, and prepares{" "}
                <Term
                  word="review-ready dossiers"
                  tag="Evidence Dossier"
                  explainer="Every commercial claim is cross-referenced with lab trials, prior art, and market data for a human reviewer."
                />{" "}
                for commercial decisions.
              </>,
            ]}
          />
        </p>
        <div className={s.heroActions}>
          <a className={s.primary} href={`mailto:${DEMO_EMAIL}`}>See an evidence dossier in action</a>
          {signedIn
            ? <Link className={s.secondary} href="/app">Open your dashboard</Link>
            : <a className={s.secondary} href="#workflow">Explore the workflow</a>}
        </div>
        <aside className={s.trust} aria-label="Pilot partners and product approach">
          <p>Designed for evidence-led commercialisation</p>
          <ul>
            <li>Piloting with KL University</li>
            <li>MNR University</li>
            <li>SP heterocat lab, IITH</li>
          </ul>
        </aside>
        <Hero />
      </Beat>

      {/* 2 — The problem */}
      <Beat className={s.beat}>
        <div className={s.left}>
          <p className={s.name}>The bottleneck</p>
          <h2 className={s.lead}>
            <Lines lines={["Invention isn’t", "missing.", "Clear validation", "is."]} />
          </h2>
        </div>
        <div className={s.right}>
          <Chain
            from={4}
            steps={[
              "Research",
              "Prototype",
              "Patent",
              <Term
                key="s"
                word={<span className={s.shelved}>Shelved</span>}
                tag="Pipeline Deadlock"
                explainer="Over 95% of academic patents expire uncommercialised because validation gap analysis takes too long."
              />,
            ]}
          />
          <Stack
            from={8}
            items={[
              { text: <>Breakthroughs stay locked in university archives without market signals.</> },
              { text: "AVP builds the evidence trail to move them forward.", low: true },
            ]}
          />
        </div>
      </Beat>

      {/* 3 — Patent → technology */}
      <Beat id="workflow" className={s.wide}>
        <SceneHead name="The discovery">One patent, read again, turns out to be a technology with a trail.</SceneHead>
        <Discovery />
      </Beat>

      {/* 4 — Pipeline (pinned) */}
      <PipelineScene>
        <SceneHead name="The pipeline">Six stages. One record, transformed at each.</SceneHead>
      </PipelineScene>

      {/* 5 — AI + human */}
      <Beat className={s.beat}>
        <div className={s.left}>
          <p className={s.name}>Intelligence & Judgement</p>
          <h2 className={s.lead}>
            <Lines lines={["AI drafts.", "Experts decide."]} />
          </h2>
        </div>
        <div className={`${s.right} ${s.rightWide}`}>
          <AiHuman />
          <Stack
            from={4}
            items={[
              { text: <>AI accelerates synthesis — human specialists make every strategic call.</> },
            ]}
          />
        </div>
      </Beat>

      {/* 6 — TRL (pinned) */}
      <TrlScene>
        <SceneHead
          name="Readiness Levels"
          sub={
            <>
              Interactive matrix of{" "}
              <Term
                word="TRL benchmarks"
                tag="Technology Readiness Level"
                explainer="A 1–9 maturity framework measuring lab proof-of-concept through to flight/field-validated commercial readiness."
              />{" "}
              and validation criteria.
            </>
          }
        >
          Where does this technology stand today?
        </SceneHead>
      </TrlScene>

      {/* 7 → 8 — Evidence graph collapses into the dossier (pinned) */}
      <EvidenceDossierScene>
        <SceneHead name="Evidence → dossier">Every assertion maps directly to primary sources.</SceneHead>
      </EvidenceDossierScene>

      {/* 9 — Possibility, not automation */}
      <Beat className={s.beat}>
        <div className={s.left}>
          <p className={s.name}>Pathway</p>
          <h2 className={s.lead}>
            <Lines lines={["From lab benchmark", "to market reality."]} />
          </h2>
        </div>
        <div className={s.right}>
          <Chain
            from={4}
            steps={[
              "Technology",
              "Validation",
              "Commercial Path",
              "Partnership",
              "Readiness",
              <Term
                key="p"
                word={<span className={s.possible}>Spinout</span>}
                tag="New Venture"
                explainer="A newly incorporated venture backed by university IP, venture capital, and commercial leadership."
              />,
            ]}
          />
          <Stack
            from={10}
            items={[
              { text: <>Empowering inventors, universities, and investors with structured clarity.</> },
            ]}
          />
        </div>
      </Beat>

      {/* 10 — Closing */}
      <Beat className={s.closing}>
        <p className={s.closeLines}>
          <Lines
            lines={[
              "Research should not end at publication.",
              "A patent should not end at filing.",
              "Potential should not end in an archive.",
            ]}
          />
        </p>
        <h2 className={s.closeLast}>
          <Lines from={3} lines={["Discover what is still possible."]} />
        </h2>
        <div className={s.actions}>
          <a className={s.primary} href={`mailto:${DEMO_EMAIL}`}>Request a tailored demo</a>
          {signedIn
            ? <Link className={s.secondary} href="/app">Open your dashboard</Link>
            : <Link className={s.secondary} href="/signup">Become an analyser</Link>}
        </div>
      </Beat>

      <footer className={s.footer}>
        <Lockup width={132} className={s.footerLogo} />
        <p>Piloting with KL University, MNR University and the SP heterocat lab, IITH.</p>
        <p>Not a technology transfer office. Not investment advice.</p>
      </footer>
    </div>
  );
}

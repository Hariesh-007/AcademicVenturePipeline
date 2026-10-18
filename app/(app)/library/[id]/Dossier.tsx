"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import { TRL_LEVELS } from "@/lib/trl";
import type { CompileState, Conflict, Dossier as DossierT, Evidence, SeniorDecision } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";
import { ASPECTS } from "./Reports";

const SECTIONS = [
  ["screening", "Screening"], ["synopsis", "Synopsis"], ["technical_ip", "Technology and IP"], ["trl", "TRL"],
  ["commercialisation", "Commercialisation"], ["gaps", "Gaps"], ["key_evidence", "Key evidence"],
] as const;
const sectionLabel = (k: string) => SECTIONS.find(([s]) => s === k)?.[1] ?? k;
const aspectLabel = (a: string) => ASPECTS.find((x) => x.value === a)?.label ?? a;
const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const ACTION = { approve: "Approved", edit: "Edited", return: "Returned to reviewers" };
const COMPILE = {
  COMPILE_QUEUED: "Queued for AI compilation.",
  COMPILE_DONE: "Compiled.",
  COMPILE_FAILED: "AI compilation failed.",
  COMPILE_SKIPPED: "AI compilation was skipped: a cited document isn’t a published patent, so its text can’t be sent to the AI.",
  COMPILE_MANUAL: "Written by hand.",
};

/** Stages 7-10: the draft dossier, reviewer conflicts, and (for an eligible senior reviewer)
 *  approve / edit / return. Drafts are visible to seniors and admins only (the API enforces it). */
export function Dossier({ technologyId, stage, dossier, conflicts, decisions, evidence, mayAct, compile }: {
  technologyId: string; stage: string; dossier: DossierT | null; conflicts: Conflict[]; decisions: SeniorDecision[];
  evidence: Evidence[]; mayAct: boolean; compile: CompileState | null;
}) {
  const quotes = new Map(evidence.map((e) => [e.id, e]));
  const open = conflicts.filter((c) => !c.resolution);

  if (stage === "compilation") return <Compiling technologyId={technologyId} mayAct={mayAct} compile={compile} />;
  if (!dossier) return <p className="text-[14px] text-ink-2">No dossier yet.</p>;
  const sections = dossier.content.sections ?? {};

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-[18px]">Dossier v{dossier.version}</h3>
        <span className={`chip ${dossier.status === "approved" ? "chip-on" : ""}`}>
          {dossier.status === "approved" ? `Approved · final TRL ${dossier.final_trl}` : `Draft · proposed TRL ${dossier.draft_trl ?? "—"}`}
        </span>
      </header>
      {dossier.status !== "approved" && (
        <p className="text-[13px] text-ink-2">
          {dossier.created_by.startsWith("system") ? "Drafted by AI from the formal reports. " : ""}
          A senior reviewer sets the final TRL. Claims without evidence are marked.
        </p>
      )}

      {SECTIONS.filter(([k]) => sections[k]).map(([k, label]) => (
        <section key={k}>
          <h4 className="label">{label}</h4>
          <p className="whitespace-pre-line text-[14px] leading-relaxed">{sections[k]}</p>
        </section>
      ))}
      {dossier.trl_rationale && (
        <section>
          <h4 className="label">Why this TRL</h4>
          <p className="whitespace-pre-line text-[14px] leading-relaxed">{dossier.trl_rationale}</p>
        </section>
      )}

      {dossier.claims.length > 0 && (
        <section className="flex flex-col gap-3">
          <h4 className="label">Claims ({dossier.claims.length})</h4>
          {dossier.claims.map((c) => (
            <article key={c.id} className="panel p-3 text-[14px]">
              <p className="text-[12px] text-ink-2">{sectionLabel(c.section)}{c.unsupported && <span className="ml-2 font-medium text-danger">No evidence</span>}</p>
              <p className="mt-1">{c.text}</p>
              {c.evidence_ids.map((id) => {
                const e = quotes.get(id);
                return e ? (
                  <p key={id} className="mt-1 border-l-2 border-rule pl-2 text-[13px] text-ink-2">
                    “{e.quote.length > 200 ? `${e.quote.slice(0, 200)}…` : e.quote}”{e.page != null && <> p.{e.page}</>}
                  </p>
                ) : null;
              })}
            </article>
          ))}
        </section>
      )}

      {conflicts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h4 className="label">Reviewer disagreements ({open.length} open)</h4>
          {conflicts.map((c) => (
            <div key={c.id} className="panel p-3 text-[14px]">
              <p className="text-[12px] text-ink-2">{aspectLabel(c.aspect)}</p>
              <p className="mt-1">{c.description}</p>
              {c.resolution && <p className="mt-1 text-[13px] text-ink-2">Resolved: {c.resolution}</p>}
            </div>
          ))}
        </section>
      )}

      {stage === "senior_review" && mayAct && (
        <Decide technologyId={technologyId} dossier={dossier} open={open} />
      )}
      {stage === "senior_review" && !mayAct && (
        <p className="text-[13px] text-ink-2">Waiting for a senior reviewer who isn’t from this university and didn’t write a report on it.</p>
      )}

      {decisions.length > 0 && (
        <section>
          <h4 className="label">Senior review history</h4>
          <ul className="flex flex-col gap-2 text-[14px]">
            {decisions.map((d) => (
              <li key={d.id}>
                <span className="font-medium">{ACTION[d.action]}</span>
                {d.final_trl != null && <> · TRL {d.final_trl}</>}
                <span className="text-ink-2"> · {date.format(new Date(d.created_at))}</span>
                {d.notes && <p className="whitespace-pre-line text-[13px] text-ink-2">{d.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Compiling({ technologyId, mayAct, compile }: { technologyId: string; mayAct: boolean; compile: CompileState | null }) {
  const { run, busy, error, done } = useAction();
  const [manual, setManual] = useState(false);
  const ev = compile?.last_event;
  const stuck = ev && ["COMPILE_FAILED", "COMPILE_SKIPPED"].includes(ev.action);
  return (
    <div className="flex flex-col gap-4 text-[14px]">
      <p>The review round is closed. The draft dossier is being compiled from the formal reports.</p>
      {ev && <p className={stuck ? "text-danger" : "text-ink-2"}>{COMPILE[ev.action]}{ev.message && ev.action === "COMPILE_FAILED" && <> ({ev.message})</>}</p>}
      {mayAct && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" disabled={busy}
            onClick={() => run(() => send(`/technologies/${technologyId}/compile/retry`, { method: "POST" }), "Queued again")}>
            Retry AI compilation
          </button>
          <button type="button" className="btn" onClick={() => setManual(!manual)}>{manual ? "Cancel" : "Write the dossier by hand"}</button>
        </div>
      )}
      <Feedback error={error} done={done} />
      {manual && (
        <DossierForm submitLabel="Send to senior review"
          onSubmit={(v) => send(`/technologies/${technologyId}/dossier`, { json: { ...v, claims: [] } })} />
      )}
    </div>
  );
}

type FormValue = { content: { sections: Record<string, string> }; draft_trl: number | null; trl_rationale: string };

/** Sections + TRL + rationale. Used for a hand-written dossier and for a senior's edit. */
function DossierForm({ initial, submitLabel, onSubmit, extra }: {
  initial?: DossierT; submitLabel: string; onSubmit: (v: FormValue, notes: string) => Promise<unknown>; extra?: boolean;
}) {
  const [sections, setSections] = useState<Record<string, string>>(initial?.content.sections ?? {});
  const [trl, setTrl] = useState<number | null>(initial?.draft_trl ?? null);
  const [rationale, setRationale] = useState(initial?.trl_rationale ?? "");
  const [notes, setNotes] = useState("");
  const { run, busy, error, done } = useAction();
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => {
      e.preventDefault();
      run(() => onSubmit({ content: { sections }, draft_trl: trl, trl_rationale: rationale }, notes), "Saved");
    }}>
      {SECTIONS.map(([k, label]) => (
        <div key={k}>
          <label className="label" htmlFor={`s-${k}`}>{label}</label>
          <textarea id={`s-${k}`} className="input min-h-20 py-2" value={sections[k] ?? ""}
            onChange={(e) => setSections({ ...sections, [k]: e.target.value })} />
        </div>
      ))}
      <div>
        <label className="label" htmlFor="d-trl">Proposed TRL</label>
        <TrlSelect id="d-trl" value={trl} onChange={setTrl} />
      </div>
      <div>
        <label className="label" htmlFor="d-rat">Why this TRL</label>
        <textarea id="d-rat" className="input min-h-20 py-2" value={rationale} onChange={(e) => setRationale(e.target.value)} />
      </div>
      {extra && (
        <div>
          <label className="label" htmlFor="d-notes">What you changed</label>
          <input id="d-notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      )}
      <button type="submit" className="btn btn-primary self-start" disabled={busy}>{submitLabel}</button>
      <Feedback error={error} done={done} />
    </form>
  );
}

function TrlSelect({ id, value, onChange }: { id: string; value: number | null; onChange: (n: number | null) => void }) {
  return (
    <select id={id} className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">Choose a level</option>
      {TRL_LEVELS.map((l) => <option key={l.n} value={l.n}>{l.n}. {l.title}</option>)}
    </select>
  );
}

function Decide({ technologyId, dossier, open }: { technologyId: string; dossier: DossierT; open: Conflict[] }) {
  const base = `/technologies/${technologyId}/senior-review`;
  const [mode, setMode] = useState<"approve" | "edit" | "return">("approve");
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [trl, setTrl] = useState<number | null>(dossier.draft_trl);
  const [rationale, setRationale] = useState("");
  const [notes, setNotes] = useState("");
  const { run, busy, error, done } = useAction();
  const approve = () => send(`${base}/approve`, {
    json: {
      final_trl: trl, trl_rationale: rationale, notes,
      resolutions: open.map((c) => ({ conflict_id: c.id, resolution: resolutions[c.id] ?? "" })),
    },
  });
  const ready = trl != null && rationale.trim() && open.every((c) => resolutions[c.id]?.trim());

  return (
    <section className="flex flex-col gap-4 border-t border-rule pt-5">
      <h4 className="font-serif text-[18px]">Your decision</h4>
      <div role="radiogroup" aria-label="Decision" className="flex gap-2">
        {(["approve", "edit", "return"] as const).map((m) => (
          <label key={m} className={`chip cursor-pointer ${mode === m ? "chip-on" : ""}`}>
            <input type="radio" name="decision" className="sr-only" checked={mode === m} onChange={() => setMode(m)} />
            {{ approve: "Approve", edit: "Edit", return: "Return" }[m]}
          </label>
        ))}
      </div>

      {mode === "approve" && (
        <div className="flex flex-col gap-3">
          {open.map((c) => (
            <div key={c.id}>
              <label className="label" htmlFor={`r-${c.id}`}>Resolve: {c.description}</label>
              <textarea id={`r-${c.id}`} className="input min-h-16 py-2" value={resolutions[c.id] ?? ""}
                placeholder="Which reasoning holds, and why"
                onChange={(e) => setResolutions({ ...resolutions, [c.id]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="label" htmlFor="f-trl">Final TRL</label>
            <TrlSelect id="f-trl" value={trl} onChange={setTrl} />
          </div>
          <div>
            <label className="label" htmlFor="f-rat">Why this is the final TRL</label>
            <textarea id="f-rat" className="input min-h-20 py-2" value={rationale} onChange={(e) => setRationale(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="f-notes">Notes <span className="font-normal text-ink-2">(optional)</span></label>
            <input id="f-notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary self-start" disabled={busy || !ready}
            onClick={() => run(approve, "Approved. The university can now route it.")}>
            Approve dossier
          </button>
          {!ready && <p className="text-[13px] text-ink-2">Resolve every disagreement and give the final TRL with a reason.</p>}
        </div>
      )}

      {mode === "edit" && (
        <DossierForm initial={dossier} extra submitLabel="Save as a new version"
          onSubmit={(v, n) => send(`${base}/edit`, {
            json: {
              notes: n,
              version: {
                ...v,
                claims: dossier.claims.map((c) => ({ section: c.section, text: c.text, source_report_id: c.source_report_id, evidence_ids: c.evidence_ids })),
              },
            },
          })} />
      )}

      {mode === "return" && (
        <div className="flex flex-col gap-3">
          <label className="label" htmlFor="ret">What the reviewers need to redo</label>
          <textarea id="ret" className="input min-h-24 py-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button type="button" className="btn self-start" disabled={busy || !notes.trim()}
            onClick={() => run(() => send(`${base}/return`, { json: { notes } }), "Returned to human review")}>
            Return to reviewers
          </button>
        </div>
      )}
      <Feedback error={error} done={done} />
    </section>
  );
}

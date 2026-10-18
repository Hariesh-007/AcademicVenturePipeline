"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import { TRL_LEVELS } from "@/lib/trl";
import type { Evidence, Report } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";

export const ASPECTS = [
  { value: "technical_trl", label: "Technical / TRL", hint: "How mature is it? Give a TRL and what's missing to reach the next level." },
  { value: "ip", label: "IP", hint: "Scope and strength of the claims, freedom to operate, prior art." },
  { value: "market", label: "Market", hint: "Who would buy it, how many, and what they use today." },
  { value: "manufacturing", label: "Manufacturing", hint: "Can it be made at scale, at what cost, with what equipment." },
  { value: "regulatory", label: "Regulatory", hint: "Approvals, standards or certifications it needs." },
  { value: "bottlenecks", label: "Bottlenecks", hint: "The biggest risks that could stop it." },
] as const;
type Aspect = (typeof ASPECTS)[number]["value"];
const aspectLabel = (a: string) => ASPECTS.find((x) => x.value === a)?.label ?? a;
const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

/** Formal stage-6 reports: one per aspect per analyst, each citing evidence. Submitted = final;
 *  revising starts a new draft that replaces it once submitted. */
export function Reports({ technologyId, reports, evidence, meId, canWrite, canComplete }: {
  technologyId: string; reports: Report[]; evidence: Evidence[]; meId: string; canWrite: boolean; canComplete?: boolean;
}) {
  const live = evidence.filter((e) => !e.retracted);
  const submitted = reports.filter((r) => r.submitted_at);
  const [aspect, setAspect] = useState<Aspect>("technical_trl");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[14px] text-ink-2">
        Formal reports feed the technology’s dossier. Write one per aspect you can judge, and cite the evidence behind it.
        Reviewers may disagree; that is kept, not averaged.
      </p>
      {canWrite && (
        <section className="flex flex-col gap-3">
          <label className="label" htmlFor="aspect">Aspect</label>
          <select id="aspect" className="input" value={aspect} onChange={(e) => setAspect(e.target.value as Aspect)}>
            {ASPECTS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <p className="text-[13px] text-ink-2">{ASPECTS.find((a) => a.value === aspect)?.hint}</p>
          <ReportForm key={aspect} technologyId={technologyId} aspect={aspect} evidence={live}
            draft={reports.find((r) => r.aspect === aspect && r.reviewer_id === meId && !r.submitted_at)}
            mine={submitted.find((r) => r.aspect === aspect && r.reviewer_id === meId)} />
        </section>
      )}
      {canComplete && <CompleteRound technologyId={technologyId} hasTrl={submitted.some((r) => r.aspect === "technical_trl")} />}
      <section className="flex flex-col gap-3">
        <h3 className="font-serif text-[18px]">Submitted ({submitted.length})</h3>
        {submitted.length === 0 && <p className="text-[14px] text-ink-2">No formal reports yet.</p>}
        {submitted.map((r) => (
          <article key={r.id} className="panel p-4">
            <p className="flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-ink-2">
              <span className="font-medium text-ink">{aspectLabel(r.aspect)}{r.trl != null && <> · TRL {r.trl}</>}</span>
              <span>{r.confidence} confidence · {date.format(new Date(r.submitted_at!))}{r.reviewer_id === meId && " · yours"}</span>
            </p>
            <p className="mt-2 text-[14px] font-medium">{r.conclusion}</p>
            <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed">{r.rationale}</p>
            {r.gaps.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-[14px] text-ink-2">{r.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
            )}
            <p className="mt-2 text-[13px] text-ink-2">Cites {r.evidence_ids.length} evidence item{r.evidence_ids.length === 1 ? "" : "s"}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function ReportForm({ technologyId, aspect, evidence, draft, mine }: {
  technologyId: string; aspect: Aspect; evidence: Evidence[]; draft?: Report; mine?: Report;
}) {
  const seed = draft ?? mine;
  const [f, setF] = useState({
    conclusion: seed?.conclusion ?? "", rationale: seed?.rationale ?? "", confidence: seed?.confidence ?? "medium",
    trl: seed?.trl ?? null as number | null, gaps: (seed?.gaps ?? []).join("\n"),
    evidence_ids: new Set(seed?.evidence_ids ?? []),
  });
  const { run, busy, error, done } = useAction();
  const url = `/technologies/${technologyId}/reports`;
  const body = () => ({
    aspect, conclusion: f.conclusion, rationale: f.rationale, confidence: f.confidence,
    trl: aspect === "technical_trl" ? f.trl : null,
    gaps: f.gaps.split("\n").map((g) => g.trim()).filter(Boolean),
    evidence_ids: [...f.evidence_ids],
    supersedes_id: draft?.supersedes_id ?? (mine && !draft ? mine.id : null),
  });
  const save = () => send<Report>(url, { json: body() });
  const toggle = (id: string) => setF((p) => {
    const s = new Set(p.evidence_ids);
    if (s.has(id)) s.delete(id); else s.add(id);
    return { ...p, evidence_ids: s };
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      {mine && !draft && <p className="text-[13px] text-ink-2">You submitted this aspect. Saving starts a revision that replaces it once you submit.</p>}
      <div>
        <label className="label" htmlFor="conclusion">Conclusion</label>
        <input id="conclusion" className="input" maxLength={5000} value={f.conclusion} placeholder="One sentence: your call on this aspect"
          onChange={(e) => setF({ ...f, conclusion: e.target.value })} />
      </div>
      <div>
        <label className="label" htmlFor="rationale">Rationale</label>
        <textarea id="rationale" className="input min-h-28 py-2" maxLength={20000} value={f.rationale}
          onChange={(e) => setF({ ...f, rationale: e.target.value })} />
      </div>
      {aspect === "technical_trl" && (
        <div>
          <label className="label" htmlFor="trl">TRL</label>
          <select id="trl" className="input" value={f.trl ?? ""} onChange={(e) => setF({ ...f, trl: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Choose a level</option>
            {TRL_LEVELS.map((l) => <option key={l.n} value={l.n}>{l.n}. {l.title}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="label" htmlFor="gaps">{aspect === "technical_trl" ? "What’s missing to reach the next level" : "Gaps"} <span className="font-normal text-ink-2">(one per line)</span></label>
        <textarea id="gaps" className="input min-h-20 py-2" value={f.gaps} onChange={(e) => setF({ ...f, gaps: e.target.value })} />
      </div>
      <fieldset>
        <legend className="label">Confidence</legend>
        <div className="flex gap-2">
          {(["low", "medium", "high"] as const).map((c) => (
            <label key={c} className={`chip cursor-pointer ${f.confidence === c ? "chip-on" : ""}`}>
              <input type="radio" name="confidence" className="sr-only" checked={f.confidence === c} onChange={() => setF({ ...f, confidence: c })} />
              {c}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Evidence cited ({f.evidence_ids.size})</legend>
        {evidence.length === 0 && <p className="text-[13px] text-ink-2">No evidence yet. Add some from the Evidence tab first.</p>}
        <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {evidence.map((e) => (
            <li key={e.id}>
              <label className="flex cursor-pointer gap-2 text-[13px] leading-snug">
                <input type="checkbox" className="mt-0.5" checked={f.evidence_ids.has(e.id)} onChange={() => toggle(e.id)} />
                <span>“{e.quote.length > 160 ? `${e.quote.slice(0, 160)}…` : e.quote}”{e.page != null && <span className="text-ink-2"> p.{e.page}</span>}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn" disabled={busy} onClick={() => run(save, "Draft saved")}>Save draft</button>
        <button type="button" className="btn btn-primary" disabled={busy}
          onClick={() => run(async () => send(`${url}/${(await save()).id}/submit`, { method: "POST" }), "Submitted")}>
          Submit report
        </button>
      </div>
      <Feedback error={error} done={done} />
    </form>
  );
}

/** Senior reviewers (and admins) close the round; AI then drafts the dossier. */
function CompleteRound({ technologyId, hasTrl }: { technologyId: string; hasTrl: boolean }) {
  const { run, busy, error, done } = useAction();
  return (
    <section className="panel flex flex-col gap-2 p-4 text-[14px]">
      <p>As a senior reviewer you can close this review round. The formal reports are then compiled into a draft dossier.</p>
      <button type="button" className="btn btn-primary self-start" disabled={busy || !hasTrl}
        onClick={() => run(() => send(`/technologies/${technologyId}/reports/complete`, { method: "POST" }), "Round closed. Compiling the dossier.")}>
        Complete review round
      </button>
      {!hasTrl && <p className="text-[13px] text-ink-2">Needs at least one submitted Technical / TRL report.</p>}
      <Feedback error={error} done={done} />
    </section>
  );
}

"use client";

import Link from "next/link";
import { send } from "@/lib/client";
import type { Evidence, TriageState } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";
import { AutoRefresh } from "@/app/(app)/AutoRefresh";

const label = (k: string) => k.replace(/_signal$/, "").replace(/_/g, " ");

function Cites({ ids, quotes, technologyId }: { ids?: string[]; quotes: Map<string, Evidence>; technologyId: string }) {
  const cited = (ids ?? []).map((i) => quotes.get(i)).filter((e): e is Evidence => !!e);
  if (!cited.length) return null;
  return (
    <details className="mt-1 text-[13px]">
      <summary className="cursor-pointer text-blue">{cited.length} cited {cited.length === 1 ? "quote" : "quotes"}</summary>
      <ul className="mt-1 flex flex-col gap-1.5">
        {cited.map((e) => (
          <li key={e.id} className="border-l-2 border-blue/40 pl-2 font-serif text-ink-2">
            “{e.quote}”{" "}
            <Link className="font-sans text-blue hover:underline"
              href={`/library/${technologyId}?tab=evidence${e.document_id ? `&doc=${e.document_id}&page=${e.page}` : ""}`}>
              {e.page ? `p.${e.page}` : "source"}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Maintainer/admin view of stage 5. A sorting aid, never a verdict; hidden from analysts. */
export function TriagePanel({ technologyId, stage, state, evidence }: {
  technologyId: string; stage: string; state: TriageState; evidence: Evidence[];
}) {
  const act = useAction();
  const { result, last_event: ev } = state;
  const quotes = new Map(evidence.map((e) => [e.id, e]));
  // a job is waiting when the newest event is a request newer than the newest result
  const waiting = ev?.action === "TRIAGE_QUEUED";

  return (
    <section aria-labelledby="triage-h" className="flex flex-col gap-3">
      <AutoRefresh active={waiting} />
      <h2 id="triage-h" className="font-serif text-[20px]">AI triage</h2>
      {waiting && <p className="text-[14px] text-ink-2">Triage is running. This updates on its own.</p>}
      {ev?.action === "TRIAGE_FAILED" && (
        <p className="text-[13px] text-danger">Last run failed: {ev.message ?? "unknown error"}. It retries on its own; re-run it if it keeps failing.</p>
      )}
      {ev?.action === "TRIAGE_SKIPPED" && (
        <p className="text-[13px] text-ink-2">
          Not run: some evidence comes from files that aren’t published patents, and only published patents are sent to the AI. Reviewers score this one by hand.
        </p>
      )}
      {!result && !waiting && !ev && <p className="text-[14px] text-ink-2">No triage yet.</p>}

      {result && (
        <div className="panel flex flex-col gap-4 p-4">
          <p className="text-[14px] leading-relaxed">{result.synopsis}</p>
          <div>
            <p className="label mb-1">Screening score</p>
            {result.screening_score === null ? (
              <p className="text-[14px] text-ink-2">No score: no signal was backed by evidence.</p>
            ) : (
              <p className="data text-[28px] leading-none">{Math.round(result.screening_score)}<span className="text-[14px] text-ink-3"> / 100</span></p>
            )}
            <p className="hint mt-1">A sorting aid, not a verdict. Reviewers decide.</p>
          </div>
          {Object.keys(result.score_breakdown).length > 0 && (
            <ul className="flex flex-col gap-3">
              {Object.entries(result.score_breakdown).map(([k, c]) => (
                <li key={k} className="text-[14px]">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium capitalize">{label(k)}</span>
                    <span className="data text-ink-2">{Math.round(c.score)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-sunken" aria-hidden>
                    <div className="h-full rounded-full bg-blue" style={{ width: `${Math.min(100, c.score)}%` }} />
                  </div>
                  <p className="mt-1 text-[13px] text-ink-2">{c.rationale}</p>
                  <Cites ids={c.evidence_ids} quotes={quotes} technologyId={technologyId} />
                </li>
              ))}
            </ul>
          )}
          {result.flags.length > 0 && (
            <div>
              <p className="label mb-1">Flags</p>
              <ul className="flex flex-col gap-2">
                {result.flags.map((f, i) => (
                  <li key={i} className="rounded-[8px] bg-orange-tint px-3 py-2 text-[13px] text-orange-ink">
                    <span className="font-medium capitalize">{f.kind.replace(/_/g, " ")}:</span> {f.message}
                    <Cites ids={f.evidence_ids} quotes={quotes} technologyId={technologyId} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.categories.length > 0 && (
            <p className="text-[13px] text-ink-2">
              Suggested categories: {result.categories.join(", ")}. Matching ones appear under Categories to accept.
            </p>
          )}
          <p className="text-[12px] text-ink-3">{result.model} · prompt {result.prompt_version} · {new Date(result.created_at).toLocaleString()}</p>
        </div>
      )}

      {stage !== "evidence" && (
        <div className="flex flex-col gap-2">
          <button className="btn btn-sm self-start" disabled={act.busy || waiting}
            onClick={() => act.run(() => send(`/technologies/${technologyId}/triage/rerun`, { method: "POST" }), "Triage queued.")}>
            Re-run triage
          </button>
          <Feedback error={act.error} done={act.done} />
        </div>
      )}
    </section>
  );
}

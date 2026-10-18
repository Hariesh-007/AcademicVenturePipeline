"use client";

import { send } from "@/lib/client";
import type { Report } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";
import { ASPECTS } from "@/app/(app)/library/[id]/Reports";

/** Admin: formal reports so far, and closing the round (HUMAN_REVIEW -> COMPILATION). */
export function ReviewRound({ technologyId, stage, reports }: { technologyId: string; stage: string; reports: Report[] }) {
  const { run, busy, error, done } = useAction();
  const submitted = reports.filter((r) => r.submitted_at);
  const trl = submitted.filter((r) => r.aspect === "technical_trl" && r.trl != null).map((r) => r.trl!);
  return (
    <section>
      <h2 className="label">Formal reviews</h2>
      <div className="panel flex flex-col gap-3 p-4 text-[14px]">
        <ul className="flex flex-col gap-1">
          {ASPECTS.map((a) => {
            const n = submitted.filter((r) => r.aspect === a.value).length;
            return (
              <li key={a.value} className="flex justify-between">
                <span className={n ? "" : "text-ink-2"}>{a.label}</span>
                <span className="data">{n}</span>
              </li>
            );
          })}
        </ul>
        {trl.length > 1 && Math.max(...trl) !== Math.min(...trl) && (
          <p className="text-[13px] text-orange-ink dark:text-orange">Reviewers disagree on TRL ({[...new Set(trl)].sort().join(" vs ")}).</p>
        )}
        {stage === "human_review" ? (
          <>
            <button type="button" className="btn btn-primary" disabled={busy || trl.length === 0}
              onClick={() => run(() => send(`/technologies/${technologyId}/reports/complete`, { method: "POST" }), "Review round closed")}>
              Complete review round
            </button>
            <p className="text-[13px] text-ink-2">
              {trl.length === 0 ? "Needs at least one submitted Technical / TRL report." : "Closes reporting and moves the technology to compilation."}
            </p>
          </>
        ) : (
          <p className="text-[13px] text-ink-2">
            Review round closed. The dossier, its conflicts and the senior decision are in the{" "}
            <a className="underline" href={`/library/${technologyId}?tab=dossier`}>reader’s Dossier tab</a>.
          </p>
        )}
        <Feedback error={error} done={done} />
      </div>
    </section>
  );
}

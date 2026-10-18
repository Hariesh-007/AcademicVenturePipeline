"use client";

import Link from "next/link";
import { send } from "@/lib/client";
import type { EvidenceStatus } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";
import { AutoRefresh } from "@/app/(app)/AutoRefresh";

function state(d: EvidenceStatus) {
  if (d.status === "SUCCEEDED") return { text: `${d.items} ${d.items === 1 ? "quote" : "quotes"}`, tone: "text-ok" };
  if (d.status === "CANCELLED") return { text: d.error?.message ?? "Not extracted", tone: "text-ink-2" };
  if (d.status === "FAILED") return { text: `Failed: ${d.error?.message ?? "unknown error"}`, tone: "text-danger" };
  if (d.status === "RUNNING") return { text: "Reading…", tone: "text-ink-2" };
  return { text: "Waiting to start", tone: "text-ink-2" };
}

/** Maintainer view of stage 4: per-file extraction state, re-run, and the hand-off to triage. */
export function EvidencePanel({ technologyId, stage, docs }: { technologyId: string; stage: string; docs: EvidenceStatus[] }) {
  const act = useAction();
  const collecting = stage === "evidence";
  // queued or reading: "Extract again" waits for every file to succeed or fail (the API refuses too)
  const busy = docs.some((d) => d.status === "QUEUED" || d.status === "RUNNING" || d.status === "RETRYING");
  const total = docs.reduce((n, d) => n + d.items, 0);

  return (
    <section aria-labelledby="evidence-h" className="flex flex-col gap-3">
      <AutoRefresh active={collecting && (busy || docs.some((d) => d.status === null))} />
      <h2 id="evidence-h" className="font-serif text-[20px]">Evidence</h2>
      <p className="text-[14px] text-ink-2">
        AI reads each file and pulls out exact quotes that reviewers can cite. Analysts can add quotes too.
      </p>
      <ul className="panel divide-y divide-rule">
        {docs.map((d) => {
          const s = state(d);
          return (
            <li key={d.document_id} className="flex flex-col gap-0.5 p-3 text-[14px]">
              <span className="truncate">{d.filename}</span>
              <span className={`text-[13px] ${s.tone}`}>{s.text}</span>
            </li>
          );
        })}
      </ul>
      <Link href={`/library/${technologyId}?tab=evidence`} className="text-[14px] underline-offset-2 hover:underline">
        Read the {total} {total === 1 ? "quote" : "quotes"} in the library
      </Link>
      {collecting && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-sm" disabled={act.busy || busy}
              onClick={() => act.run(() => send(`/technologies/${technologyId}/evidence/extract`, { method: "POST" }), "Extraction restarted.")}>
              Extract again
            </button>
            <button className="btn btn-primary btn-sm" disabled={act.busy || busy}
              onClick={() => act.run(() => send(`/technologies/${technologyId}/evidence/complete`, { method: "POST" }), "Sent to triage.")}>
              Send to triage
            </button>
          </div>
          <p className="hint mt-0">
            {busy
              ? "Extracting again and sending to triage open once every file has finished."
              : "Extracting again replaces AI quotes nobody has cited yet. Sending to triage ends extraction for this technology."}
          </p>
          <Feedback error={act.error} done={act.done} />
        </div>
      )}
    </section>
  );
}

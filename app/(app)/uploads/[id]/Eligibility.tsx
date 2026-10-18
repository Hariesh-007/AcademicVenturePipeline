"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import { choiceLabel, PERMISSION } from "@/lib/context";
import type { EligibilityDecision } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";

const DECISIONS = [
  { value: "ELIGIBLE", label: "Eligible", hint: "Opens it to analysts in the library and starts evidence extraction." },
  { value: "INELIGIBLE", label: "Not eligible", hint: "Closes the record. It stays stored but is never shown to analysts." },
  { value: "REQUIRES_CLARIFICATION", label: "Needs clarification", hint: "Sends it back to intake so the details can be fixed." },
] as const;
const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Blocking reasons name documents and patents by id; show what the maintainer recognises. */
function readable(reason: string, names: Record<string, string>) {
  return reason
    .replace(/document ([0-9a-f-]{36})/g, (_, id) => names[id] ?? "a document")
    .replace(/patent [0-9a-f-]{36}: /g, "Patent: ")
    .replace(/^technology: licensing_status .*/, "Add licensing in University details")
    .replace(/^technology: permission_status .*/, "Add permission in University details")
    .replace(/^technology: /, "");
}

function Submit({ technologyId, blocking, names }: { technologyId: string; blocking: string[]; names: Record<string, string> }) {
  const act = useAction();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[14px] text-ink-2">
        When every field is verified, submit the record so its eligibility can be decided. Analysts don&apos;t see it until it&apos;s marked eligible.
      </p>
      {blocking.length > 0 && (
        <div className="rounded-[10px] border border-dashed border-rule-strong p-4 text-[14px]">
          <p className="font-medium">Before you can submit</p>
          <ul className="mt-1 list-disc pl-5 text-ink-2">{blocking.map((b) => <li key={b}>{readable(b, names)}</li>)}</ul>
        </div>
      )}
      <button className="btn btn-primary btn-sm self-start" disabled={act.busy || blocking.length > 0}
        onClick={() => act.run(() => send(`/technologies/${technologyId}/submit`, { method: "POST" }), "Submitted for eligibility.")}>
        Submit for eligibility
      </button>
      <Feedback error={act.error} done={act.done} />
    </div>
  );
}

function Decide({ technologyId, permission }: { technologyId: string; permission: string | null }) {
  const act = useAction();
  const [status, setStatus] = useState<(typeof DECISIONS)[number]["value"]>("ELIGIBLE");
  const [reasons, setReasons] = useState("");
  const blocked = status === "ELIGIBLE" && permission !== "GRANTED";

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => {
      e.preventDefault();
      act.run(() => send(`/technologies/${technologyId}/eligibility`, { json: { status, reasons } }), "Decision saved.");
    }}>
      <fieldset>
        <legend className="label">Decision</legend>
        <div className="flex flex-col gap-2">
          {DECISIONS.map((d) => (
            <label key={d.value} className="flex cursor-pointer gap-2 text-[14px]">
              <input type="radio" name="status" value={d.value} checked={status === d.value} onChange={() => setStatus(d.value)} className="mt-1" />
              <span>{d.label}<span className="block text-[13px] text-ink-2">{d.hint}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-[14px]">
        <span className="text-ink-2">Permission to review: </span>{choiceLabel(PERMISSION, permission)}
        {blocked && <span className="block text-[13px] text-ink-2">To mark it eligible, set permission to Granted in University details.</span>}
      </p>
      <div>
        <label className="label" htmlFor="reasons">Reason{status === "ELIGIBLE" ? " (optional)" : ""}</label>
        <textarea id="reasons" className="input" rows={3} required={status !== "ELIGIBLE"} value={reasons} onChange={(e) => setReasons(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-sm self-start" disabled={act.busy || blocked}>Save decision</button>
      <Feedback error={act.error} done={act.done} />
    </form>
  );
}

export function Eligibility({ technologyId, stage, blocking, permission, decision, names }: {
  technologyId: string; stage: string; blocking: string[]; permission: string | null;
  decision: EligibilityDecision | null; names: Record<string, string>;
}) {
  return (
    <section aria-labelledby="eligibility-h" className="flex flex-col gap-3">
      <h2 id="eligibility-h" className="font-serif text-[20px]">Eligibility</h2>
      {stage === "intake" && (
        <>
          {decision?.status === "REQUIRES_CLARIFICATION" && (
            <p className="rounded-[10px] border border-rule-strong bg-sunken p-3 text-[14px]">
              Sent back for clarification: {decision.reasons}
            </p>
          )}
          <Submit technologyId={technologyId} blocking={blocking} names={names} />
        </>
      )}
      {stage === "eligibility" && <Decide technologyId={technologyId} permission={permission} />}
      {stage !== "intake" && stage !== "eligibility" && decision && (
        <p className="text-[14px]">
          <span className={decision.status === "ELIGIBLE" ? "text-ok" : "text-danger"}>
            {decision.status === "ELIGIBLE" ? "Eligible" : "Not eligible"}
          </span>
          <span className="text-ink-2">, decided {date.format(new Date(decision.confirmed_at))}{decision.reasons && `: ${decision.reasons}`}</span>
        </p>
      )}
    </section>
  );
}

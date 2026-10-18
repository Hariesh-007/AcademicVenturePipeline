"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import type { FieldState, ReviewState } from "@/lib/types";
import { show } from "@/lib/format";
import { Feedback, useAction } from "@/lib/useAction";

const LABEL: Record<string, string> = {
  publication_number: "Publication number", application_number: "Application number",
  patent_number: "Patent number", jurisdiction: "Country / office", applicants: "Applicants",
  assignees: "Assignees", inventors: "Inventors", filing_date: "Filing date",
  publication_date: "Publication date", grant_date: "Grant date", priority_date: "Priority date",
  ipc_codes: "IPC codes", cpc_codes: "CPC codes", legal_status: "Legal status",
};
const label = (f: string) => LABEL[f] ?? f.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());


const SOURCE: Record<string, string> = {
  uploaded_document: "PDF", patent_registry: "EPO register", human: "entered by hand", institution: "university",
};
const sourceLabel = (s: string[]) => s.map((x) => SOURCE[x] ?? x).join(" + ");

const DONE = new Set(["VERIFIED", "REJECTED", "UNKNOWN"]);
const needsDecision = (f: FieldState) =>
  f.verification_status === "CONFLICT" ||
  (f.critical && !DONE.has(f.verification_status) && (f.candidate_values.length > 0 || f.current_value != null));

function pages(f: FieldState, ids: string[]) {
  const p = [...new Set(f.source_evidence.filter((e) => ids.includes(e.observation_id) && e.page_number).map((e) => e.page_number))];
  return p.length ? `page ${p.join(", ")}` : "";
}

function FieldRow({ technologyId, f }: { technologyId: string; f: FieldState }) {
  const act = useAction();
  const [editing, setEditing] = useState(false);
  const verify = (body: Record<string, unknown>) =>
    act.run(() => send(`/technologies/${technologyId}/fields/verify`, {
      json: { patent_id: f.patent_id, field_name: f.field_name, ...body },
    }));
  const open = needsDecision(f);

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = String(new FormData(e.currentTarget).get("value")).trim();
    const value = Array.isArray(f.current_value) || Array.isArray(f.candidate_values[0]?.value)
      ? raw.split(",").map((s) => s.trim()).filter(Boolean)
      : raw;
    if (await verify({ action: "EDIT", value })) setEditing(false);
  }

  return (
    <li className={`border-l-2 py-3 pl-4 ${open ? "border-orange" : "border-blue"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[14px] font-medium">
          {label(f.field_name)}
          {f.verification_status === "CONFLICT" && <span className="ml-2 text-[12.5px] font-normal text-orange-ink dark:text-orange">sources disagree</span>}
        </p>
        {!open && (
          <span className="text-[12.5px] text-ink-2">
            {f.verification_status === "UNKNOWN" ? "Not in the documents" : f.verification_status === "REJECTED" ? "Rejected" : "Confirmed"}
          </span>
        )}
      </div>

      {!open && f.verification_status !== "UNKNOWN" && <p className="data mt-1 break-words">{show(f.current_value)}</p>}

      {open && !editing && (
        <div className="mt-2 flex flex-col gap-2">
          {f.candidate_values.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-sunken px-3 py-2">
              <span className="min-w-0">
                <span className="data break-words">{show(c.value)}</span>
                <span className="ml-2 text-[12.5px] text-ink-2">{[sourceLabel(c.sources), pages(f, c.observation_ids)].filter(Boolean).join(", ")}</span>
              </span>
              <button className="btn btn-sm btn-primary" disabled={act.busy} onClick={() => verify({ action: "ACCEPT", observation_id: c.observation_ids[0] })}>
                Confirm
              </button>
            </div>
          ))}
          <div className="flex gap-1">
            <button className="btn btn-quiet btn-sm" onClick={() => setEditing(true)}>Type the correct value</button>
            <button className="btn btn-quiet btn-sm" disabled={act.busy} onClick={() => verify({ action: "MARK_UNKNOWN" })}>Not in the documents</button>
          </div>
        </div>
      )}

      {editing && (
        <form onSubmit={handleEdit} className="mt-2 flex flex-wrap gap-2">
          <input name="value" className="input max-w-md" defaultValue={show(f.current_value ?? f.candidate_values[0]?.value).replace(/^—$/, "")} aria-label={label(f.field_name)} autoFocus required />
          <button className="btn btn-sm btn-primary" disabled={act.busy}>Save</button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setEditing(false)}>Cancel</button>
        </form>
      )}
      {/* "missing required" is just the unconfirmed state itself; show only real problems */}
      {f.validation_errors.filter((e) => !e.startsWith("missing required")).length > 0 && (
        <p className="mt-1 text-[13px] text-danger">{f.validation_errors.filter((e) => !e.startsWith("missing required")).join("; ")}</p>
      )}
      <Feedback error={act.error} />
    </li>
  );
}

/** One patent's fields: what still needs a decision, then what's settled. */
function PatentFields({ technologyId, fields }: { technologyId: string; fields: FieldState[] }) {
  const open = fields.filter(needsDecision);
  const settled = fields.filter((f) => !needsDecision(f) && (f.current_value != null || DONE.has(f.verification_status)));
  return (
    <>
      {open.length > 0 ? (
        <div className="panel p-4">
          <p className="mb-1 text-[14px] font-medium">{open.length} to confirm</p>
          <ul className="flex flex-col">{open.map((f) => <FieldRow key={f.field_name} technologyId={technologyId} f={f} />)}</ul>
        </div>
      ) : (
        <p className="rounded-[10px] bg-ok-tint px-4 py-3 text-[14px] text-ok">All identity details are confirmed.</p>
      )}
      {settled.length > 0 && (
        <details className="panel p-4" open={open.length === 0}>
          <summary className="cursor-pointer text-[14px] font-medium">Confirmed and automatically read ({settled.length})</summary>
          <ul className="mt-2 flex flex-col">{settled.map((f) => <FieldRow key={f.field_name} technologyId={technologyId} f={f} />)}</ul>
        </details>
      )}
    </>
  );
}

export function Verify({ technologyId, review, processing, documents }: {
  technologyId: string; review: ReviewState; processing: boolean;
  documents: { id: string; original_filename: string; patent_id: string | null }[];
}) {
  const fields = review.fields.filter((f) => f.patent_id);
  // each patent document is its own record: group its fields under it, never mix them
  const patents = [...new Set(fields.map((f) => f.patent_id!))];
  const heading = (pid: string) => {
    const files = documents.filter((d) => d.patent_id === pid).map((d) => d.original_filename);
    const num = ["patent_number", "publication_number", "application_number"]
      .map((k) => fields.find((f) => f.patent_id === pid && f.field_name === k))
      .map((f) => f && (f.current_value ?? f.candidate_values[0]?.value))
      .find(Boolean);
    return { files, num: num ? show(num) : null };
  };

  return (
    <section aria-labelledby="verify-h" className="flex flex-col gap-4">
      <div>
        <h2 id="verify-h" className="font-serif text-[22px]">Patent details</h2>
        <p className="mt-1 max-w-[68ch] text-[14px] text-ink-2">
          Read from each PDF and checked against the EPO register. Identity fields (numbers, office, owners) need a person to confirm them so analysers can rely on the record.
        </p>
      </div>
      {documents.length === 0 ? (
        <p className="text-[14px] text-ink-2">Add the patent PDF to extract its details.</p>
      ) : processing && fields.length === 0 ? (
        <div className="flex flex-col gap-2" aria-busy="true"><div className="skeleton h-14" /><div className="skeleton h-14" /><p className="text-[13px] text-ink-2">Reading the document…</p></div>
      ) : fields.length === 0 ? (
        <p className="text-[14px] text-ink-2">No patent details were found. If this is a patent, check the PDF has selectable text or a clear scan.</p>
      ) : (
        <>
          {patents.map((pid, i) => {
            const h = heading(pid);
            return (
              <section key={pid} aria-label={`Patent ${i + 1}`} className="flex flex-col gap-3">
                {patents.length > 1 && (
                  <div className="flex flex-wrap items-baseline gap-x-3 border-b border-rule pb-1.5">
                    <h3 className="font-serif text-[18px]">{h.num ?? `Patent ${i + 1}`}</h3>
                    <span className="text-[13px] text-ink-2">{h.files.join(", ") || "entered by hand"}</span>
                  </div>
                )}
                <PatentFields technologyId={technologyId} fields={fields.filter((f) => f.patent_id === pid)} />
              </section>
            );
          })}
          {(review.warnings ?? []).map((w) => <p key={w} className="text-[13px] text-orange-ink dark:text-orange">{w}</p>)}
        </>
      )}
    </section>
  );
}

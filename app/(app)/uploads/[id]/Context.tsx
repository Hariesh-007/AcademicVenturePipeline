"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import { choiceLabel, LICENSING, PERMISSION } from "@/lib/context";
import type { Technology } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";

const TEXT = [
  { key: "originating_department", label: "Department" },
  { key: "originating_lab", label: "Lab or group" },
  { key: "institutional_reference", label: "Internal reference" },
] as const;
type Key = "licensing_status" | "permission_status" | "institutional_ownership_context" | (typeof TEXT)[number]["key"];

/** Facts only the university knows (spec 13.8). Whatever is saved here counts as verified:
 *  the institution is the authority for it. */
export function Context({ t }: { t: Technology }) {
  const act = useAction();
  const [editing, setEditing] = useState(false);
  const missing = !t.licensing_status || !t.permission_status;
  const reviewable = !["intake", "eligibility", "ineligible"].includes(t.stage);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const keys: Key[] = ["licensing_status", "permission_status", "institutional_ownership_context", ...TEXT.map((x) => x.key)];
    // only what changed: every saved value is recorded as a verification
    const changed = Object.fromEntries(keys
      .map((k) => [k, String(f.get(k) ?? "").trim()] as const)
      .filter(([k, v]) => v !== (t[k] ?? "")));
    if (!Object.keys(changed).length) return setEditing(false);
    if (await act.run(() => send(`/technologies/${t.id}/context`, { method: "PATCH", json: changed }), "Saved.")) setEditing(false);
  }

  return (
    <section aria-labelledby="context-h" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="context-h" className="font-serif text-[20px]">University details</h2>
        {!editing && <button className="btn btn-sm" onClick={() => setEditing(true)}>{missing ? "Add details" : "Edit"}</button>}
      </div>
      {!editing ? (
        <>
          {missing && (
            <p className="rounded-[10px] border border-dashed border-rule-strong p-3 text-[14px] text-ink-2">
              Add licensing and permission. Both are needed before you can submit for eligibility.
            </p>
          )}
          <dl className="panel grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 p-4 text-[14px]">
            <dt className="text-ink-2">Licensing</dt><dd>{choiceLabel(LICENSING, t.licensing_status)}</dd>
            <dt className="text-ink-2">Permission</dt><dd>{choiceLabel(PERMISSION, t.permission_status)}</dd>
            {TEXT.map((x) => t[x.key] && <div key={x.key} className="contents"><dt className="text-ink-2">{x.label}</dt><dd className="break-words">{t[x.key]}</dd></div>)}
            {t.institutional_ownership_context && <><dt className="text-ink-2">Ownership</dt><dd className="break-words">{t.institutional_ownership_context}</dd></>}
          </dl>
        </>
      ) : (
        <form onSubmit={save} className="panel flex flex-col gap-4 p-4">
          <div>
            <label className="label" htmlFor="licensing_status">Licensing</label>
            <select id="licensing_status" name="licensing_status" className="input" defaultValue={t.licensing_status ?? ""} required>
              {!t.licensing_status && <option value="" disabled>Choose</option>}
              {LICENSING.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="permission_status">Permission to review on AVP</label>
            <select id="permission_status" name="permission_status" className="input" defaultValue={t.permission_status ?? ""} required aria-describedby="perm-note">
              {!t.permission_status && <option value="" disabled>Choose</option>}
              {PERMISSION.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <p id="perm-note" className="hint">
              {reviewable ? "Changing this from Granted removes it from the library straight away. Nothing is deleted." : "Analysts only see it once this is Granted and it’s marked eligible."}
            </p>
          </div>
          {TEXT.map((x) => (
            <div key={x.key}>
              <label className="label" htmlFor={x.key}>{x.label} <span className="font-normal text-ink-2">(optional)</span></label>
              <input id={x.key} name={x.key} className="input" defaultValue={t[x.key] ?? ""} />
            </div>
          ))}
          <div>
            <label className="label" htmlFor="institutional_ownership_context">Ownership notes <span className="font-normal text-ink-2">(optional)</span></label>
            <textarea id="institutional_ownership_context" name="institutional_ownership_context" rows={3} className="input" defaultValue={t.institutional_ownership_context ?? ""}
              placeholder="Co-owners, funder rights, or anything that limits who can license it." />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" disabled={act.busy}>Save details</button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
          <Feedback error={act.error} />
        </form>
      )}
      {!editing && <Feedback error={act.error} done={act.done} />}
    </section>
  );
}

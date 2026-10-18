"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import type { FeedbackKind } from "@/lib/types";
import { Feedback as Result, useAction } from "@/lib/useAction";
import { KINDS } from "./labels";

export function FeedbackForm({ from, kind: initialKind }: { from: string; kind?: FeedbackKind }) {
  const act = useAction();
  const [kind, setKind] = useState<FeedbackKind>(KINDS.some((k) => k.value === initialKind) ? initialKind! : "bug");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const json = { kind, subject: String(data.get("subject")).trim(), body: String(data.get("body")).trim(), page_url: from };
    if (await act.run(() => send("/feedback", { json }), "Sent. You'll see its status in Your feedback.")) form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset>
        <legend className="label">What is it about?</legend>
        <div className="mt-1 flex flex-col gap-1.5">
          {KINDS.map((k) => (
            <label key={k.value}
              className={`flex cursor-pointer gap-3 rounded-md border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue ${
                kind === k.value ? "border-blue bg-blue-tint" : "border-rule hover:bg-sunken"
              }`}>
              <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
              <span className="flex flex-col">
                <span className={`text-[14px] font-medium ${kind === k.value ? "text-blue" : ""}`}>{k.label}</span>
                <span className="text-[13px] text-ink-2">{k.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="fb-subject">Short summary</label>
        <input id="fb-subject" name="subject" className="input" required minLength={3} maxLength={200}
          placeholder={kind === "content" ? "e.g. Claims on page 4 are cut off" : "e.g. Library filters reset when I go back"} />
      </div>
      <div>
        <label className="label" htmlFor="fb-body">Details</label>
        <textarea id="fb-body" name="body" rows={6} className="input leading-relaxed" required minLength={10} maxLength={5000}
          placeholder="What you did, what you expected, and what happened instead." />
        {from && <p className="hint">Sent with the page you came from: <span className="data">{from}</span></p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" disabled={act.busy}>Send feedback</button>
        <Result error={act.error} done={act.done} />
      </div>
    </form>
  );
}

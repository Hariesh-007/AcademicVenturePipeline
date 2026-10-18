"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import type { FeedbackStatus } from "@/lib/types";
import { Feedback as Result, useAction } from "@/lib/useAction";
import { STATUS } from "@/app/(app)/feedback/labels";

export function StatusSelect({ id, status }: { id: string; status: FeedbackStatus }) {
  const act = useAction();
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <select aria-label="Status" className="input w-auto" defaultValue={status} disabled={act.busy}
        onChange={(e) => act.run(() => send(`/admin/feedback/${id}`, { method: "PATCH", json: { status: e.target.value } }))}>
        {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
      </select>
      {act.error && <Result error={act.error} />}
    </div>
  );
}

/** Admin answer to the sender: shown on their feedback page, plus an inbox note and an email. */
export function ReplyBox({ id, reply }: { id: string; reply: string | null }) {
  const act = useAction();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(reply ?? "");
  if (!open) {
    return (
      <button type="button" className="btn btn-quiet btn-sm self-start" onClick={() => setOpen(true)}>
        {reply ? "Edit reply" : "Reply to sender"}
      </button>
    );
  }
  return (
    <form className="flex flex-col gap-2" onSubmit={async (e) => {
      e.preventDefault();
      if (await act.run(() => send(`/admin/feedback/${id}`, { method: "PATCH", json: { reply: text.trim() } }), "Reply sent")) setOpen(false);
    }}>
      <label className="sr-only" htmlFor={`reply-${id}`}>Reply</label>
      <textarea id={`reply-${id}`} className="input min-h-20 py-2" maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={act.busy || !text.trim()}>Send reply</button>
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <Result error={act.error} done={act.done} />
    </form>
  );
}

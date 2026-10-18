"use client";

import { send } from "@/lib/client";
import { Feedback, useAction } from "@/lib/useAction";

export function Decide({ id }: { id: string }) {
  const act = useAction();
  const set = (status: "published" | "rejected") =>
    act.run(() => send(`/admin/challenges/${id}`, { method: "PATCH", json: { status } }));
  return (
    <span className="flex items-center gap-2">
      <button className="btn btn-primary btn-sm" disabled={act.busy} onClick={() => set("published")}>Publish</button>
      <button className="btn btn-quiet btn-sm btn-danger" disabled={act.busy} onClick={() => set("rejected")}>Reject</button>
      <Feedback error={act.error} />
    </span>
  );
}

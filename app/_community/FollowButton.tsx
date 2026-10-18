"use client";

// Follow a category, technology or analyst: their news lands in your weekly digest.
// Optimistic toggle, rolled back if the server refuses.
import { useState } from "react";
import { send } from "@/lib/client";
import type { FollowTarget } from "@/lib/types";

export function FollowButton({ type, id, initial, label }: { type: FollowTarget; id: string; initial: boolean; label?: string }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    const was = on;
    setOn(!was);
    setBusy(true);
    setError("");
    try {
      await send(`/follows/${type}/${id}`, { method: was ? "DELETE" : "PUT" });
    } catch (e) {
      setOn(was);
      setError(e instanceof Error ? e.message : "Couldn't save that");
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" aria-pressed={on} disabled={busy} onClick={toggle}
        title="Followed things appear in your weekly digest"
        className={`btn btn-sm ${on ? "border-transparent bg-blue-tint text-blue" : ""}`}>
        {on ? "Following" : "Follow"}{label ? ` ${label}` : ""}
      </button>
      {error && <span role="alert" className="text-[13px] text-danger">{error}</span>}
    </span>
  );
}

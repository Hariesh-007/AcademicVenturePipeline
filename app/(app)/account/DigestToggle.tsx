"use client";

import { useState } from "react";
import { send } from "@/lib/client";

export function DigestToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState("");
  async function toggle() {
    const next = !on;
    setOn(next);
    setError("");
    try {
      await send("/me/digest", { method: "PUT", json: { enabled: next } });
    } catch (e) {
      setOn(!next);
      setError(e instanceof Error ? e.message : "Couldn't save that");
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-3 text-[15px]">
        <input type="checkbox" checked={on} onChange={toggle} className="size-4 accent-[var(--blue)]" />
        Email me a weekly digest
      </label>
      <p className="hint mt-0">
        Mondays: new technologies in your areas and the ones you follow, replies and mentions, reputation earned.
        Skipped when there&apos;s nothing new.
      </p>
      {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
    </div>
  );
}

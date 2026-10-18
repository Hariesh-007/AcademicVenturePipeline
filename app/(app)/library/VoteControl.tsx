"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import type { VoteState } from "@/lib/types";
import { clock, useRead } from "./[id]/ReadTimer";

/** Up and down counts, each its own positive number (never a net score that can go negative).
 *  Locked until you've read the technology for the minimum time: on the technology page the
 *  reading timer unlocks it live; in the library list it uses the row's read_ok.
 *  Optimistic: counts move on click, revert if the server says no. */
export function VoteControl({ technologyId, initial, size = "md" }: { technologyId: string; initial: VoteState; size?: "md" | "lg" }) {
  const [v, setV] = useState(initial);
  const [error, setError] = useState("");
  const read = useRead();
  const open = read ? read.ok : v.read_ok;
  const hint = read ? `Read for ${clock(read.min)} to vote` : "Open and read it to vote";

  async function cast(dir: 1 | -1) {
    const value = v.my_vote === dir ? 0 : dir; // clicking your current vote clears it
    if (value !== 0 && !open) return;
    const prev = v;
    setV({
      ...v,
      my_vote: value,
      score: v.score - v.my_vote + value,
      ups: v.ups - (v.my_vote === 1 ? 1 : 0) + (value === 1 ? 1 : 0),
      downs: v.downs - (v.my_vote === -1 ? 1 : 0) + (value === -1 ? 1 : 0),
    });
    setError("");
    try {
      setV(await send<VoteState>(`/technologies/${technologyId}/vote`, { method: "PUT", json: { value } }));
    } catch (e) {
      setV(prev);
      setError(e instanceof Error ? e.message : "Vote failed");
    }
  }

  const btn = (dir: 1 | -1) => {
    const on = v.my_vote === dir;
    const locked = !open && !on; // your existing vote can always be cleared
    const count = dir === 1 ? v.ups : v.downs;
    const word = dir === 1 ? "Upvote" : "Downvote";
    return (
      <button
        type="button"
        onClick={() => cast(dir)}
        aria-pressed={on}
        aria-disabled={locked}
        aria-label={`${word}, ${count} so far${locked ? `. ${hint}` : ""}`}
        title={locked ? hint : `${word} (${count})`}
        className={`flex items-center justify-center gap-1.5 rounded-md tabular-nums transition-[colors,transform,box-shadow] ${
          size === "lg" ? "h-9 min-w-16 px-2.5 text-[15px]" : "h-8 min-w-14 px-2 text-[14px]"
        } ${
          on
            ? dir === 1
              ? "bg-blue text-blue-ink scale-[1.04] shadow-[0_0_0_3px_color-mix(in_srgb,var(--blue)_18%,transparent)]"
              : "bg-orange text-orange-ink scale-[1.04] shadow-[0_0_0_3px_color-mix(in_srgb,var(--orange)_18%,transparent)]"
            : locked ? "cursor-not-allowed text-ink-2 opacity-60" : "text-ink-2 hover:bg-sunken hover:text-ink hover:scale-[1.02]"
        }`}
        style={{ transitionDuration: '150ms', transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)' }}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true" className={dir === -1 ? "rotate-180" : ""}>
          <path d="M7 2 L13 11 H1 Z" fill="currentColor" />
        </svg>
        <span aria-hidden="true">{count}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col items-stretch gap-1">
      {btn(1)}
      {btn(-1)}
      {error && <span role="alert" className="sr-only">{error}</span>}
    </div>
  );
}

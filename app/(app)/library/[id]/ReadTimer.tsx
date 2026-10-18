"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { send } from "@/lib/client";

/** Reading time on this technology. The server clock is the authority (each beat credits at
 *  most 15s of real elapsed time); this only decides *when* to beat: tab visible and the reader
 *  did something in the last minute. Votes and review submission unlock from the server's count. */

type Read = { seconds: number; min: number; ok: boolean };
const Ctx = createContext<Read | null>(null);
export const useRead = () => useContext(Ctx);

const BEAT_MS = 15_000;
const IDLE_MS = 60_000;
const BONUS_CAP = 5;

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const bonusFor = (s: number, min: number) => (min > 0 ? Math.max(0, Math.min(Math.floor(s / min) - 1, BONUS_CAP)) : 0);

export function ReadingProvider({ technologyId, seconds, min, exempt, children }: {
  technologyId: string; seconds: number; min: number; exempt: boolean; children: React.ReactNode;
}) {
  const [server, setServer] = useState(seconds);
  const [shown, setShown] = useState(seconds); // ticks locally between beats so the clock moves
  const active = useRef(0); // last interaction; opening the page counts as one

  useEffect(() => {
    if (exempt) return;
    active.current = Date.now();
    const touch = () => { active.current = Date.now(); };
    const reading = () => document.visibilityState === "visible" && Date.now() - active.current < IDLE_MS;
    const beat = async () => {
      try {
        const r = await send<{ seconds: number }>(`/technologies/${technologyId}/read`, { method: "POST" });
        setServer(r.seconds);
        setShown(r.seconds);
      } catch {} // a missed beat only costs a few seconds of credit
    };
    const events = ["scroll", "pointermove", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => document.addEventListener(e, touch, { capture: true, passive: true }));
    beat(); // starts the server-side clock
    const beats = setInterval(() => { if (reading()) beat(); }, BEAT_MS);
    const ticks = setInterval(() => { if (reading()) setShown((s) => s + 1); }, 1000);
    return () => {
      events.forEach((e) => document.removeEventListener(e, touch, { capture: true }));
      clearInterval(beats);
      clearInterval(ticks);
    };
  }, [technologyId, exempt]);

  return <Ctx.Provider value={{ seconds: shown, min, ok: exempt || server >= min }}>{children}</Ctx.Provider>;
}

/** One quiet line under the title: progress to the minimum, then the bonus it's building. */
export function ReadMeter() {
  const r = useRead();
  if (!r || r.min === 0) return null;
  const pct = Math.min(100, (r.seconds / r.min) * 100);
  const bonus = bonusFor(r.seconds, r.min);
  const next = bonus < BONUS_CAP ? (bonus + 2) * r.min : null;
  return (
    <div className="mt-3 flex max-w-[52ch] flex-col gap-1.5">
      <div className="h-1 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
        <div className={`h-full transition-[width] duration-1000 ease-linear ${r.ok ? "bg-ok" : "bg-blue"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[13px] text-ink-2 tabular-nums" role="status">
        {!r.ok ? (
          <>Read for {clock(r.min)} to vote and submit a review. <span className="text-ink">{clock(r.seconds)}</span> so far.</>
        ) : (
          <>
            Read <span className="text-ink">{clock(r.seconds)}</span>.{" "}
            {bonus > 0 ? `Your review earns +${bonus} reputation for reading closely.` : "Voting and reviews are open."}
            {next && ` Keep reading to ${clock(next)} for +${bonus + 1}.`}
          </>
        )}
      </p>
    </div>
  );
}

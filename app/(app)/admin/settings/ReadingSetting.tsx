"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import { Feedback as Result, useAction } from "@/lib/useAction";

const fmt = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60}s` : ""}` : `${s}s`);

export function ReadingSetting({ initial }: { initial: number }) {
  const act = useAction();
  const [min, setMin] = useState(Math.floor(initial / 60));
  const [sec, setSec] = useState(initial % 60);
  const total = min * 60 + sec;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await act.run(() => send("/admin/settings", { method: "PUT", json: { min_read_seconds: total } }), `Saved. Analysers now read for ${fmt(total)} before voting.`);
  }

  return (
    <form onSubmit={handleSave} className="panel flex max-w-[720px] flex-col gap-5 p-5">
      <div>
        <h2 className="font-serif text-[20px]">Minimum reading time</h2>
        <p className="mt-1 text-[14px] text-ink-2">
          How long an analyser has to spend reading a technology before they can vote on it or submit a review. Time only counts while the tab is open and they are
          scrolling, moving the pointer or typing. Set it to 0 to switch the rule off.
        </p>
      </div>
      <fieldset className="flex flex-wrap items-end gap-3">
        <legend className="sr-only">Minimum reading time</legend>
        <div>
          <label className="label" htmlFor="rt-min">Minutes</label>
          <input id="rt-min" type="number" min={0} max={60} className="input w-24 tabular-nums" value={min}
            onChange={(e) => setMin(Math.max(0, Math.min(60, Number(e.target.value) || 0)))} />
        </div>
        <div>
          <label className="label" htmlFor="rt-sec">Seconds</label>
          <input id="rt-sec" type="number" min={0} max={59} step={5} className="input w-24 tabular-nums" value={sec}
            onChange={(e) => setSec(Math.max(0, Math.min(59, Number(e.target.value) || 0)))} />
        </div>
        <button className="btn btn-primary" disabled={act.busy || total === initial || total > 3600}>Save</button>
      </fieldset>
      {total > 0 && (
        <div className="border-t border-rule pt-4 text-[14px]">
          <h3 className="label text-ink">What reading earns</h3>
          <p className="text-ink-2">
            Reaching {fmt(total)} only unlocks voting and reviewing. Each further {fmt(total)} adds +1 reputation, paid when the review is submitted:
            {" "}{fmt(total * 2)} earns +1, {fmt(total * 3)} earns +2, up to +5 at {fmt(total * 6)}. An analyser can earn at most +15 a day this way.
          </p>
        </div>
      )}
      <Result error={act.error} done={act.done} />
    </form>
  );
}

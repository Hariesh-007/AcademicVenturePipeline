"use client";

import { send } from "@/lib/client";
import { Feedback as Result, useAction } from "@/lib/useAction";

/** On/off for public previews: a university's switch, or one technology's opt-out.
 *  A real checkbox styled as a switch, so it keeps native keyboard and screen-reader behaviour. */
export function PreviewSwitch({ url, on, label, hint, compact = false }: {
  url: string; on: boolean; label: string; hint?: string; compact?: boolean;
}) {
  const act = useAction();
  return (
    <div className={compact ? "" : "flex flex-col gap-1"}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" role="switch" defaultChecked={on} disabled={act.busy} className="peer sr-only"
          onChange={(e) => act.run(() => send(url, { method: "PUT", json: { enabled: e.target.checked } }))} />
        <span aria-hidden="true"
          className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-rule-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-surface after:transition-transform peer-checked:bg-blue peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-blue peer-focus-visible:ring-offset-2 peer-disabled:opacity-60 motion-reduce:after:transition-none" />
        <span className={compact ? "sr-only" : "flex flex-col"}>
          <span className="text-[14px] font-medium">{label}</span>
          {hint && <span className="text-[13px] text-ink-2">{hint}</span>}
        </span>
      </label>
      {act.error && <Result error={act.error} />}
    </div>
  );
}

"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import { Feedback, useAction } from "@/lib/useAction";

/** AI-drafted card summary, from published patent text only. Nobody else sees it until you
 *  accept it; you can edit it first. */
export function SummaryDraft({ technologyId, summary, draft }: { technologyId: string; summary: string; draft: string }) {
  const [text, setText] = useState(draft);
  const { run, busy, error, done } = useAction();
  const url = `/technologies/${technologyId}/summary`;
  return (
    <section>
      <h2 className="label">Summary</h2>
      <div className="panel flex flex-col gap-3 p-4 text-[14px]">
        {draft || text ? (
          <>
            <p className="text-ink-2">AI draft from the published patents. Only your university sees it until you accept it.</p>
            <textarea aria-label="Summary draft" className="input min-h-28 py-2" value={text} onChange={(e) => setText(e.target.value)} />
            <button type="button" className="btn btn-primary self-start" disabled={busy || !text.trim()}
              onClick={() => run(() => send(`${url}/accept`, { json: { text } }), "Summary saved")}>
              {summary ? "Replace the summary" : "Use as summary"}
            </button>
          </>
        ) : (
          <p className="text-ink-2">{summary ? "Want a plain-language rewrite?" : "This technology has no summary yet, so its library card is empty."}</p>
        )}
        <button type="button" className="btn self-start" disabled={busy}
          onClick={() => run(async () => setText((await send<{ draft: string }>(`${url}/draft`, { method: "POST" })).draft), "Drafted")}>
          {draft || text ? "Draft again" : "Draft with AI"}
        </button>
        <Feedback error={error} done={done} />
      </div>
    </section>
  );
}

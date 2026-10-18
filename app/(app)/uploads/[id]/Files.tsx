"use client";

import { useRef } from "react";
import { send } from "@/lib/client";
import type { DocumentRow } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";
import { ProcessingStatus } from "@/app/(app)/ui";
import type { Progress, Registry } from "./registry";

const TONE = { ok: "text-ok", warn: "text-orange-ink dark:text-orange", muted: "text-ink-2" };

export function Files({ technologyId, documents, registry, progress }: { technologyId: string; documents: DocumentRow[]; registry: Record<string, Registry | null>; progress: Record<string, Progress | null> }) {
  const act = useAction();
  const input = useRef<HTMLInputElement>(null);

  async function handleAdd(list: FileList | null) {
    if (!list?.length) return;
    await act.run(async () => {
      for (const file of Array.from(list)) {
        const form = new FormData();
        form.append("file", file);
        await send(`/technologies/${technologyId}/documents`, { form });
      }
    }, "Uploaded. Processing has started.");
    if (input.current) input.current.value = "";
  }

  return (
    <section aria-labelledby="files-h" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="files-h" className="font-serif text-[20px]">Files</h2>
        <button className="btn btn-sm" onClick={() => input.current?.click()} disabled={act.busy}>
          {act.busy ? "Uploading…" : "Add PDF"}
        </button>
        <input ref={input} type="file" accept="application/pdf,.pdf" multiple className="sr-only" onChange={(e) => handleAdd(e.target.files)} aria-label="Add PDF files" />
      </div>
      {documents.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-rule-strong p-4 text-[14px] text-ink-2">No files yet. Add the patent PDF to start processing.</p>
      ) : (
        <ul className="panel divide-y divide-rule">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-col gap-1.5 px-4 py-3">
              <a href={`/api/documents/${d.id}/file`} target="_blank" rel="noreferrer" className="truncate text-[14px] font-medium hover:text-blue hover:underline underline-offset-4">
                {d.original_filename}
              </a>
              <div className="flex items-center justify-between gap-2">
                <ProcessingStatus status={d.processing_status} />
                <span className="flex items-center gap-2">
                  {d.page_count != null && <span className="data text-ink-2">{d.page_count} pp</span>}
                  {d.processing_status === "PROCESSING_FAILED" && (
                    <button className="btn btn-sm" disabled={act.busy} onClick={() => act.run(() => send(`/documents/${d.id}/retry`, { method: "POST" }), "Retrying.")}>
                      Retry
                    </button>
                  )}
                </span>
              </div>
              {progress[d.id] && <PageProgress name={d.original_filename} {...progress[d.id]!} />}
              {registry[d.id] && (
                <div className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className={TONE[registry[d.id]!.tone]}>{registry[d.id]!.text}</span>
                  {registry[d.id]!.retry && d.processing_status !== "PROCESSING_FAILED" && (
                    <button className="btn btn-quiet btn-sm" disabled={act.busy}
                      onClick={() => act.run(() => send(`/documents/${d.id}/process`, { method: "POST" }), "Looking it up again.")}>
                      Look up again
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Feedback error={act.error} done={act.done} />
    </section>
  );
}

// ponytail: page count, not a percentage or ETA: an OCR page can take a minute, a text page milliseconds
function PageProgress({ name, done, total, ocr }: Progress & { name: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="block h-1.5 rounded-full bg-sunken" role="progressbar"
        aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={`Reading ${name}`}>
        <span className="block h-1.5 rounded-full bg-blue transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${(100 * done) / total}%` }} />
      </span>
      <span className="text-[12.5px] text-ink-2">
        Read page <span className="data">{done}</span> of <span className="data">{total}</span>
        {ocr > 0 && <> · <span className="data">{ocr}</span> scanned, read with OCR</>}
      </span>
    </div>
  );
}

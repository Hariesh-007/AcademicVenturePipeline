"use client";

import Link from "next/link";
import { useState } from "react";
import { send } from "@/lib/client";
import type { Evidence as Item, EvidenceKind } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";

const KINDS: { value: EvidenceKind; label: string }[] = [
  { value: "claim", label: "Claim" },
  { value: "result", label: "Result" },
  { value: "metric", label: "Metric" },
  { value: "method", label: "Method" },
  { value: "ip_scope", label: "IP scope" },
  { value: "regulatory", label: "Regulatory" },
  { value: "market", label: "Market" },
  { value: "other", label: "Other" },
];
const kindLabel = (k: string) => KINDS.find((x) => x.value === k)?.label ?? k;
const SYSTEM = "system:evidence";
const host = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

/** Same document: scroll the reader. Another document: navigate, the reader jumps on load. */
function PageLink({ item, technologyId, docId, docName }: { item: Item; technologyId: string; docId?: string; docName?: string }) {
  if (item.source_url) {
    return <a href={item.source_url} target="_blank" rel="noreferrer" className="truncate underline-offset-2 hover:underline">{host(item.source_url)}</a>;
  }
  const label = `Page ${item.page}${item.document_id !== docId && docName ? `, ${docName}` : ""}`;
  if (item.document_id === docId) {
    return (
      <button className="underline-offset-2 hover:underline"
        onClick={() => document.querySelector(`[data-page="${item.page}"]`)?.scrollIntoView({ behavior: "smooth" })}>
        {label}
      </button>
    );
  }
  return (
    <Link href={`/library/${technologyId}?doc=${item.document_id}&page=${item.page}&tab=evidence`} scroll={false}
      className="underline-offset-2 hover:underline">{label}</Link>
  );
}

function Retract({ technologyId, id }: { technologyId: string; id: string }) {
  const act = useAction();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!open) return <button className="text-ink-2 hover:text-danger" onClick={() => setOpen(true)}>Retract</button>;
  return (
    <form className="mt-2 flex w-full flex-col gap-2" onSubmit={(e) => {
      e.preventDefault();
      act.run(() => send(`/technologies/${technologyId}/evidence/${id}/retract`, { json: { reason } }));
    }}>
      <label className="sr-only" htmlFor={`why-${id}`}>Why retract this?</label>
      <input id={`why-${id}`} className="input" autoFocus required minLength={3} value={reason}
        onChange={(e) => setReason(e.target.value)} placeholder="Why retract this? For example: wrong page" />
      <div className="flex gap-2">
        <button className="btn btn-sm btn-danger" disabled={act.busy}>Retract quote</button>
        <button type="button" className="btn btn-sm btn-quiet" onClick={() => setOpen(false)}>Keep it</button>
      </div>
      <Feedback error={act.error} />
    </form>
  );
}

function AddForm({ technologyId, docs, docId, onDone }: {
  technologyId: string; docs: { id: string; name: string }[]; docId?: string; onDone: () => void;
}) {
  const act = useAction();
  const [from, setFrom] = useState<"document" | "link">(docs.length ? "document" : "link");
  const [doc, setDoc] = useState(docId ?? docs[0]?.id ?? "");
  const [page, setPage] = useState("");
  const [url, setUrl] = useState("");
  const [quote, setQuote] = useState("");
  const [kind, setKind] = useState<EvidenceKind>("claim");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const json = from === "document"
      ? { document_id: doc, page: Number(page), quote, kind }
      : { source_url: url, quote, kind };
    if (await act.run(() => send(`/technologies/${technologyId}/evidence`, { json }))) onDone();
  }

  return (
    <form onSubmit={submit} className="panel flex flex-col gap-4 p-4">
      <fieldset>
        <legend className="label">Source</legend>
        <div className="flex gap-1">
          {docs.length > 0 && (
            <button type="button" className={`chip ${from === "document" ? "chip-on" : ""}`} aria-pressed={from === "document"} onClick={() => setFrom("document")}>This technology&apos;s documents</button>
          )}
          <button type="button" className={`chip ${from === "link" ? "chip-on" : ""}`} aria-pressed={from === "link"} onClick={() => setFrom("link")}>A public link</button>
        </div>
      </fieldset>
      {from === "document" ? (
        <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-2">
          <div>
            <label className="label" htmlFor="ev-doc">Document</label>
            <select id="ev-doc" className="input" value={doc} onChange={(e) => setDoc(e.target.value)}>
              {docs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ev-page">Page</label>
            <input id="ev-page" className="input" type="number" min={1} required value={page} onChange={(e) => setPage(e.target.value)} />
          </div>
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="ev-url">Link</label>
          <input id="ev-url" className="input" type="url" required pattern="https?://.+" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="ev-quote">Quote</label>
        <textarea id="ev-quote" className="input leading-relaxed" rows={4} required minLength={3} value={quote} onChange={(e) => setQuote(e.target.value)} />
        <p className="hint">{from === "document" ? "Copy it exactly from the page. We check it’s there before saving." : "Copy the exact sentence from the source."}</p>
      </div>
      <div>
        <label className="label" htmlFor="ev-kind">What it shows</label>
        <select id="ev-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as EvidenceKind)}>
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary btn-sm" disabled={act.busy}>Add evidence</button>
        <button type="button" className="btn btn-quiet btn-sm" onClick={onDone}>Cancel</button>
      </div>
      <Feedback error={act.error} />
    </form>
  );
}

/** Who found a quote, as a badge: AI in evidence-blue, people in neutral. Text, not colour alone. */
function SourceBadge({ addedBy, meId }: { addedBy: string; meId: string }) {
  if (addedBy === SYSTEM) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue/30 bg-blue-tint px-2 py-0.5 text-[12px] font-medium text-blue">
        <svg aria-hidden viewBox="0 0 16 16" className="size-3" fill="currentColor">
          <path d="M8 0l1.6 4.8L14.4 6.4 9.6 8 8 12.8 6.4 8 1.6 6.4l4.8-1.6zM13 10.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
        </svg>
        AI-extracted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-sunken px-2 py-0.5 text-[12px] text-ink-2">
      {addedBy === meId ? "Added by you" : "Added by a member"}
    </span>
  );
}

export function EvidenceList({ technologyId, items, docs, docId, open, meId, canRetractAll }: {
  technologyId: string; items: Item[]; docs: { id: string; name: string }[]; docId?: string;
  open: boolean; meId: string; canRetractAll: boolean;
}) {
  const [kind, setKind] = useState<EvidenceKind | null>(null);
  const [aiOnly, setAiOnly] = useState(false);
  const [adding, setAdding] = useState(false);
  const counts = new Map<string, number>();
  items.forEach((i) => counts.set(i.kind, (counts.get(i.kind) ?? 0) + 1));
  const aiCount = items.filter((i) => i.added_by === SYSTEM).length;
  const shown = items.filter((i) => (!kind || i.kind === kind) && (!aiOnly || i.added_by === SYSTEM));
  const names = Object.fromEntries(docs.map((d) => [d.id, d.name]));

  if (!open) {
    return (
      <div className="rounded-[10px] border border-dashed border-rule-strong p-5 text-[14px]">
        <p className="font-serif text-[18px]">Evidence isn&apos;t collected yet</p>
        <p className="mt-1 text-ink-2">Quotes appear here once the university confirms this technology can be reviewed.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] text-ink-2">
        Exact quotes from the documents, each linked to its page. Reviews and the final dossier cite these.
      </p>
      {items.length > 0 && (
        <div role="group" aria-label="Filter by kind" className="flex flex-wrap gap-1">
          <button className={`chip ${kind === null ? "chip-on" : ""}`} aria-pressed={kind === null} onClick={() => setKind(null)}>All {items.length}</button>
          {KINDS.filter((k) => counts.has(k.value)).map((k) => (
            <button key={k.value} className={`chip ${kind === k.value ? "chip-on" : ""}`} aria-pressed={kind === k.value}
              onClick={() => setKind(kind === k.value ? null : k.value)}>
              {k.label} {counts.get(k.value)}
            </button>
          ))}
          {aiCount > 0 && aiCount < items.length && (
            <button className={`chip ml-2 ${aiOnly ? "chip-on" : ""}`} aria-pressed={aiOnly} onClick={() => setAiOnly(!aiOnly)}>
              AI-extracted {aiCount}
            </button>
          )}
        </div>
      )}
      {adding
        ? <AddForm technologyId={technologyId} docs={docs} docId={docId} onDone={() => setAdding(false)} />
        : <button className="btn btn-sm self-start" onClick={() => setAdding(true)}>Add evidence</button>}
      {items.length === 0 && (
        <p className="text-[14px] text-ink-2">No quotes yet. Extraction may still be running, or you can add the first one.</p>
      )}
      <ol className="flex flex-col gap-4">
        {shown.map((i) => (
          <li key={i.id} className={`border-l-2 pl-4 ${i.added_by === SYSTEM ? "border-blue/40" : "border-rule-strong"}`}>
            <blockquote className="font-serif text-[16px] leading-relaxed text-pretty">{i.quote}</blockquote>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
              <span className="text-ink">{kindLabel(i.kind)}</span>
              <PageLink item={i} technologyId={technologyId} docId={docId} docName={i.document_id ? names[i.document_id] : undefined} />
              <SourceBadge addedBy={i.added_by} meId={meId} />
              {(canRetractAll || i.added_by === meId) && <Retract technologyId={technologyId} id={i.id} />}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Page } from "@/lib/types";

/** Patent PDFs come out as hard-wrapped lines; rejoin them into readable paragraphs.
 *  ponytail: line heuristics (sentence end on a short line, numbered items); good enough for
 *  patents, swap for layout-aware blocks from extract.py if other document types need it. */
function paragraphs(text: string): string[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const longest = Math.max(40, ...lines.map((l) => l.length));
  const out: string[] = [];
  let cur = "";
  for (const line of lines) {
    const startsItem = /^(\(\d+\)|\[\d+\]|\d+\.\s|claims?\b|abstract\b)/i.test(line);
    if (cur && startsItem) {
      out.push(cur);
      cur = "";
    }
    cur = !cur ? line : cur.endsWith("-") ? cur.slice(0, -1) + line : `${cur} ${line}`;
    if (/[.:;]$/.test(line) && line.length < longest * 0.75) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

const SIZES = [16, 18, 20, 22];
function load(key: string, fallback: number) {
  try {
    return Number(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, v: number) {
  try {
    localStorage.setItem(key, String(v));
  } catch {}
}

export function Reader({ docs, docId, technologyId, pages, summary, jumpTo }: {
  docs: { id: string; name: string }[]; docId?: string; technologyId: string; pages: Page[]; summary: string; jumpTo?: number;
}) {
  const [view, setView] = useState<"text" | "pdf">(pages.length ? "text" : "pdf");
  const [size, setSize] = useState(18);
  const [resume, setResume] = useState(0);
  const [current, setCurrent] = useState(1);
  const pageRefs = useRef<(HTMLElement | null)[]>([]);
  const blocks = useMemo(() => pages.map((p) => ({ ...p, paras: paragraphs(p.text) })), [pages]);
  const posKey = `avp-read-${docId}`;

  useEffect(() => {
    setSize(load("avp-reader-size", 18)); // eslint-disable-line react-hooks/set-state-in-effect
    const last = load(posKey, 1);
    if (last > 1 && !jumpTo) setResume(last);
  }, [posKey, jumpTo]);

  // an evidence link from another document lands on its page
  useEffect(() => {
    if (jumpTo) pageRefs.current[jumpTo - 1]?.scrollIntoView();
  }, [jumpTo]);

  // remember the page in view so the analyser can resume tomorrow
  useEffect(() => {
    if (view !== "text") return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const n = Number((e.target as HTMLElement).dataset.page);
          setCurrent(n);
          save(posKey, n);
        }
      }
    }, { rootMargin: "-20% 0px -70% 0px" });
    pageRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [view, posKey, blocks.length]);

  const changeSize = (d: number) => {
    const n = SIZES[Math.max(0, Math.min(SIZES.length - 1, SIZES.indexOf(size) + d))];
    setSize(n);
    save("avp-reader-size", n);
  };

  return (
    <section aria-label="Document" className="min-w-0 bg-[var(--reader-bg)]">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-rule bg-[var(--reader-bg)]/95 px-4 py-2 backdrop-blur sm:px-8">
        <div role="tablist" aria-label="View" className="flex rounded-md border border-rule-strong p-0.5">
          {(["text", "pdf"] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={`rounded px-3 py-1 text-[13px] ${view === v ? "bg-ink text-canvas" : "text-ink-2 hover:text-ink"}`}>
              {v === "text" ? "Text" : "Original PDF"}
            </button>
          ))}
        </div>
        {docs.length > 1 && (
          <nav aria-label="Documents" className="flex flex-wrap gap-1">
            {docs.map((d) => (
              <Link key={d.id} href={`/library/${technologyId}?doc=${d.id}`} scroll={false}
                aria-current={d.id === docId ? "page" : undefined}
                className={`max-w-[200px] truncate rounded px-2 py-1 text-[13px] ${d.id === docId ? "bg-sunken text-ink" : "text-ink-2 hover:text-ink"}`}>
                {d.name}
              </Link>
            ))}
          </nav>
        )}
        {view === "text" && pages.length > 0 && (
          <div className="ml-auto flex items-center gap-1 text-[13px] text-ink-2">
            <span className="data mr-2">p. {current}/{pages.length}</span>
            <button className="btn btn-quiet btn-sm" onClick={() => changeSize(-1)} aria-label="Smaller text" disabled={size === SIZES[0]}>A−</button>
            <button className="btn btn-quiet btn-sm" onClick={() => changeSize(1)} aria-label="Larger text" disabled={size === SIZES.at(-1)}>A+</button>
          </div>
        )}
      </div>

      {view === "pdf" ? (
        docId ? (
          <iframe title="Original PDF" src={`/api/documents/${docId}/file`} className="h-[calc(100vh-56px)] w-full border-0" />
        ) : (
          <p className="p-8 text-ink-2">No document attached.</p>
        )
      ) : (
        <article className="mx-auto max-w-[68ch] px-5 py-10 font-serif sm:px-8" style={{ fontSize: size, lineHeight: 1.7 }}>
          {resume > 1 && (
            <button
              className="btn btn-sm mb-8 font-sans"
              onClick={() => { pageRefs.current[resume - 1]?.scrollIntoView({ behavior: "smooth" }); setResume(0); }}
            >
              Resume at page {resume}
            </button>
          )}
          {summary && (
            <p className="mb-10 border-l-2 border-blue pl-4 font-sans text-[15px] leading-relaxed text-ink-2">{summary}</p>
          )}
          {blocks.map((p, i) => (
            <section key={p.page} data-page={p.page} ref={(el) => { pageRefs.current[i] = el; }} aria-label={`Page ${p.page}`} className="scroll-mt-16">
              <div className="my-8 flex items-center gap-3 font-sans text-[12px] text-ink-3" aria-hidden="true">
                <span className="h-px flex-1 bg-rule" />
                <span className="data">{p.page}</span>
                <span className="h-px flex-1 bg-rule" />
              </div>
              {p.method === "ocr_failed" && (
                <p className="mb-4 rounded-md border border-dashed border-rule-strong p-3 font-sans text-[14px] text-ink-2">
                  This page is a scan we couldn&apos;t read. Switch to Original PDF to see it.
                </p>
              )}
              {p.paras.map((para, j) => <p key={j} className="mb-[0.9em] text-pretty">{para}</p>)}
            </section>
          ))}
          {pages.length === 0 && (
            <p className="font-sans text-[15px] text-ink-2">Text isn&apos;t available for this file yet. The original PDF is still readable.</p>
          )}
        </article>
      )}
    </section>
  );
}

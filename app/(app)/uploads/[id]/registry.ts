// Plain module (no "use client"): the server page computes this, Files renders it.

export type Run = { stage: string; status: string; output: Record<string, unknown>; error: { code?: string; message?: string } | null };
export type Registry = { tone: "ok" | "warn" | "muted"; text: string; retry: boolean };

/** What the EPO register lookup (enrich stage) said about this document, in plain words. */
export function registryState(runs: Run[]): Registry | null {
  const run = runs.find((r) => r.stage === "enrich");
  if (!run) return null;
  if (run.status === "FAILED") return { tone: "warn", text: "EPO register unreachable", retry: true };
  if (run.status !== "SUCCEEDED") return null;
  const out = run.output as { reason?: string; lookups?: { status: string; query: string }[] };
  const lookups = out.lookups ?? [];
  // runs from before the provider existed stored NOT_CONFIGURED per lookup instead of a reason
  const notSetUp = out.reason === "PROVIDER_NOT_CONFIGURED" ||
    (lookups.length > 0 && lookups.every((l) => l.status === "NOT_CONFIGURED"));
  if (notSetUp) return { tone: "muted", text: "EPO lookup not set up", retry: true };
  if (out.reason === "PATENT_IDENTIFIER_NOT_FOUND") return { tone: "muted", text: "No patent number to look up", retry: false };
  const found = lookups.filter((l) => l.status === "OK");
  if (found.length) return { tone: "ok", text: `Matched in EPO register (${found.map((l) => l.query).join(", ")})`, retry: true };
  return { tone: "warn", text: "Not found in EPO register", retry: true };
}

export type Progress = { done: number; total: number; ocr: number };

/** Pages read so far while text extraction (incl. OCR) runs; the job writes it every ~2s. */
export function extractProgress(runs: Run[]): Progress | null {
  const run = runs.find((r) => r.stage === "extract");
  const out = run?.output as { pages_done?: number; pages_total?: number; ocr_pages?: number } | undefined;
  if (run?.status !== "RUNNING" || !out?.pages_done || !out.pages_total) return null;
  return { done: out.pages_done, total: out.pages_total, ocr: out.ocr_pages ?? 0 };
}

"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { send } from "@/lib/client";
import { LICENSING, PERMISSION } from "@/lib/context";
import type { Category, Institution, Technology } from "@/lib/types";
import { CategoryPicker } from "@/app/(app)/uploads/CategoryPicker";

const MAX = 10 * 1024 * 1024; // backend limit (storage plan)
const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

export function UploadForm({ categories, institutions }: { categories: Category[]; institutions: Institution[] | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    const errs: string[] = [];
    for (const f of Array.from(list)) {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) errs.push(`${f.name}: only PDF files are accepted.`);
      else if (f.size > MAX) errs.push(`${f.name} is ${mb(f.size)}; the limit is 10 MB.`);
      else if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    setFiles(next);
    setFileErrors(errs);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!files.length) return setError("Attach at least one PDF.");
    const f = new FormData(e.currentTarget);
    setError("");
    setBusy("Creating the record…");
    let tech: Technology;
    try {
      tech = await send<Technology>("/technologies", {
        json: {
          title: f.get("title"),
          summary: f.get("summary") ?? "",
          originating_department: f.get("department") || null,
          originating_lab: f.get("lab") || null,
          licensing_status: f.get("licensing_status") || null,
          permission_status: f.get("permission_status") || null,
          category_ids: picked,
          institution_id: f.get("institution_id") || null,
        },
      });
    } catch (err) {
      setBusy("");
      return setError(err instanceof Error ? err.message : "Could not create the record");
    }
    const failed: string[] = [];
    for (const [i, file] of files.entries()) {
      setBusy(`Uploading ${i + 1} of ${files.length}: ${file.name}`);
      const form = new FormData();
      form.append("file", file);
      try {
        await send(`/technologies/${tech.id}/documents`, { form });
      } catch (err) {
        failed.push(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
    }
    // the record exists either way; the detail page lets them retry or add files
    router.push(`/uploads/${tech.id}${failed.length ? `?failed=${encodeURIComponent(failed.join("\n"))}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-[1000px] gap-8 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-5">
        {institutions && (
          <div>
            <label className="label" htmlFor="institution_id">University</label>
            <select id="institution_id" name="institution_id" required className="input" defaultValue="">
              <option value="" disabled>Choose a university</option>
              {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor="title">Technology title</label>
          <input id="title" name="title" required maxLength={500} className="input" placeholder="e.g. Low-cost soil moisture sensor" />
          <p className="hint">The name analysers will see. You can use the patent title.</p>
        </div>
        <div>
          <label className="label" htmlFor="summary">Short description <span className="font-normal text-ink-2">(optional)</span></label>
          <textarea id="summary" name="summary" rows={4} className="input" placeholder="What it does and who it could help, in two or three sentences." />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="department">Department <span className="font-normal text-ink-2">(optional)</span></label>
            <input id="department" name="department" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="lab">Lab or group <span className="font-normal text-ink-2">(optional)</span></label>
            <input id="lab" name="lab" className="input" />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="licensing_status">Licensing</label>
            <select id="licensing_status" name="licensing_status" className="input" defaultValue="">
              <option value="">Choose later</option>
              {LICENSING.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="permission_status">Permission to review on AVP</label>
            <select id="permission_status" name="permission_status" className="input" defaultValue="">
              <option value="">Choose later</option>
              {PERMISSION.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <p className="hint mt-0 sm:col-span-2">Both are needed before the record can be submitted. Analysts only see it once permission is granted and it’s marked eligible.</p>
        </div>
        <fieldset>
          <legend className="label">Categories</legend>
          <CategoryPicker categories={categories} value={picked} onChange={setPicked} />
          <p className="hint">Pick all that apply. More are suggested from the patent’s classification codes after processing.</p>
        </fieldset>
      </div>

      <div className="flex flex-col gap-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
          className={`flex flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed px-6 py-10 text-center transition-colors ${
            over ? "border-blue bg-blue-tint" : "border-rule-strong bg-surface"
          }`}
        >
          <p className="font-serif text-[19px]">Drop PDFs here</p>
          <p className="text-[13px] text-ink-2">Up to 10 MB each</p>
          <button type="button" className="btn btn-sm" onClick={() => input.current?.click()}>Choose files</button>
          <input ref={input} type="file" accept="application/pdf,.pdf" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} aria-label="Choose PDF files" />
        </div>
        {fileErrors.map((m) => <p key={m} role="alert" className="text-[13px] text-danger">{m}</p>)}
        {files.length > 0 && (
          <ul className="panel divide-y divide-rule">
            {files.map((f) => (
              <li key={f.name + f.size} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
                <span className="min-w-0 truncate">{f.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="data text-ink-2">{mb(f.size)}</span>
                  <button type="button" className="btn btn-quiet btn-sm" onClick={() => setFiles(files.filter((x) => x !== f))} aria-label={`Remove ${f.name}`}>Remove</button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <button className="btn btn-primary" disabled={!!busy}>{busy ? "Uploading…" : "Upload technology"}</button>
        <p role="status" className="text-[13px] text-ink-2">{busy}</p>
        {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
      </div>
    </form>
  );
}

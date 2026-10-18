import { Suspense } from "react";
import { api, getMe } from "@/lib/api";
import { PanelBones } from "@/app/(app)/skeletons";
import type { Category, Dossier, Evidence, EvidenceStatus, Institution, Report, ReviewState, RouteDecision, TechnologyRecord, TriageState } from "@/lib/types";
import { AutoRefresh } from "@/app/(app)/AutoRefresh";
import { IN_PROGRESS, PageHeader } from "@/app/(app)/ui";
import { Context } from "./Context";
import { Eligibility } from "./Eligibility";
import { EvidencePanel } from "./EvidencePanel";
import { Files } from "./Files";
import { extractProgress, registryState, type Run } from "./registry";
import { ReviewRound } from "./ReviewRound";
import { Routing } from "./Routing";
import { SummaryDraft } from "./SummaryDraft";
import { TechCategories } from "./TechCategories";
import { TriagePanel } from "./TriagePanel";
import { PreviewSwitch } from "@/app/_share/PreviewSwitch";
import { Verify } from "./Verify";

export default async function UploadDetail({ params, searchParams }: PageProps<"/uploads/[id]">) {
  const { id } = await params;
  const failed = (await searchParams).failed;
  // one round of parallel requests for the page; the pipeline panels (extraction runs, evidence,
  // triage) fetch inside their own Suspense so they never hold up the fields and eligibility forms
  const [rec, review, categories, me, institutions, summary] = await Promise.all([
    api<TechnologyRecord>(`/technologies/${id}`),
    api<ReviewState>(`/technologies/${id}/review`),
    api<Category[]>("/categories"),
    getMe(),
    api<Institution[]>("/institutions"),
    api<{ draft: string }>(`/technologies/${id}/summary/draft`),
  ]);
  const t = rec.technology;
  const inst = institutions.find((i) => i.id === t.institution_id);
  const uni = inst?.name ?? me.institution_name;
  const processing = rec.documents.some((d) => IN_PROGRESS.has(d.processing_status));

  return (
    <>
      <AutoRefresh active={processing} />
      <PageHeader
        title={t.title}
        lede={[uni, t.originating_department, t.originating_lab].filter(Boolean).join(", ")}
      />
      {typeof failed === "string" && (
        <div role="alert" className="mb-6 rounded-[10px] border border-danger/40 bg-danger-tint p-4 text-[14px]">
          <p className="font-medium text-danger">Some files didn’t upload</p>
          <ul className="mt-1 list-disc pl-5">{failed.split("\n").map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-8">
          {t.summary && <p className="max-w-[70ch] text-[15px] leading-relaxed">{t.summary}</p>}
          {(!t.summary || summary.draft) && <SummaryDraft technologyId={t.id} summary={t.summary} draft={summary.draft} />}
          <PatentStatus patents={rec.patents as Record<string, unknown>[]} />
          <Verify technologyId={t.id} review={review} processing={processing} documents={rec.documents} />
          <Context t={t} />
          <Eligibility technologyId={t.id} stage={t.stage} blocking={review.blocking} permission={t.permission_status}
            decision={rec.eligibility} names={Object.fromEntries(rec.documents.map((d) => [d.id, d.original_filename]))} />
        </div>
        <aside className="flex flex-col gap-8">
          <Suspense fallback={<><PanelBones /><PanelBones lines={2} /></>}>
            <PipelinePanels rec={rec} isAdmin={me.role === "admin"} />
          </Suspense>
          <TechCategories
            technologyId={t.id}
            categories={categories}
            current={t.categories.map((c) => c.id)}
            suggested={rec.suggested_categories.map((c) => c.id)}
          />
          {inst?.public_previews && (
            <section>
              <h2 className="label">Public preview</h2>
              <PreviewSwitch url={`/technologies/${t.id}/public-preview`} on={!t.public_preview_hidden}
                label="Allow a public preview of this technology"
                hint="Turn off for sensitive IP. Analysers can then share it only with other AVP members." />
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

async function PipelinePanels({ rec, isAdmin }: { rec: TechnologyRecord; isAdmin: boolean }) {
  const t = rec.technology;
  const evidenceOpen = !["intake", "eligibility", "ineligible"].includes(t.stage);
  const triageOpen = evidenceOpen && t.stage !== "evidence";
  const roundOpen = isAdmin && !["intake", "eligibility", "ineligible", "evidence", "triage"].includes(t.stage);
  const routed = ["final", "routed"].includes(t.stage);
  const [runs, evidence, triage, quotes, reports, dossier, routes] = await Promise.all([
    Promise.all(rec.documents.map((d) => api<Run[]>(`/documents/${d.id}/extractions`))),
    evidenceOpen ? api<EvidenceStatus[]>(`/technologies/${t.id}/evidence/status`) : [],
    triageOpen ? api<TriageState>(`/technologies/${t.id}/triage`) : null,
    triageOpen ? api<Evidence[]>(`/technologies/${t.id}/evidence`) : [],
    roundOpen ? api<Report[]>(`/technologies/${t.id}/reports`) : [],
    routed ? api<Dossier | null>(`/technologies/${t.id}/dossier`) : null,
    routed ? api<RouteDecision[]>(`/technologies/${t.id}/routing`) : [],
  ]);
  const registry = Object.fromEntries(rec.documents.map((d, i) => [d.id, registryState(runs[i])]));
  const progress = Object.fromEntries(rec.documents.map((d, i) => [d.id, extractProgress(runs[i])]));
  return (
    <>
      {routed && <Routing technologyId={t.id} finalTrl={dossier?.final_trl ?? null} history={routes} />}
      {roundOpen && <ReviewRound technologyId={t.id} stage={t.stage} reports={reports} />}
      {triage && <TriagePanel technologyId={t.id} stage={t.stage} state={triage} evidence={quotes} />}
      {evidenceOpen && <EvidencePanel technologyId={t.id} stage={t.stage} docs={evidence} />}
      <Files technologyId={t.id} documents={rec.documents} registry={registry} progress={progress} />
    </>
  );
}

/** EPO OPS legal status + family size per patent, when the registry lookup found them. */
function PatentStatus({ patents }: { patents: Record<string, unknown>[] }) {
  const rows = patents.filter((p) => p.legal_status || (Array.isArray(p.family) && p.family.length));
  if (!rows.length) return null;
  return (
    <ul className="flex flex-col gap-1 text-[14px] text-ink-2">
      {rows.map((p) => {
        const events = (p.legal_events as { date: string | null; description: string }[]) ?? [];
        const last = events.at(-1);
        return (
          <li key={String(p.id)}>
            <span className="data text-ink">{String(p.patent_number ?? p.publication_number ?? p.application_number)}</span>
            {p.legal_status ? <> · legal status: {String(p.legal_status)}{last?.date && <> ({last.date})</>}</> : null}
            {Array.isArray(p.family) && p.family.length > 0 && <> · {p.family.length} family member{p.family.length === 1 ? "" : "s"}</>}
          </li>
        );
      })}
    </ul>
  );
}

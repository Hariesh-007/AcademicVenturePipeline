import Link from "next/link";
import { Suspense } from "react";
import { api, ApiError, getMe, type Me } from "@/lib/api";
import type { Comment, CompileState, Conflict, Dossier, Evidence, Follows, Institution, Page, Report, Reviews, SeniorDecision, TechnologyRecord, VoteState } from "@/lib/types";
import { FollowButton } from "@/app/_community/FollowButton";
import { captions, withRef } from "@/app/_share/links";
import { ShareButton } from "@/app/_share/ShareButton";
import { show } from "@/lib/format";
import { VoteControl } from "@/app/(app)/library/VoteControl";
import { ReadingProvider, ReadMeter } from "./ReadTimer";
import { Reader } from "./Reader";
import { ReviewPanel } from "./ReviewPanel";
import { DocumentBones, ReviewPanelBones } from "@/app/(app)/skeletons";

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function ReaderPage({ params, searchParams }: PageProps<"/library/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const docParam = sp.doc;
  // only what the header needs blocks the page; the document text and the review panel stream in
  // on their own (Suspense below), so a slow pages.json never holds up the other half
  const [rec, vote, institutions, me, follows, share] = await Promise.all([
    api<TechnologyRecord>(`/technologies/${id}`),
    api<VoteState>(`/technologies/${id}/vote`),
    api<Institution[]>("/institutions"),
    getMe(),
    api<Follows>("/me/follows"),
    api<{ public: boolean; reason: string }>(`/technologies/${id}/share`),
  ]);
  const t = rec.technology;
  const docs = rec.documents.filter((d) => d.processing_status !== "PROCESSING_FAILED");
  const doc = docs.find((d) => d.id === docParam) ?? docs[0];
  const jumpTo = Number(sp.page) || undefined; // evidence links open a page directly
  const docList = docs.map((d) => ({ id: d.id, name: d.original_filename }));
  const tab = typeof sp.tab === "string" ? sp.tab : undefined;
  // every patent on the technology, each on its own line (never just the first one)
  const patents = (rec.patents as Record<string, unknown>[]).map((p) => ({
    id: String(p.id),
    number: String(p.patent_number ?? p.publication_number ?? p.application_number ?? "Patent"),
    detail: [
      p.filing_date && `filed ${date.format(new Date(String(p.filing_date)))}`,
      Array.isArray(p.applicants) && p.applicants.length > 0 && show(p.applicants),
      p.legal_status && `legal status: ${p.legal_status}`,
      Array.isArray(p.family) && p.family.length > 1 && `${p.family.length} family members`,
    ].filter(Boolean).join(", "),
  }));

  return (
    <ReadingProvider technologyId={t.id} seconds={vote.read_seconds ?? 0} min={vote.min_read_seconds ?? 0}
      exempt={me.role === "admin"}>
    <div className="-mx-4 -my-6 sm:-mx-8 lg:-mx-10 lg:-my-8">
      <header className="border-b border-rule bg-surface px-4 py-5 sm:px-8 lg:px-10">
        <Link href="/library" className="text-[13px] text-ink-2 hover:text-ink">Back to library</Link>
        <div className="mt-2 flex items-start gap-5">
          <VoteControl technologyId={t.id} initial={vote} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="font-serif text-[28px] leading-[1.15] tracking-[-0.01em] sm:text-[32px]">{t.title}</h1>
              <div className="flex items-center gap-2">
                <FollowButton type="technology" id={t.id} initial={follows.technologies.some((f) => f.id === t.id)} />
                <ShareButton
                  path={share.public ? withRef(`/t/${t.id}`, me.handle) : `/library/${t.id}`}
                  privateReason={share.public ? undefined : share.reason}
                  caption={captions.technology(t.title, institutions.find((i) => i.id === t.institution_id)?.name ?? "a university")}
                />
              </div>
            </div>
            <p className="mt-1.5 text-[14px] text-ink-2">
              {institutions.find((i) => i.id === t.institution_id)?.name}
              {t.originating_department && `, ${t.originating_department}`}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {t.categories.map((c) => <span key={c.id} className="chip">{c.name}</span>)}
            </div>
            {patents.length > 0 && (
              <ul className="mt-2 flex flex-col gap-0.5">
                {patents.map((p) => (
                  <li key={p.id} className="text-[13px] text-ink-2">
                    <span className="data text-ink">{p.number}</span>{p.detail && <> {p.detail}</>}
                  </li>
                ))}
              </ul>
            )}
            <ReadMeter />
            <Link href={`/feedback?kind=content&from=${encodeURIComponent(`/library/${t.id}`)}`}
              className="mt-2 inline-block text-[13px] text-ink-2 underline-offset-2 hover:text-ink hover:underline">
              Report a problem with this content
            </Link>
          </div>
        </div>
      </header>
      <div className="grid xl:grid-cols-[minmax(0,1fr)_420px]">
        <Suspense key={doc?.id} fallback={<DocumentBones />}>
          <DocumentSection docs={docList} docId={doc?.id} technologyId={t.id} summary={t.summary} jumpTo={jumpTo} />
        </Suspense>
        <Suspense fallback={<ReviewPanelBones />}>
          <ReviewSection technologyId={t.id} stage={t.stage} docs={docList} docId={doc?.id} me={me} tab={tab} />
        </Suspense>
      </div>
    </div>
    </ReadingProvider>
  );
}

async function DocumentSection({ docs, docId, technologyId, summary, jumpTo }: {
  docs: { id: string; name: string }[]; docId?: string; technologyId: string; summary: string; jumpTo?: number;
}) {
  let pages: Page[] = [];
  if (docId) {
    try {
      pages = await api<Page[]>(`/documents/${docId}/pages`);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) throw e;
    }
  }
  return <Reader key={docId} docs={docs} docId={docId} technologyId={technologyId} pages={pages} summary={summary} jumpTo={jumpTo} />;
}

async function ReviewSection({ technologyId, stage, docs, docId, me, tab }: {
  technologyId: string; stage: string; docs: { id: string; name: string }[]; docId?: string; me: Me; tab?: string;
}) {
  const [reviews, evidence] = await Promise.all([
    api<Reviews>(`/technologies/${technologyId}/reviews`),
    // a maintainer browsing another university's record has no evidence access: show none
    api<Evidence[]>(`/technologies/${technologyId}/evidence`).catch((e) => {
      if (e instanceof ApiError && e.status === 404) return [];
      throw e;
    }),
  ]);
  // the thread is only visible after your own review (backend enforces the same rule)
  const reportStage = !["intake", "eligibility", "ineligible", "evidence", "triage"].includes(stage);
  const [comments, reports] = await Promise.all([
    me.role === "admin" || reviews.mine?.submitted_at
      ? api<Comment[]>(`/technologies/${technologyId}/comments`) : Promise.resolve([]),
    reportStage ? api<Report[]>(`/technologies/${technologyId}/reports`) : Promise.resolve([]),
  ]);
  const senior = me.role === "admin" || me.is_senior_reviewer;
  const dossierStage = ["compilation", "senior_review", "final", "routed"].includes(stage);
  // drafts: seniors/admins; approved (final/routed): everyone who can read the record
  const showDossier = dossierStage && (senior || ["final", "routed"].includes(stage));
  const t = `/technologies/${technologyId}`;
  const [eligible, dossier, conflicts, decisions, compile] = await Promise.all([
    senior && reportStage ? api<{ may_act: boolean }>(`${t}/senior-review/eligible`) : { may_act: false },
    showDossier ? api<Dossier | null>(`${t}/dossier`) : null,
    showDossier ? api<Conflict[]>(`${t}/conflicts?open_only=false`) : [],
    showDossier ? api<SeniorDecision[]>(`${t}/senior-review`) : [],
    senior && stage === "compilation" ? api<CompileState>(`${t}/compile`) : null,
  ]);
  return (
    // keyed on ?tab so a notification link switches tabs even on this same page
    <ReviewPanel key={tab ?? "default"} technologyId={technologyId} reviews={reviews} isAdmin={me.role === "admin"}
      canPost={me.role === "admin" || (me.tier !== null && me.tier !== "newcomer")}
      initialTab={tab} comments={comments}
      reports={reportStage ? {
        items: reports, canWrite: stage === "human_review" && me.role === "analyst",
        canComplete: stage === "human_review" && me.is_senior_reviewer && eligible.may_act,
      } : undefined}
      dossier={showDossier ? {
        technologyId, stage, dossier, conflicts, decisions, evidence, mayAct: eligible.may_act, compile,
      } : undefined}
      evidence={{
        technologyId, items: evidence, docId, meId: me.id, docs,
        open: !["intake", "eligibility", "ineligible"].includes(stage),
        canRetractAll: me.role !== "analyst",
      }} />
  );
}

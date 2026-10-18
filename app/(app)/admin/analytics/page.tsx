import Link from "next/link";
import { Suspense, cache } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/app/(app)/ui";
import { Bars, Columns, Section, Stat, StatGrid, Table, compact, fmt, pivot } from "./charts";

type N = number;
type Product = {
  days: N;
  uploads: { institution: string; week: string; n: N }[];
  stages: { stage: string; n: N }[];
  dwell: { stage: string; entered: N; median_days: N }[];
  coverage: { bucket: string; n: N }[];
  reports: { aspect: string; n: N }[];
  activity: { week: string; kind: string; n: N }[];
  active: { week: string; n: N }[];
  people: { signed_up: N; onboarded: N; invited: N; analysts_total: N };
  feedback: { kind: string; status: string; n: N }[];
  open_feedback: N;
};
type Health = "ok" | "warn" | "down" | "unknown";
type System = {
  days: N;
  health: Record<"api" | "database" | "worker" | "queue" | "ai" | "email", Health>;
  database: { size_bytes: N; connections: N; ping_ms: N };
  queue: {
    available: boolean; stalled: N; worker_heartbeat: string | null;
    now: { queue: string; status: string; n: N }[];
    outcomes: { queue: string; type: string; n: N }[];
  };
  processing: {
    intake_documents_total: N; intake_documents_failed_total: N; intake_review_required_total: N;
    intake_ocr_pages_total: N;
    stages: Record<string, { runs: N; failed: N; avg_duration_seconds: N; retries: N }>;
    failures_by_code: { stage: string; code: string; count: N }[];
    provider_lookups: Record<string, N>;
  };
  ai: {
    model: string; key_set: boolean;
    key: {
      usage?: N; limit?: N | null; limit_remaining?: N | null; is_free_tier?: boolean;
      free_model_daily_requests?: { used: N; limit: N; remaining: N } | null;
    } | null;
    summary: { calls: N; ok: N; p50_ms: N | null; p95_ms: N | null; prompt_tokens: N; completion_tokens: N; retries_429: N; repaired: N };
    daily: { day: string; calls: N; errors: N; tokens: N | null; p95_ms: N | null }[];
    by_purpose: { purpose: string; calls: N; errors: N }[];
    errors: { kind: string; n: N; last_at: string; last_error: string }[];
    outcomes: { action: string; n: N }[];
  };
};

const STAGES: [string, string][] = [
  ["intake", "Intake"], ["eligibility", "Eligibility"], ["evidence", "Evidence"], ["triage", "Triage"],
  ["human_review", "Human review"], ["compilation", "Compilation"], ["senior_review", "Senior review"],
  ["final", "Final"], ["routed", "Routed"], ["ineligible", "Ineligible"],
];
const ASPECTS: Record<string, string> = {
  technical_trl: "Technical / TRL", ip: "IP", market: "Market", manufacturing: "Manufacturing",
  regulatory: "Regulatory", bottlenecks: "Bottlenecks",
};
const HEALTH_LABEL: Record<keyof System["health"], string> = {
  api: "API", database: "Database", worker: "Worker", queue: "Job queue", ai: "AI (OpenRouter)", email: "Email",
};
const TONE: Record<Health, { text: string; word: string }> = {
  ok: { text: "text-ok", word: "Healthy" },
  warn: { text: "text-orange-ink dark:text-orange", word: "Degraded" },
  down: { text: "text-danger", word: "Down" },
  unknown: { text: "text-ink-3", word: "No data" },
};
const HEALTH_HINT: Partial<Record<keyof System["health"], Partial<Record<Health, string>>>> = {
  email: { warn: "No BREVO_API_KEY: mail is printed to the log" },
  ai: { unknown: "No calls in this window", warn: "Failing calls or daily free quota nearly used", down: "Key missing, quota used up, or most calls failing" },
  worker: { down: "No heartbeat in the last 2 minutes" },
  queue: { warn: "Failed or stalled jobs" },
};
const pct = (a: N, b: N) => (b ? `${fmt.format((a / b) * 100)}%` : "–");
const ms = (v: N | null) => (v == null ? "–" : v >= 1000 ? `${fmt.format(v / 1000)} s` : `${Math.round(v)} ms`);
const bytes = (v: N) => `${compact.format(v / 1024 / 1024)} MB`;
const ago = (iso: string | null) => {
  if (!iso) return "never";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  return s < 90 ? `${s}s ago` : s < 5400 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`;
};
const short = (d: string) => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });

// the health strip and the System tab share one request per render
const getSystem = cache((days: number) => api<System>(`/admin/analytics/system?days=${days}`));

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const sp = await searchParams;
  const tab = sp.tab === "system" ? "system" : "product";
  const days = [7, 30, 90].includes(Number(sp.days)) ? Number(sp.days) : 30;
  const href = (p: { tab?: string; days?: number }) => `/admin/analytics?tab=${p.tab ?? tab}&days=${p.days ?? days}`;
  const chip = (on: boolean) => `chip ${on ? "chip-on" : ""}`;

  return (
    <>
      <PageHeader title="Analytics" lede="How the product is used, and how the system and its AI services are holding up." />
      <nav aria-label="Analytics view" className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="tablist">
          <Link role="tab" aria-selected={tab === "product"} href={href({ tab: "product" })} className={chip(tab === "product")}>Product</Link>
          <Link role="tab" aria-selected={tab === "system"} href={href({ tab: "system" })} className={chip(tab === "system")}>System &amp; AI</Link>
        </div>
        <div className="flex gap-2" aria-label="Time window">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={href({ days: d })} className={chip(days === d)} aria-current={days === d ? "true" : undefined}>{d} days</Link>
          ))}
        </div>
      </nav>
      <Suspense key={`h${days}`} fallback={<StripBones />}>
        <HealthStrip days={days} />
      </Suspense>
      <Suspense key={`${tab}${days}`} fallback={<BodyBones />}>
        {tab === "product" ? <ProductTab days={days} /> : <SystemTab days={days} />}
      </Suspense>
    </>
  );
}

async function HealthStrip({ days }: { days: number }) {
  const { health } = await getSystem(days);
  return (
    <ul aria-label="System health" className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {(Object.keys(HEALTH_LABEL) as (keyof System["health"])[]).map((k) => {
        const t = TONE[health[k]];
        return (
          <li key={k} className="panel px-4 py-3">
            <p className="text-[13px] text-ink-2">{HEALTH_LABEL[k]}</p>
            <p className={`status mt-1.5 ${t.text}`}>{t.word}</p>
            {HEALTH_HINT[k]?.[health[k]] && <p className="mt-1 text-[12px] text-ink-3">{HEALTH_HINT[k]![health[k]]}</p>}
          </li>
        );
      })}
    </ul>
  );
}

async function ProductTab({ days }: { days: number }) {
  const p = await api<Product>(`/admin/analytics/product?days=${days}`);
  const stageCount = Object.fromEntries(p.stages.map((s) => [s.stage, s.n]));
  const dwell = Object.fromEntries(p.dwell.map((d) => [d.stage, d]));
  const total = p.stages.reduce((n, s) => n + s.n, 0);
  const uploads = p.uploads.reduce((n, u) => n + u.n, 0);
  const byInst = pivot(p.uploads, (u) => u.institution, () => "n", (u) => u.n).map((r) => ({ label: r.x, value: r.v.n }))
    .sort((a, b) => b.value - a.value);
  const cov = Object.fromEntries(p.coverage.map((c) => [c.bucket, c.n]));
  const reviewable = (cov["0"] ?? 0) + (cov["1-2"] ?? 0) + (cov["3+"] ?? 0);
  const activeNow = p.active.at(-1)?.n ?? 0;
  const kinds = [...new Set(p.feedback.map((f) => f.kind))];
  const statuses = ["new", "in_progress", "resolved", "wont_fix"];

  return (
    <div className="flex flex-col gap-10">
      <StatGrid>
        <Stat label="Technologies" value={fmt.format(total)} hint="all stages" />
        <Stat label="Uploaded" value={fmt.format(uploads)} hint={`last ${days} days`} />
        <Stat label="Reviewed 3+ times" value={pct(cov["3+"] ?? 0, reviewable)} hint={`of ${reviewable} in the library`} />
        <Stat label="Active analysts" value={fmt.format(activeNow)} hint="this week" />
        <Stat label="New analysts" value={fmt.format(p.people.signed_up)} hint={`${p.people.onboarded} onboarded, ${p.people.invited} invited`} />
        <Stat label="Open feedback" value={fmt.format(p.open_feedback)} tone={p.open_feedback > 20 ? "warn" : undefined} hint="new or in progress" />
      </StatGrid>

      <Section title="Pipeline" note={`Where every technology is now, and the median days spent in each stage (entries in the last ${days} days; still-open stays count up to today).`}>
        <Table head={["Stage", "Now", `Entered (${days}d)`, "Median days"]} rows={STAGES.filter(([k]) => stageCount[k] || dwell[k]).map(([k, label]) => [
          label, fmt.format(stageCount[k] ?? 0), fmt.format(dwell[k]?.entered ?? 0),
          dwell[k] ? fmt.format(dwell[k].median_days) : "–",
        ])} empty="No technologies yet." />
      </Section>

      <div className="grid gap-10 lg:grid-cols-2">
        <Section title="Uploads per university" note={`Technologies registered in the last ${days} days.`}>
          <Bars rows={byInst} />
        </Section>
        <Section title="Review coverage" note="Library technologies by number of submitted analyst reviews.">
          <Bars tone="bg-orange" rows={[
            { label: "No reviews", value: cov["0"] ?? 0 },
            { label: "1–2 reviews", value: cov["1-2"] ?? 0 },
            { label: "3+ reviews", value: cov["3+"] ?? 0 },
          ]} />
        </Section>
      </div>

      <Section title="Activity" note="Weekly votes, open reviews, comments and formal reports.">
        <Columns caption="Weekly activity" points={pivot(p.activity, (a) => short(a.week), (a) => a.kind, (a) => a.n)} series={[
          { key: "votes", label: "Votes", tone: "bg-blue" },
          { key: "reviews", label: "Reviews", tone: "bg-orange" },
          { key: "comments", label: "Comments", tone: "bg-ok" },
          { key: "reports", label: "Formal reports", tone: "bg-ink-3" },
        ]} />
      </Section>

      <div className="grid gap-10 lg:grid-cols-2">
        <Section title="Active analysts per week" note="Read, voted, reviewed or commented that week.">
          <Columns caption="Active analysts per week" points={p.active.map((a) => ({ x: short(a.week), v: { n: a.n } }))}
            series={[{ key: "n", label: "Analysts", tone: "bg-blue" }]} />
        </Section>
        <Section title="Formal reports by aspect" note="Submitted stage-6 reports, all time.">
          <Bars rows={Object.entries(ASPECTS).map(([k, label]) => ({ label, value: p.reports.find((r) => r.aspect === k)?.n ?? 0 }))} />
        </Section>
      </div>

      <Section title="Feedback" note={`Sent in the last ${days} days, by kind and status.`}>
        <Table head={["Kind", "New", "In progress", "Resolved", "Won’t fix"]} rows={kinds.map((k) => [
          k[0].toUpperCase() + k.slice(1),
          ...statuses.map((s) => fmt.format(p.feedback.find((f) => f.kind === k && f.status === s)?.n ?? 0)),
        ])} />
      </Section>
    </div>
  );
}

async function SystemTab({ days }: { days: number }) {
  const sy = await getSystem(days);
  const { ai, queue, processing: pr } = sy;
  const s = ai.summary;
  const tokens = s.prompt_tokens + s.completion_tokens;
  const queues = [...new Set([...queue.now, ...queue.outcomes].map((q) => q.queue))].sort();
  const qn = (q: string, status: string) => queue.now.find((r) => r.queue === q && r.status === status)?.n ?? 0;
  const qo = (q: string, type: string) => queue.outcomes.find((r) => r.queue === q && r.type === type)?.n ?? 0;
  const outcome = (a: string) => ai.outcomes.find((o) => o.action === a)?.n ?? 0;

  return (
    <div className="flex flex-col gap-10">
      <Section title="AI services" note={`OpenRouter, model ${ai.model}. Calls in the last ${days} days.`}>
        <StatGrid>
          <Stat label="Calls" value={fmt.format(s.calls)} />
          <Stat label="Success" value={pct(s.ok, s.calls)} tone={s.calls && s.ok / s.calls < 0.9 ? (s.ok / s.calls < 0.5 ? "bad" : "warn") : undefined} />
          <Stat label="Latency p50 / p95" value={<>{ms(s.p50_ms)} <span className="text-ink-3">/</span> {ms(s.p95_ms)}</>} />
          <Stat label="Tokens" value={compact.format(tokens)} hint={`${compact.format(s.prompt_tokens)} in, ${compact.format(s.completion_tokens)} out`} />
          <Stat label="Rate-limit retries" value={fmt.format(s.retries_429)} hint="429 / 5xx backoffs" tone={s.retries_429 > s.calls ? "warn" : undefined} />
          <Stat label="Needed JSON repair" value={pct(s.repaired, s.calls)} />
        </StatGrid>
        <Columns caption="AI calls per day" points={ai.daily.map((d) => ({ x: short(d.day), v: { ok: d.calls - d.errors, errors: d.errors } }))} series={[
          { key: "ok", label: "Succeeded", tone: "bg-blue" },
          { key: "errors", label: "Failed", tone: "bg-danger" },
        ]} />
        <div className="grid gap-6 lg:grid-cols-2">
          <Table head={["Purpose", "Calls", "Failed"]} rows={ai.by_purpose.map((b) => [b.purpose, fmt.format(b.calls), fmt.format(b.errors)])} />
          <Table head={["Pipeline outcome", "Count"]} rows={[
            ["Evidence extracted", outcome("EVIDENCE_EXTRACTED")], ["Evidence failed", outcome("EVIDENCE_FAILED")],
            ["Triage done", outcome("TRIAGE_DONE")], ["Triage failed", outcome("TRIAGE_FAILED")],
            ["Triage skipped (unpublished)", outcome("TRIAGE_SKIPPED")],
          ].map(([l, n]) => [l, fmt.format(n as number)])} />
        </div>
        {ai.errors.length > 0 && (
          <Table head={["Error", "Count", "Last seen"]} rows={ai.errors.map((e) => [
            <span key="e" className="block max-w-[60ch]"><span className="font-medium">{e.kind}</span><span className="mt-0.5 block truncate text-[13px] text-ink-2" title={e.last_error}>{e.last_error}</span></span>,
            fmt.format(e.n), ago(e.last_at),
          ])} />
        )}
        <p className="text-[13px] text-ink-2">
          {!ai.key_set ? "No OPENROUTER_API_KEY is set, so no AI runs." : ai.key ? (
            <>OpenRouter key: {ai.key.is_free_tier ? "free tier" : "paid"}, ${fmt.format(ai.key.usage ?? 0)} used
              {ai.key.limit != null && <> of ${fmt.format(ai.key.limit)} (${fmt.format(ai.key.limit_remaining ?? 0)} left)</>}.
              {ai.key.free_model_daily_requests && <> Free-model requests today: {ai.key.free_model_daily_requests.used} of {ai.key.free_model_daily_requests.limit} ({ai.key.free_model_daily_requests.remaining} left).</>}</>
          ) : "OpenRouter didn’t answer the key check just now."}
        </p>
      </Section>

      <Section title="Job queue" note={queue.available ? `Worker heartbeat ${ago(queue.worker_heartbeat)}. ${queue.stalled} job(s) running over 15 min with no live worker.` : "Queue tables aren’t set up in this database."}>
        <Table head={["Queue", "Waiting", "Running", "Failed now", `Done (${days}d)`, `Failed (${days}d)`, `Retried (${days}d)`]} rows={queues.map((q) => [
          q, fmt.format(qn(q, "todo")), fmt.format(qn(q, "doing")), fmt.format(qn(q, "failed")),
          fmt.format(qo(q, "succeeded")), fmt.format(qo(q, "failed")), fmt.format(qo(q, "deferred_for_retry")),
        ])} empty="No jobs yet." />
      </Section>

      <Section title="Document processing" note="Every upload’s path through validate → extract → classify → parse → enrich → reconcile, all time.">
        <StatGrid>
          <Stat label="Documents" value={fmt.format(pr.intake_documents_total)} />
          <Stat label="Failed" value={fmt.format(pr.intake_documents_failed_total)} tone={pr.intake_documents_failed_total ? "warn" : undefined} />
          <Stat label="Awaiting field check" value={fmt.format(pr.intake_review_required_total)} />
          <Stat label="OCR pages" value={fmt.format(pr.intake_ocr_pages_total)} />
          <Stat label="Database" value={bytes(sy.database.size_bytes)} hint={`${sy.database.connections} connections, ping ${sy.database.ping_ms} ms`} />
          <Stat label="Patent lookups" value={fmt.format(Object.values(pr.provider_lookups).reduce((a, b) => a + b, 0))}
            hint={Object.entries(pr.provider_lookups).map(([k, v]) => `${k.split(":")[1]} ${v}`).join(", ") || "none yet"} />
        </StatGrid>
        <Table head={["Stage", "Runs", "Failed", "Avg time", "Retries"]} rows={Object.entries(pr.stages).map(([k, v]) => [
          k, fmt.format(v.runs), `${fmt.format(v.failed)} (${pct(v.failed, v.runs)})`, ms(v.avg_duration_seconds * 1000), fmt.format(v.retries),
        ])} empty="No documents processed yet." />
        {pr.failures_by_code.length > 0 && (
          <Table head={["Failure", "Stage", "Count"]} rows={pr.failures_by_code.map((f) => [f.code, f.stage, fmt.format(f.count)])} />
        )}
      </Section>
    </div>
  );
}

function StripBones() {
  return (
    <div aria-busy="true" aria-label="Loading" className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-[74px]" />)}
    </div>
  );
}

function BodyBones() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-[84px]" />)}
      </div>
      <div className="skeleton h-56 w-full" />
      <div className="grid gap-10 lg:grid-cols-2"><div className="skeleton h-44" /><div className="skeleton h-44" /></div>
    </div>
  );
}

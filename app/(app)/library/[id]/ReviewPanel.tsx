"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { send } from "@/lib/client";
import { DIMENSIONS, GOOD_REVIEW, RED_FLAGS, VERDICTS } from "@/lib/rubric";
import { TRL_LEVELS } from "@/lib/trl";
import type { AnalystReview, Comment, Report, Reviews } from "@/lib/types";
import { TierBadge, tierLabel } from "@/app/_profile/Credibility";
import { Discussion } from "./Discussion";
import { Dossier } from "./Dossier";
import { EvidenceList } from "./Evidence";
import { Reports } from "./Reports";
import { clock, useRead } from "./ReadTimer";

type Draft = Pick<AnalystReview, "verdict" | "novelty" | "productisation" | "feasibility" | "market" | "trl" | "body">;
const EMPTY: Draft = { verdict: null, novelty: null, productisation: null, feasibility: null, market: null, trl: null, body: "" };
const SCORE_KEYS = ["novelty", "productisation", "feasibility", "market"] as const;
const verdictLabel = (v: string | null) => VERDICTS.find((x) => x.value === v)?.label ?? "—";
const time = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" });

/** Peer credit: the only way reputation is earned. Optimistic, rolled back on error. */
function HelpfulButton({ review, canMark }: { review: AnalystReview; canMark: boolean }) {
  const [state, setState] = useState({ count: review.helpful_count, marked: review.marked_helpful });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function toggle() {
    const prev = state;
    setBusy(true);
    setError("");
    setState({ count: prev.count + (prev.marked ? -1 : 1), marked: !prev.marked });
    try {
      setState(await send<{ count: number; marked: boolean }>(`/reviews/${review.id}/helpful`, { method: prev.marked ? "DELETE" : "PUT" }));
    } catch (e) {
      setState(prev);
      setError(e instanceof Error ? e.message : "Couldn't save that");
    } finally {
      setBusy(false);
    }
  }
  if (!canMark) return state.count > 0 ? <p className="mt-2 text-[13px] text-ink-2">{state.count} found this helpful</p> : null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button type="button" aria-pressed={state.marked} disabled={busy} onClick={toggle}
        className={`btn btn-sm ${state.marked ? "border-transparent bg-blue-tint text-blue" : "btn-quiet"}`}>
        Helpful{state.count > 0 && <span className="data text-[12.5px]">{state.count}</span>}
      </button>
      {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
    </div>
  );
}

function anchor(key: (typeof SCORE_KEYS)[number], n: number | null) {
  if (!n) return "";
  const a = DIMENSIONS.find((d) => d.key === key)!.anchors;
  return a[n as 1 | 3 | 5] ?? (n === 2 ? `Between 1 and 3, leaning low: ${a[1]}` : `Between 3 and 5, leaning high: ${a[5]}`);
}

function ReviewForm({ technologyId, mine }: { technologyId: string; mine: AnalystReview | null }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(mine ?? EMPTY);
  const [status, setStatus] = useState(mine?.submitted_at ? "Submitted" : mine ? "Draft saved" : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitted = !!mine?.submitted_at;
  const read = useRead();
  const locked = !submitted && read !== null && !read.ok; // drafts still save while locked
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<Draft | null>(null); // typed but not yet autosaved

  // leaving the page inside the debounce window still saves the last change
  useEffect(() => () => {
    if (pending.current) void send(`/technologies/${technologyId}/review`, { method: "PUT", json: { ...pending.current, submit: false } }).catch(() => {});
  }, [technologyId]);

  const set = (patch: Partial<Draft>) => {
    dirty.current = true;
    setD((x) => ({ ...x, ...patch }));
  };

  // drafts save themselves; a submitted review only changes when you press Update
  useEffect(() => {
    if (submitted || !dirty.current) return;
    clearTimeout(timer.current);
    pending.current = d;
    timer.current = setTimeout(async () => {
      pending.current = null;
      try {
        await send(`/technologies/${technologyId}/review`, { method: "PUT", json: { ...d, submit: false } });
        setStatus(`Draft saved ${time.format(new Date())}`);
      } catch (e) {
        setStatus("");
        setError(e instanceof Error ? e.message : "Couldn't save the draft");
      }
    }, 1200);
    return () => clearTimeout(timer.current);
  }, [d, submitted, technologyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearTimeout(timer.current);
    pending.current = null;
    setBusy(true);
    setError("");
    try {
      await send(`/technologies/${technologyId}/review`, { method: "PUT", json: { ...d, submit: true } });
      setStatus(submitted ? "Review updated" : "Submitted");
      dirty.current = false;
      router.refresh(); // unlocks other analysers' reviews
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <fieldset>
        <legend className="label">Verdict</legend>
        <div className="grid grid-cols-3 gap-1 rounded-md border border-rule-strong p-1">
          {VERDICTS.map((v) => (
            <label key={v.value} title={v.hint}
              className={`cursor-pointer rounded px-2 py-2 text-center text-[13px] font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue ${
                d.verdict === v.value
                  ? v.value === "promising" ? "bg-blue text-blue-ink" : v.value === "needs_work" ? "bg-orange text-orange-ink" : "bg-ink text-canvas"
                  : "text-ink-2 hover:bg-sunken"
              }`}>
              <input type="radio" name="verdict" className="sr-only" checked={d.verdict === v.value} onChange={() => set({ verdict: v.value })} />
              {v.label}
            </label>
          ))}
        </div>
        {d.verdict && <p className="hint">{VERDICTS.find((v) => v.value === d.verdict)?.hint}</p>}
      </fieldset>

      {SCORE_KEYS.map((key) => {
        const dim = DIMENSIONS.find((x) => x.key === key)!;
        return (
          <fieldset key={key}>
            <legend className="label">{dim.label} <span className="font-normal text-ink-2">— {dim.question}</span></legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n}
                  className={`grid h-9 flex-1 cursor-pointer place-items-center rounded-md border text-[14px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue ${
                    d[key] === n ? "border-blue bg-blue-tint font-semibold text-blue" : "border-rule-strong text-ink-2 hover:border-ink-2"
                  }`}>
                  <input type="radio" name={key} className="sr-only" checked={d[key] === n} onChange={() => set({ [key]: n })} aria-label={`${dim.label} ${n} of 5`} />
                  {n}
                </label>
              ))}
            </div>
            {d[key] && <p className="hint">{anchor(key, d[key])}</p>}
          </fieldset>
        );
      })}

      <div>
        <label className="label" htmlFor="trl">Technology readiness level</label>
        <select id="trl" className="input" value={d.trl ?? ""} onChange={(e) => set({ trl: e.target.value ? Number(e.target.value) : null })}>
          <option value="">Choose a TRL</option>
          {TRL_LEVELS.map((l) => <option key={l.n} value={l.n}>TRL {l.n}: {l.title}</option>)}
        </select>
        {d.trl && <p className="hint">Expect to see: {TRL_LEVELS[d.trl - 1].evidence}</p>}
      </div>

      <div>
        <label className="label" htmlFor="body">Your reasoning</label>
        <textarea id="body" rows={8} className="input leading-relaxed" value={d.body} onChange={(e) => set({ body: e.target.value })}
          placeholder="The strongest reason it could succeed, the biggest risk, and what evidence would change your mind." />
        <p className="hint">Cite pages or claims where you can. Others see this after they submit their own review.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" disabled={busy || locked} aria-describedby={locked ? "read-lock" : undefined}>
          {submitted ? "Update review" : "Submit review"}
        </button>
        <span role="status" className="text-[13px] text-ink-2">{status}</span>
        {locked && read && (
          <p id="read-lock" className="hint mt-0 w-full">
            Submitting opens after {clock(read.min)} of reading. Your draft saves as you go.
          </p>
        )}
      </div>
      {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
    </form>
  );
}

function Guidelines() {
  return (
    <div className="flex flex-col gap-6 text-[14px] leading-relaxed">
      <p className="text-ink-2">Score each dimension on its own. A 3 is a real, workable middle, not a polite default.</p>
      {DIMENSIONS.map((dim) => (
        <section key={dim.key}>
          <h3 className="font-serif text-[18px]">{dim.label}</h3>
          <p className="mt-0.5 text-ink-2">{dim.question}</p>
          <dl className="mt-2 flex flex-col gap-1.5">
            {([1, 3, 5] as const).map((n) => (
              <div key={n} className="grid grid-cols-[24px_1fr] gap-2">
                <dt className="data text-ink-2">{n}</dt>
                <dd>{dim.anchors[n]}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[13px] text-ink-2">Look at: {dim.lookFor.join("; ")}.</p>
        </section>
      ))}
      <section>
        <h3 className="font-serif text-[18px]">Red flags</h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {RED_FLAGS.map((r) => <li key={r} className="border-l-2 border-dashed border-orange pl-3">{r}</li>)}
        </ul>
      </section>
      <section>
        <h3 className="font-serif text-[18px]">A useful write-up</h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {GOOD_REVIEW.map((r) => <li key={r} className="border-l-2 border-blue pl-3">{r}</li>)}
        </ul>
      </section>
      <section>
        <h3 className="font-serif text-[18px]">Readiness levels</h3>
        <ol className="mt-2 flex flex-col gap-1.5">
          {TRL_LEVELS.map((l) => (
            <li key={l.n} className="grid grid-cols-[24px_1fr] gap-2"><span className="data text-ink-2">{l.n}</span><span><b className="font-medium">{l.title}.</b> {l.evidence}</span></li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Others({ reviews, isAdmin }: { reviews: Reviews; isAdmin: boolean }) {
  if (!reviews.unlocked) {
    return (
      <div className="rounded-[10px] border border-dashed border-rule-strong p-5 text-[14px]">
        <p className="font-serif text-[18px]">
          {reviews.submitted_count === 0 ? "No reviews yet" : `${reviews.submitted_count} ${reviews.submitted_count === 1 ? "review" : "reviews"} waiting`}
        </p>
        <p className="mt-1 text-ink-2">
          Submit your own review to see what others concluded. Keeping them hidden until then stops the first opinion from steering everyone else.
        </p>
      </div>
    );
  }
  const avg = reviews.averages;
  return (
    <div className="flex flex-col gap-5">
      {reviews.submitted_count > 0 && (
        <section className="panel p-4">
          <p className="text-[13px] text-ink-2">Average of {reviews.submitted_count} {reviews.submitted_count === 1 ? "review" : "reviews"}</p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[14px]">
            {[...SCORE_KEYS, "trl" as const].map((k) => (
              <div key={k} className="flex justify-between">
                <dt className="text-ink-2">{k === "trl" ? "TRL" : DIMENSIONS.find((x) => x.key === k)!.label}</dt>
                <dd className="data">{avg[k] ?? "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[13px] text-ink-2">
            {VERDICTS.map((v) => `${reviews.verdicts[v.value] ?? 0} ${v.label.toLowerCase()}`).join(", ")}
          </p>
        </section>
      )}
      {reviews.others.length === 0 && <p className="text-[14px] text-ink-2">{isAdmin ? "No submitted reviews yet." : "You're the first to review this."}</p>}
      {reviews.others.map((r) => (
        <article key={r.id} className="border-l-2 border-rule-strong pl-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="flex flex-wrap items-center gap-x-2 text-[14px]">
              {r.reviewer_handle
                ? <Link href={`/a/${r.reviewer_handle}`} className="font-medium hover:underline">{r.reviewer_name}</Link>
                : <span className="font-medium">{r.reviewer_name}</span>}
              {r.reviewer_tier && (
                <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-2">
                  <TierBadge tier={r.reviewer_tier} size={16} />{tierLabel(r.reviewer_tier)}
                </span>
              )}
            </p>
            <p className="text-[13px] text-ink-2">{verdictLabel(r.verdict)}</p>
          </div>
          <p className="data mt-1 text-ink-2">
            N {r.novelty} · P {r.productisation} · F {r.feasibility} · M {r.market} · TRL {r.trl}
          </p>
          <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed">{r.body}</p>
          <HelpfulButton review={r} canMark={!isAdmin} />
        </article>
      ))}
    </div>
  );
}

export function ReviewPanel({ technologyId, reviews, isAdmin, canPost, initialTab, comments, evidence, reports, dossier }: {
  technologyId: string; reviews: Reviews; isAdmin: boolean; canPost: boolean; initialTab?: string; comments: Comment[];
  evidence: ComponentProps<typeof EvidenceList>;
  reports?: { items: Report[]; canWrite: boolean; canComplete: boolean }; // only once the technology reaches human review
  dossier?: ComponentProps<typeof Dossier>; // seniors/admins from compilation on, everyone once approved
}) {
  const tabs = [
    ...(isAdmin ? [] : [{ key: "review", label: reviews.mine?.submitted_at ? "Your review" : "Review" }]),
    { key: "evidence", label: `Evidence (${evidence.items.length})` },
    ...(reports ? [{ key: "reports", label: "Formal report" }] : []),
    ...(dossier ? [{ key: "dossier", label: "Dossier" }] : []),
    { key: "guide", label: "Guidelines" },
    { key: "others", label: `Others (${reviews.submitted_count - (reviews.mine?.submitted_at ? 1 : 0)})` },
    { key: "discussion", label: "Discussion" },
  ];
  const [tab, setTab] = useState(tabs.some((t) => t.key === initialTab) ? initialTab! : tabs[0].key);

  return (
    <aside aria-label="Review" className="border-l border-rule bg-surface xl:sticky xl:top-0 xl:h-screen xl:overflow-y-auto">
      <div role="tablist" className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-rule bg-surface px-4 pt-3">
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`-mb-px shrink-0 border-b-2 px-3 pb-2.5 text-[14px] ${tab === t.key ? "border-blue font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-5" role="tabpanel">
        {/* hidden, not unmounted: switching tabs must keep unsaved choices and the pending autosave */}
        {tabs[0].key === "review" && (
          <div hidden={tab !== "review"}><ReviewForm technologyId={technologyId} mine={reviews.mine} /></div>
        )}
        {tab === "evidence" && <EvidenceList {...evidence} />}
        {tab === "reports" && reports && (
          <Reports technologyId={technologyId} reports={reports.items} evidence={evidence.items} meId={evidence.meId}
            canWrite={reports.canWrite} canComplete={reports.canComplete} />
        )}
        {tab === "dossier" && dossier && <Dossier {...dossier} />}
        {tab === "guide" && <Guidelines />}
        {tab === "others" && <Others reviews={reviews} isAdmin={isAdmin} />}
        {tab === "discussion" && (
          <Discussion technologyId={technologyId} canSee={isAdmin || Boolean(reviews.mine?.submitted_at)} canPost={canPost} initial={comments} />
        )}
      </div>
    </aside>
  );
}

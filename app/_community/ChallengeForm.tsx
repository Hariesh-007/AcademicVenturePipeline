"use client";

// Admins publish straight away; Fellows send a proposal to the admins' queue.
import { send } from "@/lib/client";
import type { Category } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";

export function ChallengeForm({ categories, mode }: { categories: Category[]; mode: "publish" | "propose" }) {
  const act = useAction();
  const today = new Date().toISOString().slice(0, 10);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const json = {
      title: f.get("title"), description: f.get("description"), category_id: f.get("category_id"),
      goal: Number(f.get("goal")),
      starts_at: `${f.get("starts")}T00:00:00Z`, ends_at: `${f.get("ends")}T23:59:59Z`,
    };
    const done = mode === "publish" ? "Published. It's live in the library." : "Sent to the admins for review.";
    if (await act.run(() => send("/challenges", { json }), done)) form.reset();
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="ch-title">Title</label>
        <input id="ch-title" name="title" required minLength={3} maxLength={120} className="input" placeholder="AgriTech October" />
      </div>
      <div>
        <label className="label" htmlFor="ch-desc">What it&apos;s for <span className="font-normal text-ink-2">(optional)</span></label>
        <textarea id="ch-desc" name="description" maxLength={1000} rows={2} className="input"
          placeholder="Give every new agriculture invention a first reading before the funding round." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="ch-cat">Category</label>
          <select id="ch-cat" name="category_id" required className="input" defaultValue="">
            <option value="" disabled>Choose one</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ch-goal">Goal (reviews)</label>
          <input id="ch-goal" name="goal" type="number" min={1} max={10000} required defaultValue={20} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="ch-start">Starts</label>
          <input id="ch-start" name="starts" type="date" required defaultValue={today} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="ch-end">Ends</label>
          <input id="ch-end" name="ends" type="date" required min={today} className="input" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" disabled={act.busy}>{mode === "publish" ? "Publish challenge" : "Send proposal"}</button>
        <Feedback error={act.error} done={act.done} />
      </div>
    </form>
  );
}

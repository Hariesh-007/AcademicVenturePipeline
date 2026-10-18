import { api } from "@/lib/api";
import type { Category, Challenge } from "@/lib/types";
import { ChallengeForm } from "@/app/_community/ChallengeForm";
import { PageHeader } from "@/app/(app)/ui";
import { Decide } from "./Decide";

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const STATUS = { proposed: "Waiting for you", published: "Published", rejected: "Rejected" };

export default async function ChallengesPage() {
  const [all, categories] = await Promise.all([api<Challenge[]>("/admin/challenges"), api<Category[]>("/categories")]);
  const queue = all.filter((c) => c.status === "proposed");
  return (
    <>
      <PageHeader title="Challenges" lede="Time-boxed goals the whole community works toward together. Fellows can propose them; you decide what goes live." />
      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <section className="flex flex-col gap-6">
          {queue.length > 0 && (
            <div>
              <h2 className="mb-2 font-serif text-[20px]">Proposals</h2>
              <ul className="flex flex-col gap-2">
                {queue.map((c) => (
                  <li key={c.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                    <span>
                      <span className="font-medium">{c.title}</span>
                      <span className="block text-[13px] text-ink-2">
                        {c.category_name}, goal {c.goal}, {day.format(new Date(c.starts_at))} to {day.format(new Date(c.ends_at))}
                        {c.proposed_by_name && `. Proposed by ${c.proposed_by_name}`}
                      </span>
                    </span>
                    <Decide id={c.id} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="panel overflow-x-auto">
            <table className="table">
              <thead><tr><th>Challenge</th><th>Window</th><th>Progress</th><th>Status</th></tr></thead>
              <tbody>
                {all.map((c) => (
                  <tr key={c.id}>
                    <td><p className="font-medium">{c.title}</p><p className="text-[13px] text-ink-2">{c.category_name}</p></td>
                    <td className="text-ink-2">{day.format(new Date(c.starts_at))} to {day.format(new Date(c.ends_at))}</td>
                    <td className="data">{c.progress}/{c.goal}</td>
                    <td>{STATUS[c.status]}</td>
                  </tr>
                ))}
                {all.length === 0 && <tr><td colSpan={4} className="text-ink-2">No challenges yet. Publish the first one.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel h-fit p-5">
          <h2 className="mb-4 font-serif text-[20px]">New challenge</h2>
          <ChallengeForm categories={categories} mode="publish" />
        </section>
      </div>
    </>
  );
}

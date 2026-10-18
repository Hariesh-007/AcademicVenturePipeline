import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { SeniorQueueRow } from "@/lib/types";
import { Empty, PageHeader } from "@/app/(app)/ui";

export const metadata: Metadata = { title: "Senior review · AVP" };

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

/** Shared queue: every dossier awaiting senior review that you're independent of. The first
 *  senior reviewer to decide closes it. */
export default async function SeniorQueue() {
  const rows = await api<SeniorQueueRow[]>("/senior-review/queue");
  return (
    <>
      <PageHeader title="Senior review"
        lede="Draft dossiers waiting for a final decision. You only see technologies you're independent of: not your university's, and none you wrote a formal report on." />
      {rows.length === 0 ? (
        <Empty title="Nothing waiting">You’ll get an inbox note and an email when a dossier is ready.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/library/${r.id}?tab=dossier`} className="panel panel-interactive flex flex-wrap items-baseline justify-between gap-2 p-4 hover:border-rule-strong">
                <span>
                  <span className="block font-medium">{r.title}</span>
                  <span className="text-[13px] text-ink-2">{r.institution_name}</span>
                </span>
                <span className="text-[13px] text-ink-2">
                  Proposed TRL {r.draft_trl ?? "—"}
                  {r.open_conflicts > 0 && <span className="text-orange-ink dark:text-orange"> · {r.open_conflicts} disagreement{r.open_conflicts === 1 ? "" : "s"}</span>}
                  {r.waiting_since && <> · since {date.format(new Date(r.waiting_since))}</>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

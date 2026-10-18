import Link from "next/link";
import type { TechnologyRow } from "@/lib/types";
import { AutoRefresh } from "./AutoRefresh";
import { IN_PROGRESS, ProcessingStatus } from "./ui";

/** Worst status first: failed > needs verification > processing > ready. */
function overall(statuses: string[]) {
  for (const s of ["PROCESSING_FAILED", "REVIEW_REQUIRED"]) if (statuses.includes(s)) return s;
  return statuses.find((s) => IN_PROGRESS.has(s)) ?? statuses[0];
}

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function TechnologyTable({ rows, institutions }: { rows: TechnologyRow[]; institutions?: Record<string, string> }) {
  const busy = rows.some((r) => r.document_statuses.some((s) => IN_PROGRESS.has(s)));
  return (
    <div className="panel overflow-x-auto">
      <AutoRefresh active={busy} />
      <table className="table">
        <thead>
          <tr>
            <th>Technology</th>
            {institutions && <th>University</th>}
            <th>Files</th>
            <th>Processing</th>
            <th>Added</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const st = overall(t.document_statuses);
            return (
              <tr key={t.id}>
                <td className="max-w-[420px]">
                  <Link href={`/uploads/${t.id}`} className="font-medium hover:text-blue hover:underline underline-offset-4">
                    {t.title}
                  </Link>
                  {t.categories.length > 0 && (
                    <p className="mt-1 truncate text-[13px] text-ink-2">{t.categories.map((c) => c.name).join(", ")}</p>
                  )}
                </td>
                {institutions && <td className="text-ink-2">{institutions[t.institution_id]}</td>}
                <td className="data">{t.document_statuses.length}</td>
                <td>{st ? <ProcessingStatus status={st} /> : <span className="text-[13px] text-orange-ink dark:text-orange">No file yet</span>}</td>
                <td className="whitespace-nowrap text-ink-2">{date.format(new Date(t.created_at))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

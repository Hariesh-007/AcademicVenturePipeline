import Link from "next/link";
import { api } from "@/lib/api";
import type { FeedbackItem } from "@/lib/types";
import { Empty, PageHeader } from "@/app/(app)/ui";
import { KINDS, STATUS, when } from "@/app/(app)/feedback/labels";
import { ReplyBox, StatusSelect } from "./StatusSelect";

const PAGE = 50;

export default async function AdminFeedbackPage({ searchParams }: PageProps<"/admin/feedback">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const kind = typeof sp.kind === "string" ? sp.kind : "";
  const offset = Math.max(0, Number(sp.offset) || 0);
  // one extra row tells us whether a next page exists
  const q = new URLSearchParams(Object.entries({ status, kind, limit: String(PAGE + 1), offset: String(offset) }).filter(([, v]) => v));
  const rows = await api<FeedbackItem[]>(`/admin/feedback?${q}`);
  const items = rows.slice(0, PAGE);
  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams(Object.entries({ status, kind, offset: "", ...patch }).filter(([, v]) => v && v !== "0"));
    return `/admin/feedback${p.size ? `?${p}` : ""}`;
  };
  const chip = (on: boolean) => `chip ${on ? "chip-on" : ""}`;

  return (
    <>
      <PageHeader title="Feedback" lede="Bugs, ideas and content problems from analysers, maintainers and admins. Set a status so the sender knows where it stands." />
      <nav aria-label="Filter feedback" className="mb-6 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Link href={href({ status: "" })} className={chip(!status)}>Any status</Link>
          {Object.entries(STATUS).map(([v, s]) => (
            <Link key={v} href={href({ status: v })} className={chip(status === v)}>{s.label}</Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={href({ kind: "" })} className={chip(!kind)}>Any kind</Link>
          {KINDS.map((k) => (
            <Link key={k.value} href={href({ kind: k.value })} className={chip(kind === k.value)}>{k.label}</Link>
          ))}
        </div>
      </nav>
      {items.length === 0 ? (
        <Empty title={status || kind ? "Nothing matches these filters" : "No feedback yet"}>
          {status || kind ? "Clear a filter to see more." : "When someone sends feedback from any page, it lands here."}
        </Empty>
      ) : (
        <ul className="panel divide-y divide-rule">
          {items.map((f) => (
            <li key={f.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="text-[15px] font-medium">{f.subject}</p>
                <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed">{f.body}</p>
                <p className="mt-2 text-[13px] text-ink-2">
                  {KINDS.find((k) => k.value === f.kind)?.label}, from {f.author_name} ({f.author_role}), {when.format(new Date(f.created_at))}
                  {f.page_url && <>, on <Link href={f.page_url} className="data underline-offset-2 hover:underline">{f.page_url}</Link></>}
                </p>
                {f.reply && (
                  <p className="mt-2 whitespace-pre-line border-l-2 border-rule-strong pl-3 text-[14px] text-ink-2">{f.reply}</p>
                )}
                <div className="mt-2"><ReplyBox id={f.id} reply={f.reply} /></div>
              </div>
              <StatusSelect id={f.id} status={f.status} />
            </li>
          ))}
        </ul>
      )}
      {(offset > 0 || rows.length > PAGE) && (
        <nav aria-label="Pages" className="mt-4 flex justify-between text-[14px]">
          {offset > 0 ? <Link className="btn btn-sm" href={href({ offset: String(Math.max(0, offset - PAGE)) })}>Newer</Link> : <span />}
          {rows.length > PAGE && <Link className="btn btn-sm" href={href({ offset: String(offset + PAGE) })}>Older</Link>}
        </nav>
      )}
    </>
  );
}

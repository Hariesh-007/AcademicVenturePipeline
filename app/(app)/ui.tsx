// Small shared pieces for app pages. Styling lives in globals.css (.btn, .panel, .chip ...).
import Link from "next/link";
import { Reveal } from "@/app/ui/motion/Reveal";

export function PageHeader({ title, lede, actions }: { title: string; lede?: string; actions?: React.ReactNode }) {
  return (
    <Reveal className="app-page-header mb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[68ch]">
          <h1 className="font-serif text-[30px] leading-[1.15] tracking-[-0.01em]">{title}</h1>
          {lede && <p className="mt-2 text-[15px] text-ink-2">{lede}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </header>
    </Reveal>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Reveal>
      <div className="rounded-[10px] border border-dashed border-rule-strong px-6 py-12 text-center">
        <p className="font-serif text-[20px]">{title}</p>
        {children && <div className="mx-auto mt-2 max-w-[52ch] text-[14px] text-ink-2">{children}</div>}
      </div>
    </Reveal>
  );
}

const PROCESSING: Record<string, { label: string; tone: string }> = {
  UPLOADED: { label: "Queued", tone: "text-ink-2" },
  VALIDATING: { label: "Checking file", tone: "text-blue" },
  EXTRACTING: { label: "Reading text", tone: "text-blue" },
  ENRICHING: { label: "Looking up patent", tone: "text-blue" },
  NORMALIZING: { label: "Tidying fields", tone: "text-blue" },
  VALIDATING_FIELDS: { label: "Checking fields", tone: "text-blue" },
  REVIEW_REQUIRED: { label: "Ready, verify fields", tone: "text-orange-ink dark:text-orange" },
  PROCESSING_FAILED: { label: "Failed, retry", tone: "text-danger" },
};

export const IN_PROGRESS = new Set(["UPLOADED", "VALIDATING", "EXTRACTING", "ENRICHING", "NORMALIZING", "VALIDATING_FIELDS"]);

export function ProcessingStatus({ status }: { status: string }) {
  const s = PROCESSING[status] ?? { label: status.toLowerCase(), tone: "text-ink-2" };
  const spinning = IN_PROGRESS.has(status);
  return <span className={`status ${s.tone} ${spinning ? "status-spinner" : ""}`}>{s.label}</span>;
}

export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-64" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-12 w-full" />
      ))}
    </div>
  );
}

export const PAGE = 50;

/** Reads ?offset= and returns the API query for one page (PAGE + 1 rows: the extra one only
 *  tells us there is a next page). */
export function pageOf(sp: Record<string, string | string[] | undefined>) {
  const offset = Math.max(0, Number(sp.offset) || 0);
  return { offset, query: `limit=${PAGE + 1}&offset=${offset}` };
}

export function Pager({ path, offset, count }: { path: string; offset: number; count: number }) {
  if (offset === 0 && count <= PAGE) return null;
  const to = (o: number) => (o > 0 ? `${path}?offset=${o}` : path);
  return (
    <nav aria-label="Pages" className="mt-4 flex justify-between">
      {offset > 0 ? <Link className="btn btn-sm" href={to(Math.max(0, offset - PAGE))}>Previous</Link> : <span />}
      {count > PAGE && <Link className="btn btn-sm" href={to(offset + PAGE)}>Next</Link>}
    </nav>
  );
}

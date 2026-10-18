// Loading shapes that mirror each page's real layout, so content lands where the bones were.
// Used by the route loading.tsx files and as Suspense fallbacks for sections that stream in.

const B = ({ c }: { c: string }) => <div className={`skeleton ${c}`} />;

function Busy({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div aria-busy="true" aria-label="Loading" className={className}>{children}</div>;
}

/** PageHeader: serif title + one-line lede (+ an action button). */
export function HeaderBones({ action = false }: { action?: boolean }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div className="flex w-full max-w-[68ch] flex-col gap-3">
        <B c="h-8 w-56" />
        <B c="h-4 w-full max-w-[52ch]" />
      </div>
      {action && <B c="h-9 w-28 shrink-0" />}
    </div>
  );
}

/** Library rows: vote column, serif title, meta line, two summary lines. */
export function LibraryRowsBones({ rows = 6 }: { rows?: number }) {
  return (
    <Busy>
      <B c="mb-2 h-3.5 w-48" />
      <ol className="panel divide-y divide-rule">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex gap-4 px-3 py-4 sm:gap-6 sm:px-5">
            <div className="flex w-9 flex-col items-center gap-1.5"><B c="h-5 w-5" /><B c="h-4 w-6" /><B c="h-5 w-5" /></div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <B c="h-5 w-3/5" />
              <B c="h-3.5 w-2/5" />
              <B c="mt-1 h-3.5 w-full max-w-[80ch]" />
              <B c="h-3.5 w-4/5 max-w-[70ch]" />
            </div>
          </li>
        ))}
      </ol>
    </Busy>
  );
}

/** Library page: header, search + filter bar, rows. */
export function LibraryBones() {
  return (
    <Busy>
      <HeaderBones />
      <div className="mb-6 flex flex-wrap gap-2"><B c="h-10 min-w-[240px] flex-1" /><B c="h-10 w-40" /><B c="h-10 w-40" /><B c="h-10 w-32" /></div>
      <LibraryRowsBones />
    </Busy>
  );
}

/** A .table: header row + body rows with `cols` columns (first one wide). */
export function TableBones({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  const widths = ["w-4/5", "w-2/3", "w-1/2", "w-3/5", "w-2/5"];
  return (
    <Busy className="panel overflow-hidden">
      <div className="grid gap-4 border-b border-rule px-4 py-3" style={{ gridTemplateColumns: `2fr repeat(${cols - 1}, 1fr)` }}>
        {Array.from({ length: cols }, (_, i) => <B key={i} c="h-3 w-16" />)}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="grid gap-4 border-b border-rule px-4 py-3.5 last:border-0" style={{ gridTemplateColumns: `2fr repeat(${cols - 1}, 1fr)` }}>
          {Array.from({ length: cols }, (_, i) => <B key={i} c={`h-4 ${widths[(r + i) % widths.length]}`} />)}
        </div>
      ))}
    </Busy>
  );
}

/** List/table pages (uploads, admin lists, feedback). */
export function TablePageBones({ action = false, cols = 5 }: { action?: boolean; cols?: number }) {
  return (
    <Busy>
      <HeaderBones action={action} />
      <TableBones cols={cols} />
    </Busy>
  );
}

/** Reader: the document column (toolbar + paragraphs of text). */
export function DocumentBones() {
  return (
    <Busy className="min-w-0 bg-[var(--reader-bg)]">
      <div className="flex items-center gap-2 border-b border-rule px-4 py-2 sm:px-8">
        <B c="h-7 w-32" /><B c="h-7 w-40" /><div className="ml-auto flex gap-1"><B c="h-7 w-16" /><B c="h-7 w-9" /><B c="h-7 w-9" /></div>
      </div>
      <div className="mx-auto flex max-w-[68ch] flex-col gap-3 px-5 py-10 sm:px-8">
        <B c="mb-6 h-16 w-full" />
        {[0, 1, 2].map((p) => (
          <div key={p} className="mb-6 flex flex-col gap-2.5">
            <B c="h-4 w-full" /><B c="h-4 w-full" /><B c="h-4 w-11/12" /><B c="h-4 w-full" /><B c="h-4 w-3/5" />
          </div>
        ))}
      </div>
    </Busy>
  );
}

/** Reader: the review side panel (tab strip + verdict + score rows). */
export function ReviewPanelBones() {
  return (
    <Busy className="border-l border-rule bg-surface">
      <div className="flex gap-3 border-b border-rule px-4 pt-3 pb-2.5">
        {["w-14", "w-20", "w-20", "w-16", "w-20"].map((w, i) => <B key={i} c={`h-4 ${w}`} />)}
      </div>
      <div className="flex flex-col gap-6 p-5">
        <div className="flex flex-col gap-2"><B c="h-3.5 w-16" /><B c="h-10 w-full" /></div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2"><B c="h-3.5 w-2/3" /><B c="h-9 w-full" /></div>
        ))}
        <div className="flex flex-col gap-2"><B c="h-3.5 w-40" /><B c="h-32 w-full" /></div>
      </div>
    </Busy>
  );
}

/** Reader page: full-bleed header (vote + title + meta), then document | review panel. */
export function ReaderBones() {
  return (
    <Busy className="-mx-4 -my-6 sm:-mx-8 lg:-mx-10 lg:-my-8">
      <div className="border-b border-rule bg-surface px-4 py-5 sm:px-8 lg:px-10">
        <B c="h-3.5 w-28" />
        <div className="mt-3 flex items-start gap-5">
          <div className="flex w-10 flex-col items-center gap-1.5"><B c="h-6 w-6" /><B c="h-5 w-7" /><B c="h-6 w-6" /></div>
          <div className="flex flex-1 flex-col gap-2.5">
            <B c="h-8 w-3/4 max-w-[640px]" /><B c="h-4 w-64" />
            <div className="flex gap-2"><B c="h-6 w-20" /><B c="h-6 w-24" /></div>
            <B c="h-3.5 w-72" /><B c="mt-1 h-2 w-full max-w-[360px]" />
          </div>
        </div>
      </div>
      <div className="grid xl:grid-cols-[minmax(0,1fr)_420px]"><DocumentBones /><ReviewPanelBones /></div>
    </Busy>
  );
}

/** A titled side panel (evidence, triage, files, categories) with a few lines. */
export function PanelBones({ lines = 3 }: { lines?: number }) {
  return (
    <Busy className="flex flex-col gap-3">
      <B c="h-6 w-32" />
      <div className="panel flex flex-col gap-3 p-3">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5"><B c="h-4 w-4/5" /><B c="h-3 w-1/3" /></div>
        ))}
      </div>
    </Busy>
  );
}

/** Upload detail: header, main column of form sections | aside of panels. */
export function UploadDetailBones() {
  return (
    <Busy>
      <HeaderBones />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-8">
          <div className="flex max-w-[70ch] flex-col gap-2"><B c="h-4 w-full" /><B c="h-4 w-11/12" /><B c="h-4 w-2/3" /></div>
          {[5, 3, 2].map((n, s) => (
            <div key={s} className="flex flex-col gap-3">
              <B c="h-6 w-48" />
              {Array.from({ length: n }, (_, i) => <B key={i} c="h-11 w-full" />)}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-8"><PanelBones /><PanelBones lines={2} /><PanelBones lines={2} /></div>
      </div>
    </Busy>
  );
}

/** Account / rewards: header, then label-left | content-right sections. */
export function SectionsBones({ sections = 4 }: { sections?: number }) {
  return (
    <Busy>
      <HeaderBones />
      {Array.from({ length: sections }, (_, s) => (
        <div key={s} className="grid gap-6 border-t border-rule py-8 lg:grid-cols-[240px_1fr]">
          <div className="flex flex-col gap-2"><B c="h-6 w-32" /><B c="h-3.5 w-48" /></div>
          <div className="flex max-w-[640px] flex-col gap-3">
            <B c="h-10 w-full" /><B c="h-10 w-full" /><B c={s % 2 ? "h-24 w-full" : "h-10 w-2/3"} />
          </div>
        </div>
      ))}
    </Busy>
  );
}

/** A form page (new upload, admin settings): labelled fields + a submit button. */
export function FormBones({ fields = 6 }: { fields?: number }) {
  return (
    <Busy>
      <HeaderBones />
      <div className="flex max-w-[640px] flex-col gap-5">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="flex flex-col gap-2"><B c="h-3.5 w-32" /><B c={i === fields - 1 ? "h-24 w-full" : "h-10 w-full"} /></div>
        ))}
        <B c="h-10 w-32" />
      </div>
    </Busy>
  );
}

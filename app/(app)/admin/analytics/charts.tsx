// Tiny chart pieces for analytics. Plain CSS/SVG on the theme tokens, no chart library.
// Every chart also carries its numbers as text (visible labels or an sr-only table).

export const fmt = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });
export const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-serif text-[20px]">{title}</h2>
        {note && <p className="mt-0.5 text-[13px] text-ink-2">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "ok" | "warn" | "bad" }) {
  const color = tone === "bad" ? "text-danger" : tone === "warn" ? "text-orange-ink dark:text-orange" : "";
  return (
    <div className="panel flex flex-col gap-1 px-4 py-3">
      <p className="text-[13px] text-ink-2">{label}</p>
      <p className={`data text-[22px] leading-tight ${color}`}>{value}</p>
      {hint && <p className="text-[12px] text-ink-3">{hint}</p>}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{children}</div>;
}

/** Horizontal bars: one labelled row per item, value at the end. */
export function Bars({ rows, tone = "bg-blue", suffix }: { rows: { label: string; value: number; note?: string }[]; tone?: string; suffix?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-[14px] text-ink-2">Nothing in this window.</p>;
  return (
    <ul className="panel flex flex-col gap-2.5 p-4">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-[14px]">
          <span className="truncate" title={r.label}>{r.label}</span>
          <span className="h-2.5 rounded-sm bg-sunken" aria-hidden>
            <span className={`block h-full rounded-sm ${tone}`} style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="data text-right">
            {fmt.format(r.value)}{suffix}
            {r.note && <span className="ml-2 text-ink-3">{r.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export type Series = { key: string; label: string; tone: string };

/** Stacked columns over time (weeks or days). Keys are drawn bottom-up in `series` order. */
export function Columns({ points, series, caption }: { points: { x: string; v: Record<string, number> }[]; series: Series[]; caption: string }) {
  if (!points.length) return <p className="text-[14px] text-ink-2">Nothing in this window.</p>;
  const total = (p: { v: Record<string, number> }) => series.reduce((n, s) => n + (p.v[s.key] ?? 0), 0);
  const max = Math.max(1, ...points.map(total));
  return (
    <figure className="panel p-4">
      <div className="flex h-36 items-end gap-1.5" aria-hidden>
        {points.map((p) => (
          <div key={p.x} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${p.x}: ${series.map((s) => `${s.label} ${p.v[s.key] ?? 0}`).join(", ")}`}>
            {[...series].reverse().map((s) => (
              <div key={s.key} className={s.tone} style={{ height: `${((p.v[s.key] ?? 0) / max) * 100}%` }} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[12px] text-ink-3" aria-hidden>
        <span>{points[0].x}</span>
        <span>{points[points.length - 1].x}</span>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-sm ${s.tone}`} aria-hidden />
            {s.label} <span className="data">{fmt.format(points.reduce((n, p) => n + (p.v[s.key] ?? 0), 0))}</span>
          </span>
        ))}
      </figcaption>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead><tr><th>Period</th>{series.map((s) => <th key={s.key}>{s.label}</th>)}</tr></thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.x}><td>{p.x}</td>{series.map((s) => <td key={s.key}>{p.v[s.key] ?? 0}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Group rows like {week, kind, n} into stacked-column points. */
export function pivot<T>(rows: T[], x: (r: T) => string, key: (r: T) => string, n: (r: T) => number) {
  const by = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const v = by.get(x(r)) ?? {};
    v[key(r)] = (v[key(r)] ?? 0) + n(r);
    by.set(x(r), v);
  }
  return [...by.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([x, v]) => ({ x, v }));
}

export function Table({ head, rows, empty = "Nothing in this window." }: { head: string[]; rows: React.ReactNode[][]; empty?: string }) {
  if (!rows.length) return <p className="text-[14px] text-ink-2">{empty}</p>;
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-left text-[14px]">
        <thead className="border-b border-rule text-[13px] text-ink-2">
          <tr>{head.map((h, i) => <th key={h} className={`px-4 py-2.5 font-medium ${i ? "text-right" : ""}`}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className={`px-4 py-2.5 ${j ? "data text-right" : ""}`}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

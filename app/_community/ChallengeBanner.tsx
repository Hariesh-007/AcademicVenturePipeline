// Live community challenges: a shared goal, everyone's progress, your part in it.
import Link from "next/link";
import type { Challenge } from "@/lib/types";

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

export function ChallengeBanner({ challenges }: { challenges: Challenge[] }) {
  if (!challenges.length) return null;
  return (
    <section aria-label="Community challenges" className="mb-6 flex flex-col gap-3">
      {challenges.map((c) => (
        <div key={c.id} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[18px] leading-tight">{c.title}</p>
            <p className="mt-0.5 text-[13.5px] text-ink-2">
              {c.description || `Review ${c.category_name} technologies together`}. Ends {day.format(new Date(c.ends_at))}.
            </p>
          </div>
          <div className="w-full sm:w-[260px]">
            <div className="flex justify-between text-[13px]">
              <span><span className="data">{c.progress}</span> of <span className="data">{c.goal}</span> reviews</span>
              <span className="text-ink-2">Yours: <span className="data">{c.my_count}</span></span>
            </div>
            <span className="mt-1.5 block h-1.5 rounded-full bg-sunken" role="progressbar"
              aria-valuemin={0} aria-valuemax={c.goal} aria-valuenow={c.progress} aria-label={`${c.title} progress`}>
              <span className="block h-1.5 rounded-full bg-blue" style={{ width: `${c.percent}%` }} />
            </span>
          </div>
          <Link href={`/library?category=${c.category_id}`} className="btn btn-sm shrink-0">Show {c.category_name}</Link>
        </div>
      ))}
    </section>
  );
}

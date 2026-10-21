"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LibraryRow } from "@/lib/types";
import { Empty } from "@/app/(app)/ui";
import { VoteControl } from "./VoteControl";
import { Stagger, StaggerItem } from "@/app/ui/motion/Stagger";

export function LibraryList({ rows, filtered }: { rows: LibraryRow[]; filtered: boolean }) {
  const router = useRouter();
  const [focus, setFocus] = useState(-1);
  const items = useRef<(HTMLAnchorElement | null)[]>([]);

  // j / k move between technologies, Enter opens (the link itself handles Enter)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || e.metaKey || e.ctrlKey) return;
      if (e.key !== "j" && e.key !== "k") return;
      e.preventDefault();
      setFocus((f) => {
        const n = Math.max(0, Math.min(rows.length - 1, f + (e.key === "j" ? 1 : -1)));
        items.current[n]?.focus();
        return n;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows.length, router]);

  if (!rows.length) {
    return filtered ? (
      <Empty title="Nothing matches">Try fewer words or clear a filter.</Empty>
    ) : (
      <Empty title="The library is empty">Technologies appear here once a university uploads them and their text has been read.</Empty>
    );
  }

  return (
    <>
      <p className="mb-2 text-[13px] text-ink-2 fade-up">
        {rows.length} {rows.length === 1 ? "technology" : "technologies"}. Use <kbd className="font-mono">j</kbd>/<kbd className="font-mono">k</kbd> to move, Enter to open.
      </p>
      <Stagger as="ol" className="panel divide-y divide-rule">
        {rows.map((r, i) => (
          <StaggerItem as="li" key={r.id} className={`flex gap-4 px-3 py-4 sm:gap-6 sm:px-5 ${focus === i ? "bg-sunken/60" : ""}`}>
            <VoteControl technologyId={r.id} initial={r} />
            <div className="min-w-0 flex-1">
              <Link
                ref={(el) => { items.current[i] = el; }}
                href={`/library/${r.id}`}
                onFocus={() => setFocus(i)}
                style={{ viewTransitionName: `tech-title-${r.id}` }}
                className="font-serif text-[19px] leading-snug hover:text-blue transition-colors duration-150"
              >
                {r.title}
              </Link>
              <p className="mt-1 text-[13px] text-ink-2">
                {r.institution_name}
                {r.categories.length > 0 && <> &nbsp;/&nbsp; {r.categories.join(", ")}</>}
              </p>
              {(r.summary || r.abstract) && (
                <p className="mt-2 line-clamp-2 max-w-[80ch] text-[14px] leading-relaxed text-ink/85">{r.summary || r.abstract}</p>
              )}
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-1.5 text-[13px] sm:flex">
              <span className="text-ink-2">
                {r.review_count === 0 ? "No reviews yet" : `${r.review_count} ${r.review_count === 1 ? "review" : "reviews"}`}
              </span>
              {r.reviewed_by_me ? (
                <span className="status text-blue">You reviewed</span>
              ) : (
                <span className="status text-orange-ink dark:text-orange">To review</span>
              )}
              {r.verified && <span className="text-ink-2">Identity confirmed</span>}
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </>
  );
}

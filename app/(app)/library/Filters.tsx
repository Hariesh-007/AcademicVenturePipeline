"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import type { Category, Institution } from "@/lib/types";

type Value = { q: string; category: string; institution: string; sort: string };

export function Filters({ categories, institutions, value }: { categories: Category[]; institutions: Institution[]; value: Value }) {
  const router = useRouter();
  const path = usePathname();
  const search = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pending, startTransition] = useTransition();

  function set(patch: Partial<Value>) {
    const next = { ...value, ...patch };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v && !(k === "sort" && v === "score")) p.set(k, v);
    startTransition(() => router.replace(p.size ? `${path}?${p}` : path, { scroll: false }));
  }

  // "/" jumps to search from anywhere on the page (unless already typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3" aria-busy={pending}>
      <div className="min-w-[260px] flex-[2]">
        <label className="label" htmlFor="lib-q">Search <kbd className="ml-1 rounded border border-rule px-1 font-mono text-[11px] text-ink-2">/</kbd></label>
        <input
          ref={search}
          id="lib-q"
          type="search"
          className="input"
          defaultValue={value.q}
          placeholder="Title, abstract, claims, university…"
          onChange={(e) => {
            clearTimeout(timer.current);
            const q = e.target.value;
            timer.current = setTimeout(() => set({ q }), 300);
          }}
        />
      </div>
      <div className="min-w-[170px] flex-1">
        <label className="label" htmlFor="lib-cat">Category</label>
        <select id="lib-cat" className="input" value={value.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="min-w-[170px] flex-1">
        <label className="label" htmlFor="lib-uni">University</label>
        <select id="lib-uni" className="input" value={value.institution} onChange={(e) => set({ institution: e.target.value })}>
          <option value="">All universities</option>
          {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>
      <div className="min-w-[150px] flex-1">
        <label className="label" htmlFor="lib-sort">Sort by</label>
        <select id="lib-sort" className="input" value={value.sort} onChange={(e) => set({ sort: e.target.value })}>
          <option value="score">Most upvoted</option>
          <option value="newest">Newest</option>
          <option value="reviews">Most reviewed</option>
        </select>
      </div>
    </div>
  );
}

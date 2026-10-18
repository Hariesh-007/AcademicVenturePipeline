"use client";

import type { Category } from "@/lib/types";

/** Toggle chips backed by real checkboxes (keyboard + screen reader friendly). */
export function CategoryPicker({ categories, value, onChange, suggested = [] }: {
  categories: Category[]; value: string[]; onChange: (ids: string[]) => void; suggested?: string[];
}) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const on = value.includes(c.id);
        const hint = !on && suggested.includes(c.id);
        return (
          <label key={c.id} className={`chip cursor-pointer select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue ${on ? "chip-on" : hint ? "chip-suggest" : ""}`}>
            <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(c.id)} />
            {c.name}
            {hint && <span className="text-[11.5px] text-blue">suggested</span>}
          </label>
        );
      })}
    </div>
  );
}

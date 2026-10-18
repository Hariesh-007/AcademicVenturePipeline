"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import type { Category } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";
import { CategoryPicker } from "@/app/(app)/uploads/CategoryPicker";

export function TechCategories({ technologyId, categories, current, suggested }: {
  technologyId: string; categories: Category[]; current: string[]; suggested: string[];
}) {
  const act = useAction();
  const [value, setValue] = useState(current);
  const dirty = value.length !== current.length || value.some((v) => !current.includes(v));

  return (
    <section aria-labelledby="cats-h" className="flex flex-col gap-3">
      <h2 id="cats-h" className="font-serif text-[20px]">Categories</h2>
      {suggested.length > 0 && (
        <p className="text-[13px] text-ink-2">Dashed ones are suggested from the patent’s classification codes.</p>
      )}
      <CategoryPicker categories={categories} value={value} onChange={setValue} suggested={suggested} />
      <div className="flex items-center gap-3">
        <button
          className="btn btn-sm btn-primary"
          disabled={!dirty || act.busy}
          onClick={() => act.run(() => send(`/technologies/${technologyId}/categories`, { method: "PUT", json: value }), "Categories saved.")}
        >
          Save categories
        </button>
        <Feedback error={act.error} done={act.done} />
      </div>
    </section>
  );
}

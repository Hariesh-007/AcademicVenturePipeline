"use client";

import { useState } from "react";
import { send } from "@/lib/client";
import type { Category } from "@/lib/types";
import { Feedback, useAction } from "@/lib/useAction";

export function Categories({ categories }: { categories: Category[] }) {
  const act = useAction();
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = String(new FormData(form).get("name")).trim();
    if (await act.run(() => send("/categories", { json: { name } }), `Added ${name}.`)) form.reset();
  }

  async function handleRename(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name")).trim();
    if (await act.run(() => send(`/categories/${id}`, { method: "PATCH", json: { name } }))) setEditing(null);
  }

  return (
    <div className="flex max-w-[760px] flex-col gap-6">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <label className="label" htmlFor="cat-name">New category</label>
          <input id="cat-name" name="name" className="input" required minLength={2} placeholder="e.g. Water & Sanitation" />
        </div>
        <button className="btn btn-primary" disabled={act.busy}>Add category</button>
      </form>
      <Feedback error={act.error} done={act.done} />
      <ul className="panel divide-y divide-rule">
        {categories.map((c) => (
          <li key={c.id} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
            {editing === c.id ? (
              <form onSubmit={(e) => handleRename(e, c.id)} className="flex flex-1 gap-2">
                <input name="name" defaultValue={c.name} className="input" aria-label="Category name" autoFocus required minLength={2} />
                <button className="btn btn-primary btn-sm">Save</button>
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => setEditing(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <span className="text-[15px]">{c.name}</span>
                {confirming === c.id ? (
                  <span className="flex items-center gap-2 text-[13px] text-ink-2">
                    Removes it from every technology.
                    <button className="btn btn-sm btn-danger" onClick={() => act.run(() => send(`/categories/${c.id}`, { method: "DELETE" }), `Deleted ${c.name}.`)}>
                      Delete
                    </button>
                    <button className="btn btn-quiet btn-sm" onClick={() => setConfirming(null)}>Keep</button>
                  </span>
                ) : (
                  <span className="flex gap-1">
                    <button className="btn btn-quiet btn-sm" onClick={() => setEditing(c.id)}>Rename</button>
                    <button className="btn btn-quiet btn-sm btn-danger" onClick={() => setConfirming(c.id)}>Delete</button>
                  </span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
